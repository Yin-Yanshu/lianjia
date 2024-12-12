import { Map } from 'ol';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import { getDynamicHouseHeatMap, HeatMapTimeData } from '../api/point';
import { unByKey } from 'ol/Observable';

let response;
let featuresFrontFrame: Feature<Point>[] = [];
let featuresBackFrame: Feature<Point>[] = [];
let featuresNextFrame: Feature<Point>[] = [];
const heatMapSource1 = new VectorSource<Point>();
const heatMapSource2 = new VectorSource<Point>();
const heatMapLayer1 = new Heatmap({
  source: heatMapSource1,
  blur: 15,
  radius: 15,
  gradient: ['#fff', '#E8D225', '#EF1616'],
  zIndex: 4,
  opacity: 1,
});
const heatMapLayer2 = new Heatmap({
  source: heatMapSource2,
  blur: 15,
  radius: 15,
  gradient: ['#fff', '#E8D225', '#EF1616'],
  zIndex: 4,
  opacity: 0,
});

function addFirstFeatures() {
  featuresFrontFrame = [];
  featuresFrontFrame = response[0].timestampHeatmap.map((item) => {
    return new Feature({
      geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
    });
  });

  featuresBackFrame = [];
  featuresBackFrame = response[1].timestampHeatmap.map((item) => {
    return new Feature({
      geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
    });
  });

  heatMapSource1.addFeatures(featuresFrontFrame);
  heatMapSource2.addFeatures(featuresBackFrame);
}
function changeLayer(queue, index) {
  const firstLayer = queue.dequeue();
  firstLayer.getSource().clear();
  featuresNextFrame = [];
  featuresNextFrame = response[index].timestampHeatmap.map((item) => {
    return new Feature({
      geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
    });
  });
  firstLayer.getSource().addFeatures(featuresNextFrame);
  queue.enqueue(firstLayer);
}
function changeOpacity(
  map: Map,
  frontLayer: Heatmap | undefined,
  backLayer: Heatmap | undefined,
  changeTime?: number,
) {
  try {
    if (!frontLayer || !backLayer) {
      return null;
    }
  } catch (error) {
    console.log(error);
  }

  const interval = changeTime / 1000 || 25; // interval ms更新渲染一帧热力图透明度
  return new Promise((resolve, _reject) => {
    let opacity = 0;
    let lastTime = performance.now(); // 获取当前时间

    let prerenderListener;
    prerenderListener = heatMapLayer1.on('prerender', (_event) => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= interval) {
        // 只有当时间差达到或超过设定的间隔时才更新 opacity
        lastTime = currentTime;
        opacity += 0.01;
        frontLayer!.setOpacity(1 - opacity);
        backLayer!.setOpacity(opacity);
        map.render();
      } else {
        map.render();
      }
      // 以下方法无法实现播放速率控制
      // opacity += 0.01;
      // frontLayer!.setOpacity(1 - opacity);
      // backLayer!.setOpacity(opacity);
      // map.render();
      if (opacity >= 1) {
        console.log(opacity);
        unByKey(prerenderListener);
        prerenderListener = null;
        resolve(true);
      }
    });
  });
}
class Queue<T> {
  items: T[];
  constructor() {
    this.items = [];
  }

  // 入队操作
  enqueue(element: T) {
    this.items.push(element);
  }

  // 出队操作
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items.shift();
  }

  // 获取指定元素
  getElement(index): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items[index];
  }

  // 判断队列是否为空
  isEmpty() {
    return this.items.length === 0;
  }

  // 获取队列的大小
  size() {
    return this.items.length;
  }
}

export async function addDynamicHeatMap(map: Map, params: HeatMapTimeData, changeTime?: number) {
  // 判断图层是否已添加
  if (!map.getLayers().getArray().includes(heatMapLayer1)) {
    map.addLayer(heatMapLayer1);
    map.addLayer(heatMapLayer2);
  }
  response = await getDynamicHouseHeatMap(params);
  response = response.data.dynamicHeatmapList;

  addFirstFeatures();
  const queue = new Queue<Heatmap>();
  queue.enqueue(heatMapLayer1);
  queue.enqueue(heatMapLayer2);

  const length = response.length;
  while (true) {
    let count = 2;
    for (let i = 0; i < length - 1; i++) {
      await changeOpacity(map, queue.getElement(0), queue.getElement(1), changeTime);
      if (count !== length) {
        changeLayer(queue, count);
        count++;
      }
    }
  }
}
