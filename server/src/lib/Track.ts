
import type { ParsedTrackMetadataWithTime } from 'trackmanager-shared/zodSchemas';

interface TrackPoint {
  lat: number;
  lon: number;
  elevation: number;
  point_time?: Date
}

type Segment = TrackPoint[]

class Track {
  segments: Segment[] = [];

  options: ParsedTrackMetadataWithTime

  constructor(options: ParsedTrackMetadataWithTime) {
    this.options = options;
  }

  getMetaData() {
    return this.options;
  }

  getSegments() {
    return this.segments;
  }

  addSegment(segment: TrackPoint[]) {
    this.segments.push(segment);
  }

  setSegmentList(segmentList: TrackPoint[][]) {
    this.segments = segmentList;
  }

  getStartTime(): Date {
    return this.options.time
  }

  setStartTime(d: Date) {
    this.options.time = d
  }
}

export type { ParsedTrackMetadata, ParsedTrackMetadataWithTime } from 'trackmanager-shared/zodSchemas';
export { Track };
export type { Segment, TrackPoint };

