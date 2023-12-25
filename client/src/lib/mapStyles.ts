import { Stroke, Style } from 'ol/style'
import type { ColorLike } from 'ol/colorlike'

interface StyleFactoryLike {
  getNext(...args: unknown[]): Style
}

class StyleFactoryFixedColors implements StyleFactoryLike {

  count = 0
  rgbSetBrown = [
    '#621708',
    '#941b0c',
    '#bc3908'
  ]
  rgbSet: ColorLike[]

  constructor(rgbSetArg: (ColorLike[] | null) = null) {
    if (rgbSetArg === null) {
      this.rgbSet = this.rgbSetBrown
    } else {
      this.rgbSet = rgbSetArg
    }
  }

  getNext() {
    const idx = this.count % this.rgbSet.length
    const color = this.rgbSet[idx]
    this.count++

    return new Style({
      stroke: new Stroke({
        color,
        width: 2
      })
    })
  }
}

export { StyleFactoryFixedColors }
export type { StyleFactoryLike }
