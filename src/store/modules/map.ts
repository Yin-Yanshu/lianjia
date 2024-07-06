import { defineStore } from 'pinia';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import BaseLayer from 'ol/layer/Base';

interface OpenlayerState {
  map: Map;
  drawerHandler: any;
}

class Drawer {
  map: Map;
  draw: Draw | null;
  drawlayer: BaseLayer;
  style = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.5)',
    }),
    stroke: new Stroke({
      color: '#ff1233',
      width: 2,
    }),
  });

  constructor(map: Map, style?: Style) {
    this.drawlayer = new VectorLayer({
      source: new VectorSource(),
      style: style || this.style,
    });
    this.map = map;
  }

  GetDraw(type: string, style?: Style) {
    if (this.draw) {
      this.drawLayer.getSource().clear();
      this.map.removeInteraction(this.draw);
    }
    this.draw = new Draw({
      source: this.drawlayer.getSource(),
      // Point | LineString | Polygon | Circle
      type: type,
      style: this.style || style,
    });
    this.map.addInteraction(this.draw);
    return this.draw;
  }
  RemoveDraw() {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
    }
  }
}

export const useMapStore = defineStore({
  id: 'map',
  state: (): OpenlayerState => ({
    map: null,
    drawerHandler: null,
  }),
  getters: {
    GetMap(state) {
      return state.map;
    },
    GetDrawer: (state) => {
      return state.drawerHandler;
    },
  },
  actions: {
    InitOpenlayers(container: string) {
      const gaodeMapLayer = new TileLayer({
        source: new XYZ({
          url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
        }),
      });
      const map = new Map({
        view: new View({
          center: [120.57651, 31.2487],
          projection: 'EPSG:4326',
          zoom: 13,
        }),
        layers: [gaodeMapLayer],
        target: container,
      });
      this.map = map;
      this.drawerHandler = new Drawer(map);
    },
  },
});
