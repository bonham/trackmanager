import pg from 'pg';
import type { TrackMetadata, TrackPoint } from './Track.js';
import { Track } from './Track.js';
import { isNextValQueryResult } from './typeguards.js';

const TRACK_TABLENAME = "tracks"
const TRACK_SEQUENCENAME = "tracks_id"
const SEGMENT_TABLENAME = "segments"
const POINTS_TABLENAME = "track_points"
const POINTS_TMP_TABLENAME = "track_points_tmp"


interface DBOpts {
  dbUser: string,
  dbSchema: string,
  dbName: string,
  dbHost: string,
}

class Track2DbWriter {
  dbOptions: DBOpts;

  client: pg.Client;

  tableSegment: string;
  tableTrack: string;
  tablePoint: string;
  tablePointTmp: string;
  sequenceTrack: string;

  constructor(dbOptions: DBOpts) {
    this.dbOptions = dbOptions;

    this.tableTrack = `${this.dbOptions.dbSchema}.${TRACK_TABLENAME}`
    this.tableSegment = `${this.dbOptions.dbSchema}.${SEGMENT_TABLENAME}`
    this.tablePoint = `${this.dbOptions.dbSchema}.${POINTS_TABLENAME}`
    this.tablePointTmp = `${this.dbOptions.dbSchema}.${POINTS_TMP_TABLENAME}`
    this.sequenceTrack = `${this.dbOptions.dbSchema}.${TRACK_SEQUENCENAME}`

    this.client = new pg.Client({
      database: dbOptions.dbName,
      host: dbOptions.dbHost,
      user: dbOptions.dbUser,
    });
  }

  async write(t: Track, fileBufferHash: string): Promise<number> {

    const meta = t.getMetaData();
    await this.client.query('begin transaction')
    try {
      const trackId = await this.getNextTrackId()
      console.log("New track id: " + trackId)

      await this.insertTrackMetadata(trackId, meta, fileBufferHash)

      const segmentList = t.getSegments()
      console.log(`Writing ${segmentList.length} segments for track ${trackId}`)

      for (let segId = 0; segId < segmentList.length; segId++) {

        const segment = segmentList[segId]
        await this.insertSegment(trackId, segId)
        await this.insertPointListForSegment(trackId, segId, segment)
      }
      await this.processAndSimplifyTrack(trackId)
      await this.updateTrackWkbGeometry(trackId)
      await this.updateLengthTime(trackId)
      await this.updateAscentFromSimplifiedPoints(trackId)
      await this.deletePointsFromTmp(trackId)
      await this.client.query('commit')
      return trackId;

    } catch (e) {
      await this.client.query('rollback')
      throw new Error("Error during track creation. Rolling back", { cause: e })
    }
  }

  async insertTrackMetadata(id: number, tmeta: TrackMetadata, fileBufferHash: string): Promise<void> {
    const {
      name, source, totalAscent, totalDistance,
      startTime, durationSeconds,
    } = tmeta;

    const insert = `
    INSERT INTO ${this.dbOptions.dbSchema}.tracks(
      id,
      name, src, hash, "time", length, timelength, ascent)
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8);
    `;
    const values = [
      id, name, source, fileBufferHash,
      startTime, totalDistance, durationSeconds, totalAscent,
    ];

    const res = await this.client.query(insert, values);
    if (res.rowCount !== 1) throw new Error('Insert rowcount is not equal to 1');

  }

  async insertSegment(trackId: number, segId: number): Promise<void> {
    const sql = `insert into ${this.tableSegment} (track_id, track_segment_id) VALUES($1, $2)`
    await this.client.query(sql, [trackId, segId]) // ?
  }

