import { Map, View } from 'ol'
import { transformExtent } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Stroke, Style } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'

function createMap (center = [0, 0], zoom = 0) {
  const map = new Map({
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: center,
      zoom: zoom
    })
  })
  return map
}

function setMapViewAndDrawTrack (geoJson, map) {
  const extent = transformExtent(
    geoJson.bbox,
    'EPSG:4326',
    'EPSG:3857'
  )
  const mapSize = map.getSize()
  const view = map.getView()

  view.fit(
    extent,
    mapSize
  )

  // load track
  const style = new Style({
    stroke: new Stroke({
      color: 'brown',
      width: 2
    })
  })

  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(
      geoJson,
      {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      }
    )
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style
  })

  map.addLayer(vectorLayer)

  // zoom a bit out
  const scale = 0.97
  view.animate(
    { zoom: view.getZoom() * scale })
}

export { createMap, setMapViewAndDrawTrack }
