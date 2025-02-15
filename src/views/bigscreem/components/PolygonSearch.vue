<template>
  <div></div>
</template>

<script setup lang="ts">
  import { useMapStore } from '/@/store/modules/map';
  import { Draw } from 'ol/interaction';
  import VectorSource from 'ol/source/Vector';
  import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
  import { useApiStore } from '/@/store/modules/api';
  import { Map } from 'ol';
  import { onBeforeUnmount, onMounted } from 'vue';
  import {
    getHouseInPlots,
    getPlotsInPolygon,
    PlotData,
    PointData,
    PolygonData,
  } from '/@/api/point';
  import { Point, Polygon } from 'ol/geom';
  import Feature from 'ol/Feature';
  import VectorLayer from 'ol/layer/Vector';

  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });

  const emits = defineEmits(['polygonSearchResult']);

  let map: Map;
  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
    polygonSearch();
  });

  const apiStore = useApiStore();
  // 多边形搜索处理
  let polygonDraw: Draw;

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
        apiStore.getFilterParams();
        const response = await getHouseInPlots(param);
        emits('polygonSearchResult', [...response.data]);

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

  function polygonSearch() {
    // 清除所有监听器
    mapStore.removeListener({});
    document.body.style.cursor = 'pointer';

    polygonDraw = new Draw({
      source: new VectorSource(),
      type: 'Polygon',
      style: new Style({
        fill: new Fill({
          color: 'rgb(172,223,200,0.4)',
        }),
        stroke: new Stroke({
          color: 'rgb(0,174,102,0.7)',
          width: 2,
        }),
      }),
      // 判断是否点击到了绘制的overlay，如果点击到则结束本次绘制
      condition: (event) => {
        let features = map.getFeaturesAtPixel(event.pixel);
        if (features.length == 0) {
          return true;
        } else if (!features[0].getProperties().plot) {
          return true;
        }
        return false;
      },
    });
    map.addInteraction(polygonDraw);

    // draw.on这些on监听方法好像很奇怪，会导致作用域的问题，
    // 比如const polygon = [];写在draw.on就无法正常清除内部数据
    // gpt解释，每次调用 PolygonSearch 函数时，polygon 数组被清空一次。
    // 但是，如果不在 drawend 事件处理程序内部再进行清空操作，那么数组 polygon 可能会在多次绘制操作之间积累点。
    // let clickPlotListener: EventsKey;
    const polygonSearchListener = polygonDraw.on('drawend', async (event) => {
      const polygons = event.feature.getGeometry() as Polygon;
      let coordinates = polygons!.getCoordinates();
      const polygon: PointData[] = [];
      coordinates[0].forEach((item) => {
        let point: PointData = {
          longitude: item[0],
          latitude: item[1],
        };
        polygon.push(point);
      });
      let param: PolygonData = {
        polygon: polygon,
      };
      // 参数过滤，添加查询限制条件
      // param = searchFilter(param);
      apiStore.getFilterParams();
      const response = await getPlotsInPolygon(param);
      // houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      addOverlay(map, response.data.plots);
      emits('polygonSearchResult', [...response.data.houseList]);
    });
    // 获取小区信息详细房屋信息
    const clickPlotListener = getHouseByClickPlot(map);
    const param1 = {
      listener: clickPlotListener,
      listenerId: 'clickPlotListener-polygonSearch',
      listenerGroup: 'polygonSearch',
    };
    const param2 = {
      listener: polygonSearchListener,
      listenerId: 'polygonSearchListener',
      listenerGroup: 'polygonSearch',
    };
    mapStore.addListener([param1, param2]);
  }

  function polygonSearchClear() {
    console.log('map.getAllLayers()Before;', map.getAllLayers());
    map.removeInteraction(polygonDraw);
    map.removeLayer(overLayLayer);
    mapStore.removeListener({ listenerGroup: 'polygonSearch' });
    document.body.style.cursor = 'default';
    console.log('map.getAllLayers();', map.getAllLayers());
  }

  onBeforeUnmount(() => {
    polygonSearchClear();
  });
</script>

<style scoped></style>
