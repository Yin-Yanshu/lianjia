import { Map } from 'ol';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import { getDynamicHouseHeatMap, HeatMapTimeData } from '/@/api/point';
import { unByKey } from 'ol/Observable';
import { RangePicker } from 'ant-design-vue';
import { createVNode, render, ref } from 'vue';
import { Moment } from 'moment/moment';
import TimeSlider from './components/timeslider.vue';
import moment from 'moment';

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

// export default class DynamicHeatMap {
//   response;
//   private featuresFrontFrame: Feature<Point>[] = [];
//   private featuresBackFrame: Feature<Point>[] = [];
//   private featuresNextFrame: Feature<Point>[] = [];
//   private heatMapSource1 = new VectorSource<Point>();
//   private heatMapSource2 = new VectorSource<Point>();
//   private heatMapLayer1: Heatmap = new Heatmap({
//     source: this.heatMapSource1,
//     blur: 15,
//     radius: 15,
//     gradient: ['#fff', '#E8D225', '#EF1616'],
//     zIndex: 4,
//     opacity: 1,
//   });
//   private heatMapLayer2: Heatmap = new Heatmap({
//     source: this.heatMapSource2,
//     blur: 15,
//     radius: 15,
//     gradient: ['#fff', '#E8D225', '#EF1616'],
//     zIndex: 4,
//     opacity: 1,
//   });
//   private addFirstFeatures() {
//     this.featuresFrontFrame = [];
//     this.featuresFrontFrame = this.response[0].timestampHeatmap.map((item) => {
//       return new Feature({
//         geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
//       });
//     });

//     this.featuresBackFrame = [];
//     this.featuresBackFrame = this.response[1].timestampHeatmap.map((item) => {
//       return new Feature({
//         geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
//       });
//     });

//     this.heatMapSource1.clear();
//     this.heatMapSource2.clear();
//     this.heatMapSource1.addFeatures(this.featuresFrontFrame);
//     this.heatMapSource2.addFeatures(this.featuresBackFrame);
//   }
//   private changeOpacity(
//     frontLayer: Heatmap | undefined,
//     backLayer: Heatmap | undefined,
//     changeTime?: number,
//   ) {
//     try {
//       if (!frontLayer || !backLayer) {
//         return null;
//       }
//     } catch (error) {
//       console.log(error);
//     }

//     // interval ms更新渲染一帧热力图透明度
//     const changeTime_ = changeTime ?? 10000;
//     const interval = changeTime_ / 1000;
//     return new Promise((resolve, _reject) => {
//       let opacity = 0;
//       let lastTime = performance.now(); // 获取当前时间

//       const step = (currentTime: number) => {
//         const deltaTime = currentTime - lastTime;

//         if (deltaTime >= interval) {
//           // 当时间差达到或超过设定的间隔时才更新 opacity
//           lastTime = currentTime;
//           opacity += 0.01;
//           frontLayer!.setOpacity(1 - opacity);
//           backLayer!.setOpacity(opacity);
//         }

//         if (opacity <= 1) {
//           requestAnimationFrame(step); // 继续下一帧
//         } else {
//           resolve(true);
//         }
//       };

//       requestAnimationFrame(step); // 开始动画循环
//     });
//   }
//   private changeLayer(queue, index) {
//     const firstLayer = queue.dequeue();
//     firstLayer.getSource().clear();
//     this.featuresNextFrame = [];
//     this.featuresNextFrame = this.response[index].timestampHeatmap.map((item) => {
//       return new Feature({
//         geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
//       });
//     });
//     firstLayer.getSource().addFeatures(this.featuresNextFrame);
//     queue.enqueue(firstLayer);
//   }

//   length;
//   // 添加动态热力图
//   public async addDynamicHeatMap(map: Map, params: HeatMapTimeData, changeTime?: number) {
//     // 判断图层是否已添加
//     if (!map.getLayers().getArray().includes(this.heatMapLayer1)) {
//       map.addLayer(this.heatMapLayer1);
//       map.addLayer(this.heatMapLayer2);
//     }
//     this.response = await getDynamicHouseHeatMap(params);
//     this.response = this.response.data.dynamicHeatmapList;

