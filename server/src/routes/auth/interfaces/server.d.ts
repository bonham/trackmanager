import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import type { Request } from 'express';
import { Session } from 'express-session';



/**
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
declare interface Authenticator {
  // SQL: Encode to base64url then store as `TEXT`. Index this column
  credentialID: Uint8Array;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  credentialPublicKey: Uint8Array;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  credentialDeviceType: string;
  // SQL: `BOOL` or whatever similar type is supported
  credentialBackedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
  transports: AuthenticatorTransportFuture[];
  userid?: string;
}

declare interface RegCodeLookup {
  'regkey': string, 'username': string, 'created': Date, used: boolean
};

declare interface SessionWChallenge extends Session {
  challenge?: string;
  user?: string;
  reguser?: string;
  regkey?: string;
}

declare interface RequestWebauthn extends Request {
  session: SessionWChallenge
};


