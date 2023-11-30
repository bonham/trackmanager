/* eslint-disable padded-blocks */
/* eslint-disable no-trailing-spaces */
import type { FitMessages, SessionFitMessage } from '@garmin/fitsdk';
import {
  Decoder, Stream,
} from '@garmin/fitsdk';
import { RecordMessageList, StartStopList } from './Messages.js';
import { intersectRecordMessages } from './intersect.js';
import { joinSegments } from './joinSegments.js';


class FitFile {

  messages: FitMessages;

  constructor(buf: Buffer) {
    this.messages = this.decode(buf);
  }

  static isFit(buf: Buffer): boolean {
    const bytes = Array.from(buf);
    const stream = Stream.fromByteArray(bytes);
    const decoder = new Decoder(stream);
    return decoder.isFIT();
  }

  getFirstSessionMessage(): SessionFitMessage {
    const numSessions = this.messages.sessionMesgs.length;
    if (numSessions < 1) {
      throw Error('No session message in fit file');
    }
    if (numSessions > 1) console.warn('Fit file contains multiple sessions');
    return this.messages.sessionMesgs[0];
  }

  getFitMessages() {
    return this.messages;
  }

  getStartStopList() {
    return new StartStopList(this.messages.eventMesgs);
  }

  /**
   * Returns a list of RecordMessageList which contains
   * the list of linestrings within start stop records
   * In addition, segments will be joined if end/startpoints are closer or equal than joindistance
   * joinDistance (m)
   */
  getRecordMessageList(joinDistance = 10): RecordMessageList[] {
    return this.intersectAndJoin(joinDistance);
  }

  /**
   * Reads buffer and decodes to fit messages
   * @param buf 
   * @returns 
   */
  // eslint-disable-next-line class-methods-use-this
  private decode(buf: Buffer): FitMessages {

    const bytes = Array.from(buf);
    const stream = Stream.fromByteArray(bytes);

    const decoder = new Decoder(stream);

    if (!decoder.isFIT()) { throw new Error('is not fit'); }
    if (!decoder.checkIntegrity()) { throw new Error('integrity check failed'); }

    const { messages: fitMessages, errors } = decoder.read();
    if (errors.length) {
      throw new Error('error', { cause: errors });
    }
    return fitMessages;
  }

  private intersectAndJoin(joinDistance: number) {

    const eventMesgsStartStop = this.getStartStopList();
    const intervals = eventMesgsStartStop.getIntervals();

    // intersect
    const recordMesgs = RecordMessageList.fromFitMessages(this.messages.recordMesgs);
    const result = intersectRecordMessages(recordMesgs, intervals);

    const numNotFound = result.notfound.length;
    if (numNotFound > 0) { console.warn(`Number of record message segments not in start stop interval: ${numNotFound} `); }

    // join
    const foundRecordMsgLists = Object.values(result.found);
    const joinedSegments = joinSegments(joinDistance, foundRecordMsgLists);

    return joinedSegments;

  }


}

export { FitFile };

