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

    const left = _.min(_.map(l, (x) => { return x[0] })) as number
    const bottom = _.min(_.map(l, (x) => { return x[1] })) as number
    const right = _.max(_.map(l, (x) => { return x[2] })) as number
    const top = _.max(_.map(l, (x) => { return x[3] })) as number
    return [left, bottom, right, top]
  }
}

export { ExtentCollection }