with s as (
	SELECT id, src, round(length::numeric,0) as len, round(length_calc::numeric,0) as len_c,
	timelength, timelength_calc, ascent, round(ascent_calc::numeric,0) asc_c
	FROM michatest2.tracks
	
)
select src,
	len, len_c, (len - len_c) d_len, 
	interval '1 second' * timelength timelength, interval '1 second' * timelength_calc timelength_calc,
	interval '1 second' * (timelength - timelength_calc) d_tl,
	ascent, asc_c, ascent - asc_c d_asc
from s
order by id desc