//     this.length = this.response.length;
//     this.startLoop(length, changeTime);
//   }
//   // 清除热力图
//   public clearDynamicHeatMap() {
//     this.heatMapSource1.clear();
//     this.heatMapSource2.clear();
//     this.stopLoop();
//   }
//   // 展示一个时间戳数据
//   public async setTimestampHeatmap(timestamp: number) {
//     if (!this.stop) this.stopLoop();
//     this.featuresFrontFrame = [];
//     this.featuresFrontFrame = this.response[timestamp].timestampHeatmap.map((item) => {
//       return new Feature({
//         geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
//       });
//     });
//     this.heatMapSource1.addFeatures(this.featuresFrontFrame);
//     this.heatMapLayer1.setOpacity(1);
//   }
//   // 从数据帧继续循环
//   public timestampContinueLoopHeatmap(timestamp: number) {
//     this.featuresBackFrame = [];
//     this.featuresBackFrame = this.response[timestamp + 1].timestampHeatmap.map((item) => {
//       return new Feature({
//         geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
//       });
//     });
//     this.heatMapSource2.addFeatures(this.featuresBackFrame);
//     this.heatMapLayer2.setOpacity(0);

//     const queue = new Queue<Heatmap>();
//     queue.enqueue(this.heatMapLayer1);
//     queue.enqueue(this.heatMapLayer2);
//     this.startLoop(length, queue);
//   }

//   stop = false;
//   paused = false;
//   // 开启循环
//   public async startLoop(length: number, queue?, continueTimestamp?: number) {
//     // 从指定时间戳开始循环
//     if (queue && continueTimestamp) {
//       let animationFrame = continueTimestamp;

//       this.stop = false;
//       this.paused = false;

//       while (!this.stop) {
//         if (!this.paused) {
//           await this.changeOpacity(queue.getElement(0), queue.getElement(1));
//           this.changeLayer(queue, animationFrame);
//           animationFrame++;
//           if (animationFrame >= length) {
//             animationFrame = 2;
//           }
//         }
//       }
//       queue = null;
//       return;
//     }
//     // 从0帧开始循环
//     this.addFirstFeatures();
//     let heatmapQueue;
//     heatmapQueue = new Queue<Heatmap>();
//     heatmapQueue.enqueue(this.heatMapLayer1);
//     heatmapQueue.enqueue(this.heatMapLayer2);

//     let animationFrame = 2;

//     this.stop = false;
//     this.paused = false;

//     while (!this.stop) {
//       if (!this.paused) {
//         await this.changeOpacity(heatmapQueue.getElement(0), heatmapQueue.getElement(1));
//         this.changeLayer(heatmapQueue, animationFrame);
//         animationFrame++;
//         if (animationFrame >= length) {
//           animationFrame = 2;
//         }
//       }
//     }
//     heatmapQueue = null;
//   }
//   // 结束循环
//   public stopLoop() {
//     this.stop = true;
//     this.heatMapSource1.clear();
//     this.heatMapSource2.clear();
//   }
//   // 暂停
//   public pauseLoop() {
//     this.paused = true;
//   }
//   // 继续
//   public resumeLoop() {
//     this.paused = false;
//   }
// }

