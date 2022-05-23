import { Stroke, Style } from 'ol/style'

class StyleFactory {
  constructor () {
    this.count = 0
    this.rgbSetBrown = [
      '#621708',
      '#941b0c',
      '#bc3908'
    ]
  }

  getNext () {
    const idx = this.count % this.rgbSetBrown.length
    const color = this.rgbSetBrown[idx]
    this.count++

    return new Style({
      stroke: new Stroke({
        color,
        width: 2
      })
    })
  }
}
export { StyleFactory }
