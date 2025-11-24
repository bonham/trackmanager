import _ from 'lodash'
import type { GeoJsonObject } from 'geojson'

export interface GeoJSONObjectWithId { geojson: GeoJsonObject, id: number }

class GeoJsonCollection {
  geoJsonList: GeoJSONObjectWithId[]
  constructor(geoJsonList: GeoJSONObjectWithId[]) {
    this.geoJsonList = geoJsonList
  }

  // calculate maximum bounding box for all geojson objects
  boundingBox() {
    const l = this.geoJsonList

    function pickBbox(go: GeoJSONObjectWithId) {
      const bbox = go.geojson.bbox
      if (bbox == undefined) { throw new Error("geojson does not have bbox") }
      return bbox
    }

    const left = _.min(_.map(l, (x) => { return pickBbox(x)[0] }))
    const bottom = _.min(_.map(l, (x) => { return pickBbox(x)[1] }))
    const right = _.max(_.map(l, (x) => { return pickBbox(x)[2] }))
    const top = _.max(_.map(l, (x) => { return pickBbox(x)[3] }))
    return [left, bottom, right, top]
  }
}

export { GeoJsonCollection }