export function useDynamicHeatmap(map: Map) {
  let featuresFrontFrame: Feature<Point>[] = [];
  let featuresBackFrame: Feature<Point>[] = [];
  let featuresNextFrame: Feature<Point>[] = [];
  const heatMapSource1 = new VectorSource<Point>();
  const heatMapSource2 = new VectorSource<Point>();
  const heatMapLayer1: Heatmap = new Heatmap({
    source: heatMapSource1,
    blur: 15,
    radius: 15,
    gradient: ['#fff', '#E8D225', '#EF1616'],
    zIndex: 4,
    opacity: 1,
  });
  const heatMapLayer2: Heatmap = new Heatmap({
    source: heatMapSource2,
    blur: 15,
    radius: 15,
    gradient: ['#fff', '#E8D225', '#EF1616'],
    zIndex: 4,
    opacity: 1,
  });

  function addFirstFeatures() {
    featuresFrontFrame = [];
    featuresFrontFrame = response.value[0].timestampHeatmap.map((item) => {
      return new Feature({
        geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
      });
    });

    featuresBackFrame = [];
    featuresBackFrame = response.value[1].timestampHeatmap.map((item) => {
      return new Feature({
        geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
      });
    });

    heatMapSource1.clear();
    heatMapSource2.clear();
    heatMapSource1.addFeatures(featuresFrontFrame);
    heatMapSource2.addFeatures(featuresBackFrame);
  }
  function changeOpacity(
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

    // interval ms更新渲染一帧热力图透明度默认值10ms
    const changeTime_ = changeTime ?? 10;
    const interval = changeTime_;
    return new Promise((resolve, _reject) => {
      let opacity = 0;
      let lastTime = performance.now(); // 获取当前时间

      // const step = (currentTime: number) => {
      //   const deltaTime = currentTime - lastTime;

      //   if (deltaTime >= interval) {
      //     // 当时间差达到或超过设定的间隔时才更新 opacity
      //     lastTime = currentTime;
      //     opacity += 0.01;
      //     frontLayer!.setOpacity(1 - opacity);
      //     backLayer!.setOpacity(opacity);
      //   }

      //   if (opacity <= 1) {
      //     requestAnimationFrame(step); // 继续下一帧
      //   } else {
      //     resolve(true);
      //   }
      // };

      // requestAnimationFrame(step); // 开始动画循环

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
        if (opacity >= 1) {
          console.log(opacity);
          unByKey(prerenderListener);
          prerenderListener = null;
          resolve(true);
        }
      });
    });
  }
  function changeLayer(queue, index) {
    const firstLayer = queue.dequeue();
    firstLayer.getSource().clear();
    featuresNextFrame = [];
    featuresNextFrame = response[index].timestampHeatmap.map((point) => {
      return new Feature({
        geometry: new Point([point.wgs84_lng, point.wgs84_lat]), // 添加点坐标
      });
    });
    firstLayer.getSource().addFeatures(featuresNextFrame);
    queue.enqueue(firstLayer);
  }

  const response = ref();
  let length;
  // 添加动态热力图
  async function addDynamicHeatMap(params: HeatMapTimeData) {
    if (!stop) stopLoop();
    // 判断图层是否已添加
    if (!map.getLayers().getArray().includes(heatMapLayer1)) {
      map.addLayer(heatMapLayer1);
      map.addLayer(heatMapLayer2);
    }
    const result = await getDynamicHouseHeatMap(params);
    response.value = result.data.dynamicHeatmapList;

    length = response.value.length;
    startLoop(length);
  }
  // 清除热力图
  function clearDynamicHeatMap() {
    heatMapSource1.clear();
    heatMapSource2.clear();
    stopLoop();
  }
  // 展示一个时间戳数据
  async function setTimestampHeatmap(timestamp: number) {
    if (!stop) stopLoop();
    featuresFrontFrame = [];
    featuresFrontFrame = response.value[timestamp].timestampHeatmap.map((point) => {
      return new Feature({
        geometry: new Point([point.wgs84_lng, point.wgs84_lat]), // 添加点坐标
      });
    });
    heatMapSource1.clear();
    heatMapSource1.addFeatures(featuresFrontFrame);
    heatMapLayer1.setOpacity(1);
  }
  // 从数据帧继续循环
  function timestampContinueLoopHeatmap(timestamp: number) {
    featuresBackFrame = [];
    featuresBackFrame = response.value[timestamp + 1].timestampHeatmap.map((point) => {
      return new Feature({
        geometry: new Point([point.wgs84_lng, point.wgs84_lat]), // 添加点坐标
      });
    });
    heatMapSource2.addFeatures(featuresBackFrame);
    heatMapLayer2.setOpacity(0);

    let heatmapQueue;
    heatmapQueue = new Queue<Heatmap>();
    heatmapQueue.enqueue(heatMapLayer1);
    heatmapQueue.enqueue(heatMapLayer2);
    startLoop(length, heatmapQueue, timestamp);
    heatmapQueue = null;
  }

  let stop = false;
  let paused = false;
  const animationFrame = ref(2);
  // 开启循环
  async function startLoop(length: number, queue?: Queue<Heatmap>, continueTimestamp?: number) {
    // 从指定时间戳开始循环
    if (queue && continueTimestamp) {
      let animationFrame = continueTimestamp;

      stop = false;
      paused = false;

      async function animate(heatmapQueue) {
        if (stop) return;
        if (!paused) {
          console.log('heatmapQueue', heatmapQueue);
          await changeOpacity(heatmapQueue.getElement(0), heatmapQueue.getElement(1));
          changeLayer(heatmapQueue, animationFrame);
          animationFrame++;
          if (animationFrame >= length) {
            animationFrame = 2;
          }
        }
        // 使用 requestAnimationFrame 进行下一帧的调度，避免阻塞主线程
        requestAnimationFrame(() => {
          animate(heatmapQueue);
        });
      }
      animate(queue);
      // queue = null;  虽然对象为引用传入，但在函数内只将传入引用置空，使函数内无法再访问queue，外部未置空
      return;
    }
    // 从0帧开始循环
    addFirstFeatures();
    let heatmapQueue;
    heatmapQueue = new Queue<Heatmap>();
    heatmapQueue.enqueue(heatMapLayer1);
    heatmapQueue.enqueue(heatMapLayer2);

    stop = false;
    paused = false;

    // while同步操作，while(true)会阻塞其他js程序
    // while (!stop) {
    //   if (!paused) {
    //     await changeOpacity(heatmapQueue.getElement(0), heatmapQueue.getElement(1));
    //     changeLayer(heatmapQueue, animationFrame);
    //     animationFrame++;
    //     if (animationFrame >= length) {
    //       animationFrame = 2;
    //     }
    //   } else {
    //     console.log('test');
    //   }
    // }

    async function animate(heatmapQueue) {
      if (stop) return;
      if (!paused) {
        console.log('heatmapQueue', heatmapQueue);
        await changeOpacity(heatmapQueue.getElement(0), heatmapQueue.getElement(1));
        changeLayer(heatmapQueue, animationFrame.value);
        animationFrame.value++;
        if (animationFrame.value >= length) {
          animationFrame.value = 0;
        }
      }
      // 使用 requestAnimationFrame 进行下一帧的调度，避免阻塞主线程
      requestAnimationFrame(() => {
        animate(heatmapQueue);
      });
    }
    animate(heatmapQueue);

    heatmapQueue = null;
  }
  // 结束循环
  function stopLoop() {
    stop = true;
    heatMapSource1.clear();
    heatMapSource2.clear();
  }
  // 暂停
  function pauseLoop() {
    paused = true;
  }
  // 继续
  function resumeLoop() {
    paused = false;
  }

  function setCalenderContainer(el: HTMLDivElement) {
    type RangeValue = [Moment, Moment];
    const dates = ref<RangeValue>();
    const value = ref<RangeValue>();
    const hackValue = ref<RangeValue>();

    const disabledDate = (current: Moment) => {
      if (!dates.value || (dates.value as any).length === 0) {
        return false;
      }
      const tooLate = dates.value[0] && current.diff(dates.value[0], 'days') > 30;
      const tooEarly = dates.value[1] && dates.value[1].diff(current, 'days') > 30;
      return tooEarly || tooLate;
    };

    const onOpenChange = (open: boolean) => {
      if (open) {
        dates.value = [] as any;
        hackValue.value = [] as any;
      } else {
        hackValue.value = undefined;
      }
    };

    const onChange = (val: RangeValue) => {
      value.value = val;
    };

    const onCalendarChange = (val: RangeValue) => {
      dates.value = val;
      // console.log('value.value[0]', value.value[0]);
      // console.log('value.value[1]', value.value[1]);
      // const params = {} as HeatMapTimeData;
      // params.start_time = value.value[0].format('YYYY-MM-DD');
      // params.end_time = value.value[1].format('YYYY-MM-DD');
      // addDynamicHeatMap(params);
    };

    const vnode = createVNode(RangePicker, {
      class: 'time-picker',
      style: {
        width: '100%',
        backgroundColor: '#f0f0f0',
      },
      value: hackValue.value || value.value,
      disabledDate: disabledDate,
      onChange: onChange,
      onOpenChange: onOpenChange,
      onCalendarChange: onCalendarChange,
    });

    // 将虚拟节点渲染到指定的elRef
    render(vnode, el);
  }

  function setTimeSliderContainer(el: HTMLDivElement) {
    function initTimeSlider_() {
      const timeList = response.value.map((item) => {
        const date = moment(item.time, 'YYYY-MM-DD');
        const time = date.format('MM-DD');
        return time;
      });
      const vnode = createVNode(TimeSlider, {
        values: timeList,
        timeStamp: animationFrame,
        onContinueLoop: timestampContinueLoopHeatmap,
        onBeforeButton: setTimestampHeatmap,
        onNextButton: setTimestampHeatmap,
      });
      return vnode;
    }
    const vnode = initTimeSlider_();
    render(vnode, el);
  }

  function setInteraction(elCalender: HTMLDivElement, elSlider: HTMLDivElement) {
    setCalenderContainer(elCalender);
    setTimeSliderContainer(elSlider);
  }

  return {
    addDynamicHeatMap,
    clearDynamicHeatMap,
    setTimestampHeatmap,
    timestampContinueLoopHeatmap,
    startLoop,
    stopLoop,
    pauseLoop,
    resumeLoop,
    setCalenderContainer,
    setTimeSliderContainer,
    setInteraction,
  };
}
