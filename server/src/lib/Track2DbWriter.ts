import pg from 'pg';
import type { TrackMetadata, TrackPoint } from './Track.js';
import { Track } from './Track.js';
import { isNextValQueryResult } from './typeguards.js';

const TRACK_TABLENAME = "tracks"
const TRACK_SEQUENCENAME = "tracks_id"
const SEGMENT_TABLENAME = "segments"
const POINTS_TABLENAME = "track_points"


interface DBOpts {
  dbUser: string,
  dbSchema: string,
  dbName: string,
  dbHost: string,
}

class Track2DbWriter {
  dbOptions: DBOpts;

  pool: pg.Pool;

  fileBufferHash: string;

  tableSegment: string;
  tableTrack: string;
  tablePoint: string;
  sequenceTrack: string;

  constructor(dbOptions: DBOpts, fileBufferHash: string) {
    this.dbOptions = dbOptions;
    this.fileBufferHash = fileBufferHash;

    this.tableTrack = `${this.dbOptions.dbSchema}.${TRACK_TABLENAME}`
    this.tableSegment = `${this.dbOptions.dbSchema}.${SEGMENT_TABLENAME}`
    this.tablePoint = `${this.dbOptions.dbSchema}.${POINTS_TABLENAME}`
    this.sequenceTrack = `${this.dbOptions.dbSchema}.${TRACK_SEQUENCENAME}`

    this.pool = new pg.Pool({
      database: dbOptions.dbName,
      host: dbOptions.dbHost,
      user: dbOptions.dbUser,
    });
  }

  async write(t: Track): Promise<number> {

    const meta = t.getMetaData();
    const trackId = await this.getNextTrackId()

    await this.insertTrackMetadata(trackId, meta)

    const segmentList = t.getSegments()
    console.log(`Writing ${segmentList.length} segments for track ${trackId}`)

    for (let segId = 0; segId < segmentList.length; segId++) {

      const segment = segmentList[segId]
      await this.insertSegment(trackId, segId)
      await this.insertPointList(trackId, segId, segment)
    }
    await this.updateTrackWkbGeometry(trackId)
    return trackId;
  }

  async insertTrackMetadata(id: number, tmeta: TrackMetadata): Promise<void> {
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
      id, name, source, this.fileBufferHash,
      startTime, totalDistance, durationSeconds, totalAscent,
    ];

    const res = await this.pool.query(insert, values);
    if (res.rowCount !== 1) throw new Error('Insert rowcount is not equal to 1');

  }

  async insertSegment(trackId: number, segId: number): Promise<void> {
    const sql = `insert into ${this.tableSegment} (track_id, track_segment_id) VALUES($1, $2)`
    await this.pool.query(sql, [trackId, segId])
  }

  async insertPointList(trackId: number, segId: number, tpList: TrackPoint[]): Promise<void> {
    const sql =
      `insert into ${this.tablePoint} ` +
      `( track_id, track_segment_id, segment_point_id, elevation, point_time, wkb_geometry) ` +
      `VALUES($1, $2, $3, $4, $5, ST_GeomFromText($6)) `

    console.log(`Writing ${tpList.length} points for track id ${trackId}`)

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
      await this.pool.query(sql, parameters)
    }
  }

  async updateTrackWkbGeometry(trackId: number): Promise<void> {
    // update geometry in track table
    const sql2 = `
        UPDATE sch_elk.tracks
        SET wkb_geometry = subquery.wkb_geometry
        FROM (
          SELECT 
            ST_Multi(ST_Collect(line_geom)) as wkb_geometry
          FROM (
              SELECT 
                track_segment_id,
                ST_MakeLine(wkb_geometry ORDER BY segment_point_id) as line_geom
              FROM 
                sch_elk.track_points
              WHERE track_id = $1
              GROUP BY 
                  track_segment_id
              ---  order by track_segment_id
          ) AS line_subquery
        ) AS subquery
        WHERE 
          sch_elk.tracks.id = $1
        `
    await this.pool.query(sql2, [trackId])
  }

  async getNextTrackId(): Promise<number> {
    const resTrackId = await this.pool.query(`select nextval('${this.dbOptions.dbSchema}.tracks_id')`);
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

