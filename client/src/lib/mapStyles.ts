import { Stroke, Style } from 'ol/style'
import type { ColorLike } from 'ol/colorlike'

interface StyleFactoryLike {
  getNext(...args: unknown[]): Style
}

const THREE_BROWN_COLORSTYLE: ColorLike[] = [
  '#621708',
  '#941b0c',
  '#bc3908'
]
const FIVE_COLORFUL_COLORSTYLE: ColorLike[] = [
  '#a52a2a',
  '#ffa500',
  '#ff0000',
  '#008000',
  '#0000ff',
]
class StyleFactoryFixedColors implements StyleFactoryLike {

  count = 0
  rgbSet: ColorLike[]

  constructor(rgbSetArg: (ColorLike[] | null) = null) {
    if (rgbSetArg === null) {
      this.rgbSet = THREE_BROWN_COLORSTYLE // default
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

export { StyleFactoryFixedColors, THREE_BROWN_COLORSTYLE, FIVE_COLORFUL_COLORSTYLE }
export type { StyleFactoryLike }

