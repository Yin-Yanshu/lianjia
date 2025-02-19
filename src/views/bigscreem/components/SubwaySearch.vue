<template>
  <div class="subway-search-panel">
    <a-select v-model:value="activeLine" @change="subwaySelect">
      <a-select-option v-for="options in subwaylines" :key="options.label" :value="options.value"
        >{{ options.label }}
      </a-select-option>
    </a-select>
  </div>
</template>

<script setup lang="ts">
  import { Map } from 'ol';
  import { useMapStore } from '/@/store/modules/map';
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import { Draw, Interaction, Snap } from 'ol/interaction';
  import VectorSource from 'ol/source/Vector';
  import { Point } from 'ol/geom';
  import GeoJSON from 'ol/format/GeoJSON';
  import VectorLayer from 'ol/layer/Vector';
  import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
  import { getDistance } from 'ol/sphere';
  import { CircleData, getHouseInPlots, getPlotsInCircle, PlotData } from '/@/api/point';
  import { useGlobSetting } from '/@/hooks/setting';
  import { useApiStore } from '/@/store/modules/api';
  import Feature from 'ol/Feature';

  const { geoserverUrl } = useGlobSetting();
  const apiStore = useApiStore();
  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });

  const emits = defineEmits(['subwaySearchResult']);

  let map: Map;

  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
  });

  const subwayLineColors = {
    地铁1号线: 'rgb(234,11,42)',
    地铁2号线: 'rgb(148,212,11)',
    地铁3号线: 'rgb(248,208,0)',
    地铁4号线: 'rgb(96,38,158)',
    地铁5号线: 'rgb(147,76,154)',
    地铁6号线: 'rgb(216,1,105)',
    地铁7号线: 'rgb(254,107,1)',
    地铁8号线: 'rgb(0,160,232)',
    地铁9号线: 'rgb(105,194,232)',
    地铁10号线: 'rgb(195,165,225)',
    地铁11号线: 'rgb(120,34,47)',
    地铁12号线: 'rgb(0,121,96)',
    地铁13号线: 'rgb(240,149,206)',
    地铁14号线: 'rgb(129,119,4)',
    地铁15号线: 'rgb(189,166,133)',
    地铁16号线: 'rgb(42,210,197)',
    地铁17号线: 'rgb(181,119,108)',
    地铁18号线: 'rgb(214,163,97)',
    default: 'rgb(234,11,42)',
  };
  // TODO 后端返回数据
  const subwaylines = {
    lineOne: {
      label: '一号线',
      value: 'lineOne',
      url:
        geoserverUrl +
        '/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line1&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineTwo: {
      label: '二号线',
      value: 'lineTwo',
      url:
        geoserverUrl +
        '/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line2&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineThree: {
      label: '三号线',
      value: 'lineThree',
      url:
        geoserverUrl +
        '/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line3&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFour: {
      label: '四号线',
      value: 'lineFour',
      url:
        geoserverUrl +
        '/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line4&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFive: {
      label: '五号线',
      value: 'lineFive',
      url:
        geoserverUrl +
        '/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line5&maxFeatures=50&outputFormat=application%2Fjson',
    },
  };

  // 获取图层要素信息
  let circleDraw: Interaction | null;
  let snap: Interaction | null;

  let isFirstCall = false;
  const activeLine = ref('请选择地铁线路');
  // 加载WFS服务图层
  const subwayVectorSource = new VectorSource<Point>({
    format: new GeoJSON(),
  });
  const subwayVectorLayer = new VectorLayer({
    source: subwayVectorSource,
    style: (feature) => {
      const line = feature.getProperties().line;
      return new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({
            color: 'rgb(255,255,255)',
          }),
          stroke: new Stroke({
            color: subwayLineColors[line],
            width: 5,
          }),
        }),
      });
    },
  });

  // INFO 选择地铁线路
  function subwaySelect() {
    let url = subwaylines[activeLine.value].url;
    subwayVectorSource.setUrl(url);
    subwayVectorSource.refresh();
    if (!mapStore.isLayerExist(map, subwayVectorLayer)) {
      map.addLayer(subwayVectorLayer);
    }
    if (!isFirstCall) {
      getFeature(map);
      isFirstCall = true;
    }
  }

  const drawStyle = new Style({
    fill: new Fill({
      color: 'rgb(172,223,200,0.4)',
    }),
    stroke: new Stroke({
      color: 'rgb(0,174,102,0.7)',
      width: 2,
    }),
  });

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
        emits('subwaySearchResult', [...response.data]);

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

  function getFeature(map: Map) {
    mapStore.removeListener({});

    let count = false;
    circleDraw = new Draw({
      source: new VectorSource(),
      type: 'Circle',
      style: drawStyle,
      // condition接受boolean，函数返回true绘制当前点
      condition: (event) => {
        if (count) {
          count = false;
          const coordinate = map.getCoordinateFromPixel(event.pixel);
          radius = Math.sqrt(
            Math.pow(center[0] - coordinate[0], 2) + Math.pow(center[1] - coordinate[1], 2),
          );
          return true;
        }
        const pixelCoordinate = map.getCoordinateFromPixel(event.pixel);
        const feature = subwayVectorSource.getClosestFeatureToCoordinate(pixelCoordinate);
        center = feature.getGeometry()!.getCoordinates();
        const distance = getDistance(center, pixelCoordinate);
        if (distance < 10) {
          count = true;
          return true;
        }
        return false;
      },
    });
    snap = new Snap({
      source: subwayVectorSource,
      pixelTolerance: 20,
    });
    map.addInteraction(circleDraw);
    map.addInteraction(snap);

    let center;
    let radius;
    // 本项目规范，一定需要定义但未使用的变量采用_前缀
    const subwaySearchListener = circleDraw.on('drawend', async (_event) => {
      let param: CircleData = {
        latitude: null,
        longitude: null,
        radius: null,
      };
      param.longitude = center[0];
      param.latitude = center[1];
      param.radius = radius;
      // param = searchFilter(param);
      // TODO 修改使支持过滤查询
      apiStore.getFilterParams();
      const response = await getPlotsInCircle(param);
      // TODO 使支持数量统计
      // houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      addOverlay(map, response.data.plots);
      emits('subwaySearchResult', [...response.data.houseList]);
    });
    //  TODO 这个方法在多个组件中使用到，尝试抽取
    const clickPlotListener = getHouseByClickPlot(map);
    const param1 = {
      listener: clickPlotListener,
      listenerId: 'clickPlotListener-subwaySearch',
      listenerGroup: 'subwaySearch',
    };
    const param2 = {
      listener: subwaySearchListener,
      listenerId: 'subwaySearchListener',
      listenerGroup: 'subwaySearch',
    };
    mapStore.addListener([param1, param2]);
  }

  // 地铁查询清除
  function subwaySearchClear() {
    if (snap) {
      map.removeInteraction(snap);
      snap = null;
    }
    if (circleDraw) {
      map.removeInteraction(circleDraw);
      circleDraw = null;
    }
    activeLine.value = '请选择地铁线路';
    subwayVectorSource.clear();
    isFirstCall = false;

    map.removeLayer(subwayVectorLayer);
    map.removeLayer(overLayLayer);
    mapStore.removeListener({ listenerGroup: 'subwaySearch' });
  }

  onBeforeUnmount(() => {
    subwaySearchClear();
  });
</script>

<style scoped>
  .subway-search-panel {
    float: right;
  }
</style>
