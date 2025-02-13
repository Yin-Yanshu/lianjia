import TileLayer from 'ol/layer/Tile';
import { Map, View } from 'ol';
import type { Map as OlMap } from 'ol';
import { defaults } from 'ol/interaction';
import { XYZ } from 'ol/source';

interface MapManager {
  [key: string]: OlMap;
}

// 管理多个地图实例
const mapManager: MapManager = {};
function createMap() {
  const mapLayer = new TileLayer({
    source: new XYZ({
      url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
    }),
  });
  const map = new Map({
    view: new View({
      center: [121.505891, 31.238039],
      projection: 'EPSG:4326',
      zoom: 13,
    }),
    layers: [mapLayer],
    target: undefined,
    controls: [],
    interactions: defaults({
      doubleClickZoom: false,
    }),
  });
  return map;
}

// 通过唯一mapName在多处共享同一个地图实例
export default function addMap(container: string, mapName: string) {
  if (!mapManager[mapName]) {
    const map = createMap();
    map.setTarget(container);
    mapManager[mapName] = map;
    return map;
  }

  const map: Map = mapManager[mapName];
  map.setTarget(undefined);
  map.setTarget(container);
  return map;
}

export function getMap(mapName: string) {
  if (mapManager[mapName]) {
    return mapManager[mapName];
  } else {
    return null;
  }
}
