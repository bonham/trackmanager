import type { Track } from '@/lib/Track'
import type { MultiLineString } from 'geojson'

// Client-specific interface that uses the Track type
export interface MultiLineStringWithTrack { track: Track, geojson: MultiLineString }
