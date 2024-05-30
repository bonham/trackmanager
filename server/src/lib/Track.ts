
interface TrackPoint {
  lat: number;
  lon: number;
  elevation: number;
  point_time?: Date
}

interface TrackMetadata {
  name?: string,
  source?: string,
  totalAscent?: number;
  totalDistance?: number;
  durationSeconds?: number;
  startTime: Date;
}

type Segment = TrackPoint[]

class Track {
  segments: Segment[] = [];

  options: TrackMetadata

  constructor(options: TrackMetadata) {
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
    return this.options.startTime
  }

  setStartTime(d: Date) {
    this.options.startTime = d
  }
}

export { Track };
export type { Segment, TrackMetadata, TrackPoint };

