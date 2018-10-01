const UNKNOWN = "UNKNOWN";

class CallError extends Error {
  constructor(message, typ = UNKNOWN) {
    super(`(${typ}) ${message}`);
    this.typ = typ;
  }
}

CallError.TIMEOUT = "TIMEOUT";
CallError.NORESP = "NORESP";
CallError.BADCODE = "BADCODE";
CallError.NETWORK = "NETWORK";
CallError.BADDATA = "BADDATA";
CallError.FAILED = "FAILED";
CallError.UNKNOWN = UNKNOWN;

Object.freeze(CallError);

export { CallError as default };
