/* eslint-disable max-classes-per-file */
import type { BaseFitMessage, EventFitMessage, RecordFitMessage } from '@garmin/fitsdk';
import { DateTime } from 'luxon';
import type { DateTimeInterval } from './types';

class AbstractBaseMessage<T extends (BaseFitMessage | EventFitMessage | RecordFitMessage)> {
  m: T;

  constructor(message: T) {
    this.m = message;
  }

  getFitMessage(): T {
    return this.m;
  }

  getDate() {
    return this.m.timestamp;
  }

  /**
   *
   * @returns Luxon DateTime object
   */
  getDateTime() {
    return DateTime.fromJSDate(this.m.timestamp);
  }

  /**
   *
   * @returns ISO8601 date string
   */
  getDateString() {
    return this.m.timestamp.toISOString();
  }
}

class BaseMessage extends AbstractBaseMessage<BaseFitMessage> { }
class EventMessage extends AbstractBaseMessage<EventFitMessage> { }
class RecordMessage extends AbstractBaseMessage<RecordFitMessage> {
  hasPosition() {
    const m = this.getFitMessage();
    if ((m.positionLat === undefined) || m.positionLong === undefined) {
      return false;
    }
    return true;
  }

  getLatLon() {
    // See https://gis.stackexchange.com/questions/122186/convert-garmin-or-iphone-weird-gps-coordinates
    const GARMIN_LATLON_FACTOR = 11930465;
    const m = this.getFitMessage();

    if ((m.positionLat === undefined) || m.positionLong === undefined) {
      throw new Error('Record message does not have full coordinates');
    } else {
      return [
        m.positionLat / GARMIN_LATLON_FACTOR,
        m.positionLong / GARMIN_LATLON_FACTOR,
      ];
    }
  }

  getLonLat() {
    const c = this.getLatLon();
    return [c[1], c[0]];
  }
}


class AbstractMessageList<T extends (BaseMessage | RecordMessage | EventMessage)> {
  messages: T[];

  constructor(messages: T[]) {
    this.messages = messages;
    if (!this.isSortedByTime()) throw Error('Messages are not sorted ascending');
  }

  get length() {
    return this.messages.length;
  }

  getMessages(): T[] {
    return this.messages;
  }

  getFitMessages() {
    const mlist: T[] = this.getMessages();
    type AppleType = ReturnType<T['getFitMessage']>;
    const mFitList = mlist.map((msg: T) => (msg.getFitMessage() as AppleType));
    return mFitList;
  }

  addMessage(m: T) {
    this.messages.push(m);
  }

  getDateTimes(): DateTime[] {
    return this.messages.map((d) => d.getDateTime());
  }

  getDateStrings(): string[] {
    return this.messages.map((d) => d.getDateString());
  }

  isSortedByTime() {
    const timestamps = this.getDateTimes();
    for (let i = 1; i < timestamps.length; i += 1) {
      if (timestamps[i - 1] > timestamps[i]) {
        return false;
      }
    }
    return true;
  }

  getMessage(i: number): (T | undefined) {
    return this.messages[i];
  }

  getLastMessage() {
    return this.messages.at(-1);
  }

  getDateTime(i: number): DateTime | undefined {
    return this.getMessage(i)?.getDateTime();
  }
}

class BaseMessageList extends AbstractMessageList<BaseMessage> {
  static fromFitMessages(fitMsgs: BaseFitMessage[]) {
    const msgs = fitMsgs.map((d) => new BaseMessage(d));
    return new BaseMessageList(msgs);
  }
}
class RecordMessageList extends AbstractMessageList<RecordMessage> {
  static fromFitMessages(fitMsgs: RecordFitMessage[], rejectNoPosition = true) {
    let msgs = fitMsgs.map((d) => new RecordMessage(d));
    if (rejectNoPosition) {
      msgs = msgs.filter((m) => m.hasPosition());
    }
    return new RecordMessageList(msgs);
  }

  /**
   * Returns array of lon lat arrays
   * @returns Array of tuples containing coordinates
   */
  getCoordinatesLonLat() {
    return this.getMessages().map((m) => m.getLonLat());
  }
}


class EventMessageList extends AbstractMessageList<EventMessage> {
  static fromFitMessages(fitMsgs: EventFitMessage[]) {
    const msgs = fitMsgs.map((d) => new EventMessage(d));
    return new EventMessageList(msgs);
  }
}

class StartStopList {
  eventMessageList: EventMessageList;

  constructor(eventFitMessages: EventFitMessage[]) {
    this.eventMessageList = EventMessageList.fromFitMessages(eventFitMessages);
    if (!this.eventMessageList.isSortedByTime()) throw Error('Messages are not sorted ascending');
  }

  /**
   * Returns a list of 2-element tuples of DateTime
   * representing all intervals between start and stop/stopAll
   */
  getIntervals() {
    const intervals: DateTimeInterval[] = [];

    let i = 0; // index
    while (i < this.eventMessageList.length) {
      const startIndex = this.nextStartEventIndex(i);
      if (startIndex === undefined) {
        break;
      }

      const stopIndex = this.nextStopEventIndex(startIndex + 1);
      if (stopIndex === undefined) {
        break;
      }

      //
      const startTs = this.eventMessageList.getDateTime(startIndex);
      if (startTs === undefined) { throw new Error('startTs undefined'); }
      const stopTs = this.eventMessageList.getDateTime(stopIndex);
      if (stopTs === undefined) { throw new Error('stopTs undefined'); }

      intervals.push([startTs, stopTs]);
      i = stopIndex + 1;
    }
    return intervals;
  }

  private nextStartEventIndex(startIndex: number) {
    const eventMsgList = this.eventMessageList.getMessages();
    for (let i = startIndex; i < eventMsgList.length; i += 1) {
      const eventMessage = eventMsgList[i];

      if (eventMessage.m.eventType === 'start') {
        return i;
      }
    }
    return undefined; // could not find next start event
  }

  private nextStopEventIndex(startIndex: number) {
    const eventMsgList = this.eventMessageList.getMessages();
    for (let i = startIndex; i < eventMsgList.length; i += 1) {
      const eventMessage = eventMsgList[i];
      const { eventType } = eventMessage.m;
      if (eventType === 'stop' || eventType === 'stopAll') {
        return i;
      }
    }
    return undefined; // could not find next start event
  }
}

function concatRecordMessageLists(
  rmList1: RecordMessageList,
  rmlist2: RecordMessageList,
): RecordMessageList {
  // concat the segments
  const msgs1 = rmList1.getMessages() as RecordMessage[];
  const msgs2 = rmlist2.getMessages() as RecordMessage[];
  const n = msgs1.concat(msgs2);
  const concatList = new RecordMessageList(n);
  return concatList;
}

export {
  AbstractMessageList, BaseMessage, BaseMessageList,
  EventMessage, EventMessageList, RecordMessage, RecordMessageList,
  // eslint-disable-next-line @typescript-eslint/comma-dangle
  StartStopList, concatRecordMessageLists
};

