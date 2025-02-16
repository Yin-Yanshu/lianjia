<template>
  <div class="arrival-range-panel">
    <div class="arrival-slider">
      <span>通勤时间 </span>
      <a-slider v-model:value="arriveTime" :min="10" :max="45" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Map } from 'ol';
  import { useMapStore } from '/@/store/modules/map';
  import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import {
    getHouseInPlots,
    getPlotsInPolygonList,
    PlotData,
    PointData,
    PolygonData,
    PolygonListData,
  } from '/@/api/point';
  import initGaoDe from '/@/utils/gaode';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  import { Point, Polygon } from 'ol/geom';
  import Feature from 'ol/Feature';

  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });

  const emits = defineEmits(['arrivalRangeSearchResult']);

  let map: Map;

  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
    arrivalRangeSearch();
  });

  // 公交可达圈分析处理
  let isDrawLayerAdd = false;
  const arriveTime = ref(20);
  const arriveOption = ref('SUBWAY,BUS');
  const drawVectorSource = new VectorSource();
  const drawVectorLayer = new VectorLayer({
    source: drawVectorSource,
    style: new Style({
      fill: new Fill({
        color: 'rgb(172,223,200,0.4)',
      }),
      stroke: new Stroke({
        color: 'rgb(0,174,102,0.7)',
        width: 2,
      }),
    }),
  });

  // 矢量图层绘制
  function VectorLayerDraw(polygon) {
    drawVectorSource.clear();
    let featureArray: Feature[] = [];
    polygon.forEach((element) => {
      let feature = new Feature({
        geometry: new Polygon(element),
      });
      featureArray.push(feature);
    });
    drawVectorSource.addFeatures(featureArray);
    if (!isDrawLayerAdd) {
      // 限制图层叠加至最底层，index=0为高德切片地图
      map.getLayers().insertAt(1, drawVectorLayer);
      isDrawLayerAdd = true;
    }
  }

  // 使用canvas创建 text 文本中的内容，但不渲染至屏幕，仅用于计算text像素长度
  const canvas = document.createElement('canvas');
  // 使用非空断言操作符!
  const context = canvas.getContext('2d')!;
  context.font = '14px Arial';
  // popup图标绘制
  const overLayLayer = new VectorLayer({
    source: new VectorSource<Point>(),
    // 传入style处理函数
    style: (feature) => {
      const property = feature.getProperties();
      const count = property.count;
      const plot = property.plot;
      const text = plot + '|' + count + '套';
      // 计算text像素长度
      const textWidth = context.measureText(text).width;

      return new Style({
        text: new Text({
          font: '14px Arial',
          text: text,
          fill: new Fill({ color: '#fff' }),
          offsetX: 8,
        }),
        image: new Icon({
          src: '/resource/svg/overlay-bg.svg',
          anchor: [0.5, 20],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          scale: [textWidth / 100, 0.9],
        }),
      });
    },
  });

  /**
   * 添加overlay图层内容
   * @param map 添加要素至地图
   * @param data feature数据
   */
  // TODO 尝试优化addOverlay
  function addOverlay(map: Map, data: any[]) {
    const overlayFeatureArray = data.map((element) => {
      let feature = new Feature({
        geometry: new Point([element.wgs84_lng, element.wgs84_lat]),
      });
      feature.setProperties({
        count: element.count,
        plot: element.plot,
      });
      return feature;
    });

    overLayLayer.getSource()!.clear();
    overLayLayer.getSource()!.addFeatures(overlayFeatureArray);

    if (!mapStore.isLayerExist(map, overLayLayer)) {
      map.addLayer(overLayLayer);
    }
  }

  let currentOverlayPoint;

  // 为符合ts编译检查将overLayLayer图层style函数
  function changeOverLayStyle(feature, type = 'default') {
    const property = feature.getProperties();
    const count = property.count;
    const plot = property.plot;
    const text = plot + '|' + count + '套';
    // 计算text像素长度
    const textWidth = context.measureText(text).width;

    if (type === 'click') {
      return new Style({
        text: new Text({
          font: '14px Arial',
          text: text,
          fill: new Fill({ color: '#fff' }),
          offsetX: 8,
        }),
        image: new Icon({
          src: '/resource/svg/overlay-bg-click.svg',
          anchor: [0.5, 20],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          scale: [textWidth / 100, 0.9],
        }),
      });
    }
    if (type === 'default') {
      return new Style({
        text: new Text({
          font: '14px Arial',
          text: text,
          fill: new Fill({ color: '#fff' }),
          offsetX: 8,
        }),
        image: new Icon({
          src: '/resource/svg/overlay-bg.svg',
          anchor: [0.5, 20],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          scale: [textWidth / 100, 0.9],
        }),
      });
    }
    return new Style({
      text: new Text({
        font: '14px Arial',
        text: text,
        fill: new Fill({ color: '#fff' }),
        offsetX: 8,
      }),
      image: new Icon({
        src: '/resource/svg/overlay-bg.svg',
        anchor: [0.5, 20],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: [textWidth / 100, 0.9],
      }),
    });
  }

  function getHouseByClickPlot(map: Map) {
    return map.on('click', async (event) => {
      const features = map.getFeaturesAtPixel(event.pixel);
      if (features.length == 0) {
        return;
      }

      let property;
      // 返回第一个小区概况feature
      let feature = features.find((item) => {
        return item.getProperties().plot;
      });
      // 获取小区概况feature的property
      if (feature) {
        property = feature.getProperties();
      }
      // 获取到小区名查询具体租房信息
      if (property) {
        let param: PlotData = {
          plot: property.plot,
        };
        // param = searchFilter(param);
        // TODO 修改使支持过滤查询
        // apiStore.getFilterParams();
        const response = await getHouseInPlots(param);
        emits('arrivalRangeSearchResult', [...response.data]);

        // 还原上一点样式
        if (currentOverlayPoint) {
          const style = changeOverLayStyle(currentOverlayPoint);
          currentOverlayPoint.setStyle(style);
        }
        // 更改当前点样式为点击状态
        const style = changeOverLayStyle(features[0], 'click');
        // 使用类型断言告诉编译器features[0]的类型为FeatureLike中的Feature类型
        (features[0] as Feature).setStyle(style);
        currentOverlayPoint = features[0];
      }
    });
  }

  // INFO 可达范围搜索功能
  function arrivalRangeSearch() {
    // 清除所有监听函数
    mapStore.removeListener({});
    document.body.style.cursor = 'pointer';
    // document.body.style.cursor = "url('/resource/img/pwa-192x192.png')";
    // TODO 点击位置添加起始图标
    const arrivalSearchListener = map.on('click', (event) => {
      // 处理思路：判断获取到要素是否含有小区overlay要素，未找到则调用高德api
      let pixelCoordinate = map.getCoordinateFromPixel(event.pixel);
      let feature = map.getFeaturesAtPixel(event.pixel);

      // console.log('feature', feature);
      // 查找点击点是否含有小区overlay要素
      let plot = feature.find((item) => {
        return item.getProperties().plot;
      });
      // 该点找到小区overlay要素中断后续操作
      if (plot) return;

      // 该点找到小区overlay要素,调用高德api
      const { arrivalRangePromise } = initGaoDe();
      arrivalRangePromise.then((arrivalRange) => {
        const polygonList = [] as PolygonData[];
        let polygonListParam: PolygonListData = { polygonList: polygonList };

        // (起点坐标，到达时间，回调函数，出行方式)
        arrivalRange.search(
          [pixelCoordinate[0], pixelCoordinate[1]],
          arriveTime.value,
          async (_status, result) => {
            VectorLayerDraw(result.bounds);
            polygonList.length = 0;

            result.bounds.forEach((element) => {
              const polygon = [] as PointData[];
              let polygonParam: PolygonData = {
                polygon: polygon,
              };
              element[0].forEach((item) => {
                let point: PointData = {
                  longitude: item[0],
                  latitude: item[1],
                };
                polygon.push(point);
              });
              polygonList.push(polygonParam);
            });
            // 查询参数过滤器
            // polygonListParam = searchFilter(polygonListParam);
            const response = await getPlotsInPolygonList(polygonListParam);
            // houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
            addOverlay(map, response.data.plots);
            emits('arrivalRangeSearchResult', [...response.data.houseList]);
          },
          {
            policy: arriveOption.value,
          },
        );
      });
    });
    const clickPlotListener = getHouseByClickPlot(map);
    const param1 = {
      listener: clickPlotListener,
      listenerId: 'clickPlotListener-arrivalRangeSearch',
      listenerGroup: 'arrivalRangeSearch',
    };
    const param2 = {
      listener: arrivalSearchListener,
      listenerId: 'arrivalSearchListener',
      listenerGroup: 'arrivalRangeSearch',
    };
    mapStore.addListener([param1, param2]);
  }

  function arrivalRangeSearchClear() {
    map.removeLayer(overLayLayer);
    map.removeLayer(drawVectorLayer);
    mapStore.removeListener({ listenerGroup: 'arrivalRangeSearch' });
    document.body.style.cursor = 'default';
  }

  onBeforeUnmount(() => {
    arrivalRangeSearchClear();
  });
</script>

<style scoped>
  .arrival-range-panel {
    background-color: rgb(255, 255, 255);
    padding: 10px;
  }
</style>
