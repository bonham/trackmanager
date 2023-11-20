/* eslint-disable max-classes-per-file */
declare module '@garmin/fitsdk' {
  interface BaseFitMessage {
    'timestamp': Date;
  }
  interface RecordFitMessage extends BaseFitMessage {
    'temperature'?: number;
    'grade'?: number;
    'altitude'?: number;
    'speed'?: number;
    'positionLat'?: number;
    'positionLong'?: number;
    'distance'?: number;
    'enhancedAltitude'?: number;
    'enhancedSpeed'?: number
  }

  interface EventFitMessage extends BaseFitMessage {
    'event': string;
    'eventType': string;
    'data': number;
    'timerTrigger': string
  }

  interface SessionFitMessage extends BaseFitMessage {
    'sport'?: string;
    'startTime'?: Date;
    'timestamp'?: Date;
    'totalElapsedTime'?: number;
    'totalTimerTime'?: number;
    'numLaps'?: number;
    'trigger'?: string;
    'thresholdPower'?: number;
    'totalDistance'?: number;
    'avgSpeed'?: number;
    'maxSpeed'?: number;
    'totalAscent'?: number;
    'totalDescent'?: number;
    'minAltitude'?: number;
    'maxAltitude'?: number;
    'avgAltitude'?: number;
  }

  interface FitMessages {
    'eventMesgs': EventFitMessage[];
    'recordMesgs': RecordFitMessage[];
    'sessionMesgs': SessionFitMessage[];
  }

  export class Stream {
    static fromByteArray(bytes: number[]): Stream;
  }

  export class Decoder {
    constructor(stream: Stream);
    isFIT(): boolean;
    checkIntegrity(): boolean;
    read(): { messages: FitMessages, errors: any };
  }

}
