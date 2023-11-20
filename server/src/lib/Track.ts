
interface TrackPoint {
  lat: number;
  lon: number;
  elevation: number;
}

interface TrackMetadata {
  name?: string,
  source?: string,
  totalAscent?: number;
  totalDistance?: number;
  durationSeconds?: number;
  startTime: Date;
}

class Track {
  segments: TrackPoint[][] = [];

  options: TrackMetadata = { startTime: new Date() }; // this is dummy value which will be overidden

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
}

export { Track };
export type { TrackPoint };

