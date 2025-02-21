<template>
  <div class="path-planing-container">
    <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
      <a-form-item label="起点">
        <a-input v-model:value="pathPlaningForm.startPlace" @click="activeInputHandler(1)" />
      </a-form-item>
      <a-form-item label="终点">
        <a-input id="2" v-model:value="pathPlaningForm.endPlace" @click="activeInputHandler(2)" />
      </a-form-item>
      <a-button class="path-planing-form-button" @click="pathPlaning">搜索</a-button>
    </a-form>
    <a-list
      class="middle-item-searchlist"
      :data-source="placeInfoList"
      item-layout="horizontal"
      :pagination="pagination"
    >
      <template #renderItem="{ item }">
        <a-list-item @click="pathPlaningListItemClickHandler(item)">
          <a-list-item-meta>
            <template #description>
              <div>{{ item.name }}</div>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, reactive, ref, watchEffect } from 'vue';
  import Feature from 'ol/Feature';
  import { LineString, Point } from 'ol/geom';
  import initGaoDe from '/@/utils/gaode';
  import { Icon, Stroke, Style } from 'ol/style';
  import VectorSource from 'ol/source/Vector';
  import VectorLayer from 'ol/layer/Vector';
  import { Map } from 'ol';
  import { Group } from 'ol/layer';
  import { useMapStore } from '/@/store/modules/map';

  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });

  const pathPlaningForm = reactive({
    startPlace: '',
    endPlace: '',
  });
  const pagination = {
    pageSize: 4,
  };

  const { autoCompletePromise, pathPlaningPromise } = initGaoDe();

  const placeInfoList = ref();

  function autoCompleteSearch(name) {
    autoCompletePromise.then((autoComplete) => {
      autoComplete.search(name, (_status, result) => {
        placeInfoList.value = result.tips;
      });
    });
  }

  watchEffect(() => {
    if (pathPlaningForm.startPlace) {
      autoCompleteSearch(pathPlaningForm.startPlace);
    }
    if (pathPlaningForm.endPlace) {
      autoCompleteSearch(pathPlaningForm.endPlace);
    }
  });
  const activeInput = ref(0);

  function activeInputHandler(index) {
    activeInput.value = index;
  }

  function pathPlaningListItemClickHandler(item) {
    if (activeInput.value === 0) return;
    if (activeInput.value === 1) {
      pathPlaningForm.startPlace = '';
      pathPlaningForm.startPlace = item.name;
    }
    if (activeInput.value === 2) {
      pathPlaningForm.endPlace = '';
      pathPlaningForm.endPlace = item.name;
    }
  }

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
  const defaultPathStyle = new Style({
    stroke: new Stroke({
      color: 'rgb(39,117,72)',
      width: 20,
    }),
  });
  const walkStyle = new Style({
    stroke: new Stroke({
      color: 'rgb(10,14,12,0.5)',
      width: 10,
    }),
  });
  const busStyle = new Style({
    stroke: new Stroke({
      color: 'rgb(39,117,72)',
      width: 20,
    }),
  });
  const subwayWrapperStyle = new Style({
    stroke: new Stroke({
      color: 'rgb(255,255,255,0.9)',
      width: 24,
    }),
  });
  // NOTE 缓存实例对象方法 缓存subway样式，减少重复new Style
  const planingStyleCache = {};

  function getPlaningStyle(line) {
    if (planingStyleCache[line]) {
      return planingStyleCache[line];
    }
    const style = new Style({
      stroke: new Stroke({
        color: subwayLineColors[line] || subwayLineColors['default'],
        width: 20,
      }),
    });
    planingStyleCache[line] = style;
    return style;
  }

  function planingUpperStyle(feature: Feature) {
    const transit_mode = feature.get('transit_mode');
    switch (transit_mode) {
      case 'WALK':
        return walkStyle;
      case 'SUBWAY':
        const line = feature.get('line');
        return getPlaningStyle(line);
      case 'BUS':
        return busStyle;
      default:
        return defaultPathStyle;
    }
  }

  function planingDownStyle(feature) {
    const transit_mode = feature.get('transit_mode');
    switch (transit_mode) {
      case 'SUBWAY':
        return subwayWrapperStyle;
    }
  }

  function isPointOnLine(point: number[], lineStart: number[], lineEnd: number[]): boolean {
    const [xPoint, yPoint] = point;
    const [xStart, yStart] = lineStart;
    const [xEnd, yEnd] = lineEnd;

    // 边界框检查，快速排除位于直线边框外的点
    // BUG 为什么启用边框检查后就能修正箭头指向错误的问题
    if (
      xPoint < Math.min(xStart, xEnd) ||
      xPoint > Math.max(xStart, xEnd) ||
      yPoint < Math.min(yStart, yEnd) ||
      yPoint > Math.max(yStart, yEnd)
    ) {
      return false;
    }

    // 如果起点和终点相同，则没有定义直线，返回false
    if (xStart === xEnd && yStart === yEnd) return false;

    // 计算向量p1p和p1p2的行列式（在二维中类似于叉积）
    // 行列式 = (x2-x1)*(y-y1) - (y2-y1)*(x-x1)
    const isOnLine = (xEnd - xStart) * (yPoint - yStart) - (yEnd - yStart) * (xPoint - xStart);

    return Math.abs(isOnLine) < 1e-7;
  }

  const pathPlaningSource = new VectorSource();
  const pathPlaningArrowSource = new VectorSource<Point>();
  const pathPlaningPopupSource = new VectorSource();
  const pathPlaningUpperLayer = new VectorLayer({
    source: pathPlaningSource,
    style: planingUpperStyle,
  });
  const pathPlaningDownLayer = new VectorLayer({
    source: pathPlaningSource,
    style: planingDownStyle,
  });
  const arrow_scale = {
    BUS: [0.1, 0.1],
    SUBWAY: [0.1, 0.1],
    WALK: [0.05, 0.05],
  };
  const pathPlaningArrowLayer = new VectorLayer({
    source: pathPlaningArrowSource,
    style: (feature) => {
      let coordinates = (feature.getGeometry() as Point)?.getCoordinates();
      let returnStyle;
      let rotation;
      lineFeatureList.forEach((lineFeature) => {
        lineFeature.getGeometry()?.forEachSegment((start, end) => {
          if (isPointOnLine(coordinates, start, end)) {
            const transit_mode = lineFeature.getProperties().transit_mode;
            let dx = end[0] - start[0];
            let dy = end[1] - start[1];
            rotation = Math.atan(dx / dy);
            rotation = dy > 0 ? rotation : Math.PI + rotation;
            returnStyle = new Style({
              image: new Icon({
                src: '/resource/svg/path-arrow.svg',
                imgSize: [200, 200],
                scale: arrow_scale[transit_mode] || [0.1, 0.1],
                rotation: rotation,
              }),
            });
          }
        });
      });
      return returnStyle;
    },
  });
  // 内部使用image = new Image()创建的图片 image.src = '文件路径'加载图片,在开发环境使用public路径无法加载
  const startIcon = new Style({
    image: new Icon({
      src: '/resource/svg/start-point.svg',
      imgSize: [200, 200],
      scale: [0.2, 0.2],
    }),
  });
  const endIcon = new Style({
    image: new Icon({
      src: '/resource/svg/end-point.svg',
      imgSize: [200, 200],
      scale: [0.2, 0.2],
    }),
  });
  const busIcon = new Style({
    image: new Icon({
      src: '/resource/svg/bus.svg',
      imgSize: [200, 200],
      scale: [0.15, 0.15],
    }),
  });
  const subwayIcon = new Style({
    image: new Icon({
      src: '/resource/svg/subway.svg',
      imgSize: [200, 200],
      scale: [0.2, 0.2],
    }),
  });
  const pathPlaningPopupLayer = new VectorLayer({
    source: pathPlaningPopupSource,
    // BUG style可选返回值ts类型匹配失败
    // style可选返回值 StyleLike | null | undefined
    // StyleLike为Style|Array<Style>|StyleFunction联合类型，似乎手动返回null无法让ts正确匹配
    style: (feature) => {
      const popupType = feature.getProperties()?.popupType;
      // if (!popupType) return null;
      if (popupType === 'start') {
        return startIcon;
      }
      if (popupType === 'end') {
        return endIcon;
      }
      if (popupType === 'transit') {
        const transit_mode = feature.getProperties()?.transit_mode;
        // if (!transit_mode) return null;
        if (transit_mode === 'BUS') {
          return busIcon;
        }
        if (transit_mode === 'SUBWAY') {
          return subwayIcon;
        }
      }
      // 为什么ts无法推断出手动返回null的情况
      // return null;
    },
  });
  let pathPlaningGroupLayer: Group;

  // INFO 路径规划
  let lineFeatureList: Feature<LineString>[];

  /**
   * 输入起终地点名进行路径规划
   */
  function pathPlaning() {
    mapStore.removeListener({});
    pathPlaningPromise.then((pathPlaning) => {
      pathPlaning.search(
        [{ keyword: pathPlaningForm.startPlace }, { keyword: pathPlaningForm.endPlace }],
        (_status, result) => {
          const popupFeaturesArray: Feature[] = [];
          const startFeature = new Feature({
            geometry: new Point([result.start.location.lng, result.start.location.lat]),
          });
          const endFeature = new Feature({
            geometry: new Point([result.end.location.lng, result.end.location.lat]),
          });
          startFeature.set('popupType', 'start');
          endFeature.set('popupType', 'end');
          popupFeaturesArray.push(startFeature, endFeature);

          lineFeatureList = result.plans[0].segments.map((segment) => {
            // 构建交通类型图标
            let segmentStartFeature;
            if (segment.transit.origin) {
              segmentStartFeature = new Feature({
                geometry: new Point([segment.transit.origin.lng, segment.transit.origin.lat]),
              });
            }
            if (segment.transit.on_station) {
              segmentStartFeature = new Feature({
                geometry: new Point([
                  segment.transit.on_station.location.lng,
                  segment.transit.on_station.location.lat,
                ]),
              });
            }
            segmentStartFeature.set('popupType', 'transit');
            segmentStartFeature.set('transit_mode', segment.transit_mode);
            popupFeaturesArray.push(segmentStartFeature);

            // 构建线路feature信息
            const segmentLine = segment.transit.path.map((element) => {
              return [element.lng, element.lat];
            });
            const segmentLineFeature = new Feature({
              geometry: new LineString(segmentLine),
            });
            const instruction = segment.instruction;
            // 匹配描述信息中地铁线路信息
            let match = instruction.match(/地铁\d+号线/);
            if (match) segmentLineFeature.set('line', match[0]);
            segmentLineFeature.set('transit_mode', segment.transit_mode);

            return segmentLineFeature;
          });

          // 计算箭头数量
          calculateArrowPoints(lineFeatureList);

          pathPlaningSource.clear();
          pathPlaningSource.addFeatures(lineFeatureList);
          pathPlaningPopupSource.clear();
          pathPlaningPopupSource.addFeatures(popupFeaturesArray);

          if (!mapStore.isLayerExist(map, pathPlaningDownLayer)) {
          }

          map.getView().fit(pathPlaningArrowSource.getExtent(), {
            padding: [100, 100, 100, 100],
            duration: 1000,
          });
        },
      );
    });

    // 更新比例尺时更新箭头数量和指向
    mapStore.removeListenerExcept({ listenerId: 'pathPlaningListener' });
    const pathPlaningListener = map.getView().on('change:resolution', () => {
      // 计算箭头数量
      calculateArrowPoints(lineFeatureList);
    });
    const listenerParam = {
      listener: pathPlaningListener,
      listenerId: 'pathPlaningListener',
      listenerGroup: 'pathPlaning',
    };
    mapStore.addListener(listenerParam);
  }

  let arrowPoints: Feature<Point>[];

  function calculateArrowPoints(lineFeatureList) {
    arrowPoints = [];
    lineFeatureList.forEach((lineFeature) => {
      let arrowNumber = Math.ceil(
        lineFeature.getGeometry().getLength() / map.getView().getResolution()! / 100,
      );
      for (let i = 0; i <= arrowNumber; i++) {
        let fracPosition = i / arrowNumber;
        if (fracPosition > 1) fracPosition -= 1;
        let arrowPoint = new Feature(
          new Point(lineFeature.getGeometry().getCoordinateAt(fracPosition)),
        );
        arrowPoints.push(arrowPoint);
      }
    });
    pathPlaningArrowSource.clear();
    pathPlaningArrowSource.addFeatures(arrowPoints);
  }

  function clearPathPlaning() {
    console.log('map.getAllLayers()Before;', pathPlaningGroupLayer);
    pathPlaningGroupLayer
      .getLayers()
      .getArray()
      .forEach((layer) => {
        layer.getSource().clear();
      });
    map.removeLayer(pathPlaningGroupLayer);
    mapStore.removeListener({ listenerGroup: 'pathPlaning' });
  }

  let map: Map;

  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
    pathPlaningGroupLayer = new Group({
      layers: [
        pathPlaningDownLayer,
        pathPlaningUpperLayer,
        pathPlaningArrowLayer,
        pathPlaningPopupLayer,
      ],
    });
    map.addLayer(pathPlaningGroupLayer);
  });

  onBeforeUnmount(() => {
    clearPathPlaning();
  });
</script>

<style scoped>
  .path-planing-container {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    background-color: #fff;
    padding: 10px;

    .path-planing-form-button {
      width: 100%;
    }
  }
</style>
