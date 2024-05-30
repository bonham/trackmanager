 WITH base AS (
         SELECT track_points_tmp.id,
            track_points_tmp.track_id,
            track_points_tmp.track_segment_id,
            track_points_tmp.point_time - lag(track_points_tmp.point_time) OVER (PARTITION BY track_points_tmp.track_id, track_points_tmp.track_segment_id ORDER BY track_points_tmp.id) AS point_interval,
            st_distance(track_points_tmp.wkb_geometry::geography, lag(track_points_tmp.wkb_geometry::geography) OVER (PARTITION BY track_points_tmp.track_id, track_points_tmp.track_segment_id ORDER BY track_points_tmp.id)) AS point_dist,
            track_points_tmp.elevation - lag(track_points_tmp.elevation) OVER (PARTITION BY track_points_tmp.track_id, track_points_tmp.track_segment_id ORDER BY track_points_tmp.id) AS point_elevation
           FROM michatest3.track_points_tmp
        )
         SELECT id, base.track_id,
            base.point_dist,
            base.point_elevation,
            date_part('epoch'::text, base.point_interval) AS point_interval_s,
	 		base.point_interval as y,
	 		date_part('epoch'::text, base.point_interval) / 3600::double precision as x
            -- base.point_dist / 1000::double precision / (date_part('epoch'::text, base.point_interval) / 3600::double precision) AS km_h_point
           FROM base
	where track_id = 109
order by id

---
select *
FROM michatest3.track_points
where id in (92930,92931)