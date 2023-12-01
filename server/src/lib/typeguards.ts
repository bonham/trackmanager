function isNumber(value: any): value is number {
  return typeof value === 'number';
}

function isNextValString(obj: any): obj is { nextval: string } {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return obj && typeof obj.nextval === 'string';
}

export { isNextValString, isNumber };

