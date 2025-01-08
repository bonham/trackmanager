import GeoJSON from 'ol/format/GeoJSON'
import type { StyleLike } from 'ol/style/Style'
import VectorLayer from 'ol/layer/Vector.js';
import type { GeoJsonObject } from 'geojson'
import { getUid } from 'ol/util'
import VectorSource from 'ol/source/Vector.js';

export function createLayerFromGeoJson(geoJson: GeoJsonObject, style: StyleLike) {
  // load track

  const features = new GeoJSON().readFeatures(
    geoJson,
    {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }
  );
  const featureIdList = features.map((f) => getUid(f))

  const vectorSource = new VectorSource({
    features
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style
  })
  return { featureIdList, vectorLayer }
}
