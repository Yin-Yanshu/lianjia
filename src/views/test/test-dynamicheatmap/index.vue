<template>
  <div id="container"></div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue';
  import addMap from '/@/store/modules/map';
  import { Map } from 'ol';
  import { getDynamicHouseHeatMap } from '/@/api/point.ts';
  import Feature from 'ol/Feature';
  import { Point } from 'ol/geom';
  import Heatmap from 'ol/layer/Heatmap';
  import VectorSource from 'ol/source/Vector';

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
    gradient: ['#2200FF', '#E8D225', '#EF1616'],
    zIndex: 4,
    opacity: 0,
  });

  let response;
  let featuresFrontFrame: Feature<Point>[] = [];
  let featuresBackFrame: Feature<Point>[] = [];
  let featuresNextFrame: Feature<Point>[] = [];

  async function addDynamicHeatMapTest(map: Map, params) {
    // 判断图层是否已添加
    if (!map.getLayers().getArray().includes(heatMapLayer1)) {
      map.addLayer(heatMapLayer1);
      map.addLayer(heatMapLayer2);
    }
    response = await getDynamicHouseHeatMap(params);
    response = response.data.dynamicHeatmapList;
    console.log('response', response);

    addFirstFeatures();
    const queue = new Queue<Heatmap>();
    queue.enqueue(heatMapLayer1);
    queue.enqueue(heatMapLayer2);

    const length = response.length;
    while (true) {
      let count = 2;
      for (let i = 0; i < length - 1; i++) {
        await changeOpacityTest2(queue.getElement(0), queue.getElement(1));
        console.log('渲染一个变化帧');
        if (count !== length) {
          changeLayer(queue, count);
          count++;
          console.log('切换图层');
        }
      }
    }
    // let count = 2;
    // const length = response.length;
    // console.time('起始时间');
    // for (let i = 0; i < length - 1; i++) {
    //   await changeOpacityTest2(queue.getElement(0), queue.getElement(1));
    //   console.log('渲染一个变化帧');
    //   if (count !== length) {
    //     changeLayer(queue, count);
    //     count++;
    //     console.log('切换图层');
    //   }
    // }
    // console.timeEnd('结束时间');

    // 每个Interval为一个变化帧，即从source1渐变至source2
    // let count = 2;
    // const length = response.length;
    // const interval = setInterval(() => {
    //   // 更新source透明度，完成渐变效果后回调切换图层顺寻并更新数据
    //   changeOpacityTest(queue.getElement(0), queue.getElement(1), () => {
    //     changeLayer(queue, count);
    //   });
    //   if (count > length) {
    //     count = 3;
    //     console.log('结束循环');
    //     clearInterval(interval);
    //   }
    //   console.log('切换图层');
    //   count++;
    // }, 700);

    // for (let i = 0; i < length - 1; i++) {
    //   changeOpacityTest2(queue.getElement(0), queue.getElement(1)).then(() => {
    //     count++;
    //     changeLayer(queue, count);
    //   });
    // }
  }
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
    let firstLayer = queue.dequeue();
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
  function changeOpacityTest2(frontLayer: Heatmap | undefined, backLayer: Heatmap | undefined) {
    console.log('frontLayer', frontLayer);
    console.log('backLayer', backLayer);
    // return new Promise((resolve, _reject) => {
    //   let opacity = 0;
    //   const interval = setInterval(() => {
    //     frontLayer.setOpacity(1 - opacity);
    //     backLayer.setOpacity(opacity);
    //     console.log('frontLayer', frontLayer.getOpacity());
    //     console.log('backLayer', backLayer.getOpacity());

    //     opacity += 0.1;
    //     if (opacity >= 1) {
    //       opacity = 0;
    //       clearInterval(interval);
    //       resolve('ok');
    //     }
    //   }, 50);
    // });

    try {
      if (!frontLayer || !backLayer) {
        return null;
      }
    } catch (error) {
      console.log(error);
    }

    return new Promise((resolve, _reject) => {
      let opacity = 0;
      const interval = 25; // 25ms更新渲染一帧热力图透明度
      let lastTime = performance.now(); // 获取当前时间

      const step = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;

        if (deltaTime >= interval) {
          // 只有当时间差达到或超过设定的间隔时才更新 opacity
          lastTime = currentTime;
          opacity += 0.01;
          frontLayer!.setOpacity(1 - opacity);
          backLayer!.setOpacity(opacity);
        }

        if (opacity <= 1) {
          requestAnimationFrame(step); // 继续下一帧
        } else {
          resolve(true);
        }
      };

      requestAnimationFrame(step); // 开始动画循环

      // let opacity = 0;
      // let lastTime = performance.now();
      // while (opacity <= 1) {
      //   const interval = 25; // 25ms更新渲染一帧热力图透明度
      //   let currentTime = performance.now(); // 获取当前时间

      //   if (currentTime - lastTime >= interval) {
      //     // 只有当时间差达到或超过设定的间隔时才更新 opacity
      //     lastTime = currentTime;
      //     opacity += 0.01;
      //     frontLayer!.setOpacity(1 - opacity);
      //     backLayer!.setOpacity(opacity);
      //   }
      // }
      // resolve('ok');
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

  // Internal控制渲染间隔似乎不太合理，Internal为异步函数，似乎不会等待opacity更改完成就切换图层顺序
  // let opacity = 0;
  // function changeOpacityTest(frontLayer: Heatmap, backLayer: Heatmap, callback: Function) {
  //   const interval = setInterval(() => {
  //     frontLayer.setOpacity(1 - opacity);
  //     backLayer.setOpacity(opacity);

  //     opacity += 0.1;
  //     if (opacity >= 1) {
  //       opacity = 0;
  //       clearInterval(interval);
  //       callback();
  //     }
  //   }, 50);
  // }

  const params = {
    start_time: '2024-01-10',
    end_time: '2024-01-20',
  };
  let map: Map;
  onMounted(() => {
    map = addMap('container', 'testDynamicHeatmap');
    addDynamicHeatMapTest(map, params);
  });
</script>

<style scoped>
  #container {
    height: 100%;
    width: 100%;
  }
</style>