  async insertPointListForSegment(trackId: number, segId: number, tpList: TrackPoint[]): Promise<void> {

    // first insert into temp points table
    // calculate length, timelength, speed
    // then simplify and insert into real points table
    // remove points from temp table

    console.log(`Before simplify: ${tpList.length} points for track id ${trackId}, segment id ${segId}`)

    // insert into temp table
    const sql =
      `insert into ${this.tablePointTmp} ` +
      `( track_id, track_segment_id, segment_point_id, elevation, point_time, wkb_geometry) ` +
      `VALUES($1, $2, $3, $4, $5, ST_GeomFromText($6)) `

    for (let pointIndex = 0; pointIndex < tpList.length; pointIndex++) {
      const point = tpList[pointIndex]
      const parameters = [
        trackId,
        segId,
        pointIndex,
        point.elevation,
        point.point_time,
        `POINT(${point.lon} ${point.lat})`
      ]
      await this.client.query(sql, parameters)
    }
  }

  async processAndSimplifyTrack(trackId: number) {
    // calculate ascent

    // create simplified points
    const sql_simplify = `

      insert into ${this.tablePoint} ( track_id, track_segment_id, segment_point_id, elevation, point_time, wkb_geometry)
      with simple1 as (
        select track_id, track_segment_id,
        ST_Simplify(ST_MakeLine(wkb_geometry order by id), 0.00001) as wkb_s
        from ${this.tablePointTmp} tp
        group by track_id, track_segment_id
      ),
      reducedpoints as (
        select ST_DumpPoints(wkb_s) as dp
        from simple1
      ),
      joinbase as (
        select (dp).geom as wkb_geometry from reducedpoints
      )
      select
      track_id, track_segment_id,
      rank() OVER (PARTITION BY track_id, track_segment_id ORDER BY id) as segment_point_id,
      elevation, point_time, wkb_geometry
      from ${this.tablePointTmp}
      where wkb_geometry in ( select wkb_geometry from joinbase)
      and track_id = $1
      order by id      
    `

    // console.log(sql_simplify)
    await this.client.query(sql_simplify, [trackId])
  }

  async deletePointsFromTmp(trackId: number) {
    await this.client.query(`delete from ${this.tablePointTmp} where track_id = $1`, [trackId])
  }

  async updateTrackWkbGeometry(trackId: number): Promise<void> {
    // update geometry in track table
    const sql2 = `
        UPDATE ${this.dbOptions.dbSchema}.tracks
        SET wkb_geometry = subquery.wkb_geometry
        FROM (
          SELECT 
            ST_Multi(ST_Collect(line_geom)) as wkb_geometry
          FROM (
              SELECT 
                track_segment_id,
                ST_MakeLine(wkb_geometry ORDER BY segment_point_id) as line_geom
              FROM 
                ${this.dbOptions.dbSchema}.track_points
              WHERE track_id = $1
              GROUP BY 
                  track_segment_id
              ---  order by track_segment_id
          ) AS line_subquery
        ) AS subquery
        WHERE 
          ${this.dbOptions.dbSchema}.tracks.id = $1
        `
    await this.client.query(sql2, [trackId])
  }

  async updateLengthTime(track_id: number, fromTmp = true): Promise<void> {
    const sourceView = fromTmp ? "calculated_track_stats_tmp" : "calculated_track_stats"
    const sql = `
    update ${this.dbOptions.dbSchema}.tracks t
    set (length_calc, timelength_calc) =
      (select length_calc, timelength_calc::integer
      from ${this.dbOptions.dbSchema}.${sourceView} cst
      where cst.track_id = t.id)
    where t.id = $1`
    await this.client.query(sql, [track_id])
  }

  async updateAscentFromSimplifiedPoints(track_id: number): Promise<void> {
    const sql = `
    update ${this.dbOptions.dbSchema}.tracks t
    set (ascent_calc) =
      (select ascent_calc
      from ${this.dbOptions.dbSchema}.calculated_track_stats cs
      where cs.track_id = t.id)
    where t.id = $1`
    await this.client.query(sql, [track_id])
  }

  async getNextTrackId(): Promise<number> {
    const resTrackId = await this.client.query(`select nextval('${this.dbOptions.dbSchema}.tracks_id')`);
    const nextValRow = resTrackId.rows[0] as (object | undefined)
    if (!isNextValQueryResult(nextValRow)) {
      throw Error("Query did not return correct nextval structure")
    } else {
      const newId = parseInt(nextValRow.nextval);
      return newId
    }
  }
}

export { Track2DbWriter };

