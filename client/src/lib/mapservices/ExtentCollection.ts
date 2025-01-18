import _ from 'lodash'
import type { Extent } from 'ol/extent'

class ExtentCollection {
  extentList: Extent[]
  constructor(extentList: Extent[]) { // one extent is: [minx, miny, maxx, maxy]
    if (extentList.length === 0) throw new Error("Extentlist must have one element")
    this.extentList = extentList
  }

  boundingBox() {
    const l = this.extentList

    const left = _.min(_.map(l, (x) => { return x[0] }))!
    const bottom = _.min(_.map(l, (x) => { return x[1] }))!
    const right = _.max(_.map(l, (x) => { return x[2] }))!
    const top = _.max(_.map(l, (x) => { return x[3] }))!
    return [left, bottom, right, top]
  }
}

export { ExtentCollection }