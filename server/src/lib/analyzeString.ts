

/**
 * Extract dates from strings with date patterns.
 * Supported patterns , international and 'german'. with no separator or ./_- as separator
 * Example:
 * 
 * 20190531 
 * 02.10.2024
 * 
 * Year must have 4 digits. Days and months must have 2 digits.
 */
class DateStringMatcher {

  inputString: string

  readonly regexInternational = /((?:19|20|21)\d{2})[ _\-./]?(0[1-9]|1[0-2])[ _\-./]?(0[1-9]|[1-2][0-9]|3[0-1])(?:[ _\-./]?\d{2}[:.-]?\d{2})?/
  readonly regexGerman = /(0[1-9]|[1-2][0-9]|3[0-1])[ _\-./]?(0[1-9]|1[0-2])[ _\-./]?((?:19|20|21)\d{2})/

  constructor(inputString: string) {
    this.inputString = inputString
  }

  extractDate(): null | Date {

    const str = this.inputString

    // match something like 20190229 , with or without dots dash underscore and space as separator
    const match1 = str.match(this.regexInternational)
    if (match1 !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_fullString, year, mon, day] = match1
      const date = new Date(`${year}-${mon}-${day}`)
      return date
    }

    // reverse notation ( german ) 30-07-2021
    const match2 = str.match(this.regexGerman)
    if (match2 !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_fullString, day, mon, year] = match2
      const date = new Date(`${year}-${mon}-${day}`)
      return date
    }
    return null
  }
  /**
   * Returns input string but with date removed
   */
  strippedString() {
    // add global flag
    const r1 = new RegExp(this.regexInternational, 'g')
    const r2 = new RegExp(this.regexGerman, 'g')
    const tmp1 = this.inputString.replace(r1, '')
    const result = tmp1.replace(r2, '')
    return result
  }
}

/**
 * Removes garbage from a string
 * Each operation modifies the stored string further and returns current result after operation
 */
class StringCleaner {

  str: string;

  constructor(inputString: string) {
    this.str = inputString
  }

  replaceConnectorsWithSpace(): string {
    const s = this.str

    const regex = /[_-]+/g
    const s1 = s.replace(regex, ' ')
    this.str = s1
    return this.str.trim()
  }

  /**
   * Remove trailing file type suffixes
   * @param suffixList Array of suffixes without leading dot, e.g. : ['gpx','fit']
   */
  removeFileSuffix(suffixList: string[]): string {
    let outString = this.str
    for (const sf of suffixList) {
      const re = new RegExp(`.${sf}$`, 'i')
      outString = outString.replace(re, '')
    }
    this.str = outString
    return this.str.trim()
  }

  removeKarooPrefix() {
    const re = /^Karoo-/i
    this.str = this.str.replace(re, '')
    return this.str.trim()
  }

  applyAll(opt: { suffixList?: string[] } = {}): string {
    const suffixList: string[] = opt.suffixList ?? []
    this.replaceConnectorsWithSpace()
    this.removeFileSuffix(suffixList)
    this.removeKarooPrefix()
    return this.getString()
  }

  getString() {
    return this.str.trim()
  }
}

export { DateStringMatcher, StringCleaner }

