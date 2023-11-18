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

  interface FitMessages {
    'eventMesgs': EventFitMessage[];
    'recordMesgs': RecordFitMessage[];
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
