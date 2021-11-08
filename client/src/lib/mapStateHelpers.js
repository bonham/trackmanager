class TrackVisibilityManager {
  constructor (currentVisibleIdList, toBeVisibleInTotalIdList) {
    console.log(currentVisibleIdList)
    console.log(toBeVisibleInTotalIdList)
    this.currentVisibleIdList = new Set(currentVisibleIdList)
    this.toBeVisibleInTotalIdList = new Set(toBeVisibleInTotalIdList)
    console.log(this.toBeVisibleInTotalIdList)
    // calculated values
    this.alreadyVisibleIdList = undefined
    this.toBeHiddenIdList = undefined
    this.deltaToBeEnabledIdList = undefined
    // calculate
    this._calcAlreadyNotyet()
    this._calcToBeHidden()
  }

  _calcAlreadyNotyet () {
    const notYet = new Set()
    const already = new Set()
    // check toBe for already visible
    this.toBeVisibleInTotalIdList.forEach(el => {
      if (this.currentVisibleIdList.has(el)) {
        already.add(el)
      } else {
        notYet.add(el)
      }
    })
    this.deltaToBeEnabledIdList = notYet
    this.alreadyVisibleIdList = already
  }

  _calcToBeHidden () {
    // check current visible for to be hidden
    const toBeHidden = new Set()
    this.currentVisibleIdList.forEach((el) => {
      if (!this.toBeVisibleInTotalIdList.has(el)) {
        toBeHidden.add(el)
      }
    })
    this.toBeHiddenIdList = toBeHidden
  }
}
export { TrackVisibilityManager }
