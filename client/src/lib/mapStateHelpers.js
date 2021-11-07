class TrackVisibilityManager {
  constructor (currentVisibleIdList, layerMap) {
    this.currentVisibleIdList = new Set(currentVisibleIdList)
    this.layerMap = layerMap
    this.toBeVisibleIdList = undefined
    this.notYetVisibleIdList = undefined
    this.alreadyVisibleIdList = undefined
    this.toBeHiddenIdList = undefined
  }

  setToBeVisibleIds (toBeVisibleIdList) {
    this.toBeVisibleIdList = new Set(toBeVisibleIdList)
    this._calc1(toBeVisibleIdList)
  }

  _calc1 (toBeVisibleIdList) {
    const toBe = new Set(toBeVisibleIdList)
    this.toBeVisibleIdList = toBe
    const notYet = new Set()
    const already = new Set()
    const toBeHidden = new Set()
    // check toBe for already visible
    toBe.forEach(el => {
      if (this.currentVisibleIdList.has(el)) {
        already.add(el)
      } else {
        notYet.add(el)
      }
    })
    this.notYetVisibleIdList = notYet
    this.alreadyVisibleIdList = already
    // check current visible for to be hidden
    this.currentVisibleIdList.forEach((el) => {
      if (!toBe.has(el)) {
        toBeHidden.add(el)
      }
    })
    this.toBeHiddenIdList = toBeHidden
  }
}
export { TrackVisibilityManager }
