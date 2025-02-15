import { EventsKey } from 'ol/events';
import { defineStore } from 'pinia';
import { Map, View } from 'ol';
import BaseLayer from 'ol/layer/Base';
import { unByKey } from 'ol/Observable';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { defaults } from 'ol/interaction';

interface removeListenerInfoI {
  listenerId?: string;
  listenerGroup?: string;
}

interface addListenerObjectI {
  listener: EventsKey;
  listenerId: string;
  listenerGroup?: string;
}

function createMap() {
  const mapLayer = new TileLayer({
    source: new XYZ({
      url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
    }),
  });
  return new Map({
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
}

export const useMapStore = defineStore({
  id: 'map',
  state: () => ({
    mapManager: {},
    listenerManager: {},
  }),
  getters: {},
  actions: {
    addMap(container: string, mapName: string) {
      if (!this.mapManager[mapName]) {
        const map = createMap();
        map.setTarget(container);
        this.mapManager[mapName] = map;
        return map;
      }

      const map: Map = this.mapManager[mapName];
      map.setTarget(undefined);
      map.setTarget(container);
      return map;
    },

    getMap(mapName: string) {
      if (this.mapManager[mapName]) {
        return this.mapManager[mapName];
      } else {
        return null;
      }
    },

    // 判断图层是否已添加
    isLayerExist(map: Map, layer: BaseLayer) {
      return map
        .getLayers()
        .getArray()
        .some((_layer) => {
          return _layer['ol_uid'] === layer['ol_uid'];
        });
    },

    addListener(listenerObject: addListenerObjectI | addListenerObjectI[]) {
      if (Array.isArray(listenerObject)) {
        listenerObject.forEach((item) => {
          this.addListener(item);
        });
        return;
      }

      const { listener, listenerId, listenerGroup } = listenerObject;
      const group = listenerGroup || listenerId;
      if (!this.listenerManager[group]) {
        this.listenerManager[group] = {};
      }
      this.listenerManager[group][listenerId] = listener;
    },

    // 传入移出信息形况，
    // 1.单listenerId
    // 2.单listenerGroup
    // 3. listenerId和listenerGroup
    removeListener(listenerInfo: removeListenerInfoI) {
      const { listenerId, listenerGroup } = listenerInfo;
      // 判断listenerManager是否为空
      if (Object.keys(this.listenerManager).length === 0) {
        console.log('listenerManager已清空');
        return;
      }

      // 判断listenerGroup是否为空
      const isListenerGroupEmpty = (listenerGroup: string) => {
        const groupListeners = this.listenerManager[listenerGroup];
        return groupListeners && Object.keys(groupListeners).length !== 0 ? false : true;
      };

      // 判断listenerId是否为空
      const isListenerIdEmpty = (listenerGroup: string, listenerId: string) => {
        return this.listenerManager[listenerGroup][listenerId] === undefined;
      };

      // 移除所有监听器
      if (!listenerId && !listenerGroup) {
        Object.keys(this.listenerManager).forEach((listenerGroup) => {
          if (isListenerGroupEmpty(listenerGroup)) return;

          Object.keys(this.listenerManager[listenerGroup]).forEach((listenerId) => {
            if (!isListenerIdEmpty(listenerGroup, listenerId)) {
              unByKey(this.listenerManager[listenerGroup][listenerId]);
            }
          });
          delete this.listenerManager[listenerGroup];
        });
        return;
      }
      // 移除单个监听器 传入id定位监听器
      if (listenerId && !listenerGroup) {
        Object.keys(this.listenerManager).forEach((listenerGroup_) => {
          // 判断listenerGroup是否为空
          if (isListenerGroupEmpty(listenerGroup_)) return;

          Object.keys(this.listenerManager[listenerGroup_]).find((listenerId_) => {
            if (listenerId_ === listenerId && !isListenerIdEmpty(listenerGroup_, listenerId_)) {
              unByKey(this.listenerManager[listenerGroup_][listenerId_]);
              delete this.listenerManager[listenerGroup_][listenerId_];
            }
          });
        });
        return;
      }
      // 移除group监听器 传入group定位监听器
      if (!listenerId && listenerGroup) {
        if (isListenerGroupEmpty(listenerGroup)) return;

        Object.keys(this.listenerManager[listenerGroup]).forEach((listenerId_) => {
          if (!isListenerIdEmpty(listenerGroup, listenerId_)) {
            unByKey(this.listenerManager[listenerGroup][listenerId_]);
          }
        });
        delete this.listenerManager[listenerGroup];
        return;
      }
      // 移除单个监听器 传入group和id定位监听器
      if (listenerId && listenerGroup) {
        if (isListenerGroupEmpty(listenerGroup)) return;
        if (isListenerIdEmpty(listenerGroup, listenerId)) return;

        unByKey(this.listenerManager[listenerGroup][listenerId]);
        delete this.listenerManager[listenerGroup][listenerId];
        return;
      }
    },

    removeListenerExcept(listenerInfo: removeListenerInfoI | removeListenerInfoI[]) {
      if (Array.isArray(listenerInfo)) {
        listenerInfo.forEach((item) => {
          this.removeListenerExcept(item);
        });
        return;
      }

      const { listenerId, listenerGroup } = listenerInfo;
      // 移除除listenerId的所有监听器
      if (listenerId && !listenerGroup) {
        Object.keys(this.listenerManager).forEach((listenerGroup) => {
          Object.keys(this.listenerManager[listenerGroup]).forEach((listenerId_) => {
            // 判断是否同id
            if (!(listenerId_ === listenerId)) {
              unByKey(this.listenerManager[listenerGroup][listenerId_]);
              delete this.listenerManager[listenerGroup][listenerId_];
            }
          });
        });
        return;
      }
      // 移除所有监听器except listenerGroup
      if (!listenerId && listenerGroup) {
        Object.keys(this.listenerManager).forEach((listenerGroup_) => {
          // 判断是否同group
          if (!(listenerGroup === listenerGroup_)) {
            Object.keys(this.listenerManager[listenerGroup]).forEach((listenerId_) => {
              unByKey(this.listenerManager[listenerGroup][listenerId_]);
              delete this.listenerManager[listenerGroup][listenerId_];
            });
          }
        });
        return;
      }
    },

    getListener(listenerId) {
      // 获取单个监听器 传入id定位监听器
      if (listenerId) {
        Object.keys(this.listenerManager).forEach((listenerGroup) => {
          Object.keys(this.listenerManager[listenerGroup]).find((listenerId_) => {
            if (listenerId_ === listenerId) {
              return true;
            }
          });
        });
        return false;
      }
    },

    getAllListener() {
      return this.listenerManager;
    },
  },
});
