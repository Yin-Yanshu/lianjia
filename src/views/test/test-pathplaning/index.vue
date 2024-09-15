<template>
  <div id="container"></div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useMapStore } from '../../../store/modules/map';
  import { Feature } from 'ol';
  import { Geometry, LineString, Point } from 'ol/geom';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  import { Style, Stroke, Icon } from 'ol/style';
  import initGaoDe from '../../../utils/gaode';

  let arrowPoints: Feature<Geometry>[];
  let startPoint = ref([121.278768, 31.215104]);
  let endPoint = ref([121.486128, 31.221733]);
  const subwayLineColors = {
    地铁1号线: 'rgb(234,11,42)',
    地铁2号线: 'rgb(148,212,11)',
    地铁3号线: 'rgb(248,208,0)',
    地铁4号线: 'rgb(96,38,158)',
    地铁5号线: 'rgb(147,76,154)',
    地铁6号线: 'rgb(147,76,154)',
    地铁7号线: 'rgb(147,76,154)',
    地铁8号线: 'rgb(147,76,154)',
    地铁9号线: 'rgb(147,76,154)',
    地铁10号线: 'rgb(147,76,154)',
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
      width: 15,
    }),
  });
  const subwayWrapperStyle = new Style({
    stroke: new Stroke({
      color: 'rgb(10,14,12,0.9)',
      width: 24,
    }),
  });
  // NOTE 缓存实例对象方法 缓存subway样式，减少重复new Style
  const plainingStyleCache = {};
  function getPlainingStyle(line) {
    if (plainingStyleCache[line]) {
      return plainingStyleCache[line];
    }
    const style = new Style({
      stroke: new Stroke({
        color: subwayLineColors[line] || subwayLineColors['default'],
        width: 20,
      }),
    });
    plainingStyleCache[line] = style;
    return style;
  }
  function planingUpperStyle(feature) {
    const transit_mode = feature.get('transit_mode');
    switch (transit_mode) {
      case 'WALK':
        return walkStyle;
      case 'SUBWAY':
        const line = feature.get('line');
        return getPlainingStyle(line);
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
  let isPathPlaningSourceAdd = false;
  const pathPlaningSource = new VectorSource();
  const pathPlaningArrowSource = new VectorSource();
  const pathPlaningPopupSource = new VectorSource();
  const pathPlaningUpperLayer = new VectorLayer({
    source: pathPlaningSource,
    style: planingUpperStyle,
  });
  const pathPlaningDownLayer = new VectorLayer({
    source: pathPlaningSource,
    style: planingDownStyle,
  });
  const startIcon = new Style({
    image: new Icon({
      src: 'public/resource/svg/start-point.svg',
      imgSize: [200, 200],
      scale: [0.2, 0.2],
    }),
  });
  const endIcon = new Style({
    image: new Icon({
      src: 'public/resource/svg/end-point.svg',
      imgSize: [200, 200],
      scale: [0.2, 0.2],
    }),
  });
  const busIcon = new Style({
    image: new Icon({
      src: 'public/resource/svg/bus.svg',
      imgSize: [200, 200],
      scale: [0.15, 0.15],
    }),
  });
  const subwayIcon = new Style({
    image: new Icon({
      src: 'public/resource/svg/subway.svg',
      imgSize: [200, 200],
      scale: [0.2, 0.2],
    }),
  });
  const pathPlaningPopupLayer = new VectorLayer({
    source: pathPlaningPopupSource,
    style: (feature) => {
      const popupType = feature.getProperties().popupType;
      if (!popupType) return null;
      if (popupType === 'start') {
        return startIcon;
      }
      if (popupType === 'end') {
        return endIcon;
      }
      if (popupType === 'transit') {
        const transit_mode = feature.getProperties().transit_mode;
        if (!transit_mode) return null;
        if (transit_mode === 'BUS') {
          return busIcon;
        }
        if (transit_mode === 'SUBWAY') {
          return subwayIcon;
        }
      }
      return null;
    },
  });
  const arrow_scale = {
    BUS: [0.07, 0.07],
    SUBWAY: [0.1, 0.1],
    WALK: [0.05, 0.05],
  };
  const pathPlaningArrowLayer = new VectorLayer({
    source: pathPlaningArrowSource,
    style: (feature) => {
      let coordinates = feature.getGeometry().getCoordinates();
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
                src: 'public/resource/svg/path-arrow.svg',
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
  let lineFeatureList;
  const { pathPlaningPromise } = initGaoDe();
  function pathPlaningTest() {
    pathPlaningPromise.then((pathPlaning) => {
      pathPlaning.search(startPoint.value, endPoint.value, (_status, result) => {
        console.log('result', result);
        const popupFeaturesArray = [] as Feature[];
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

        const startFeature = new Feature({
          geometry: new Point(startPoint.value),
        });
        const endFeature = new Feature({
          geometry: new Point(endPoint.value),
        });
        startFeature.set('popupType', 'start');
        endFeature.set('popupType', 'end');
        popupFeaturesArray.push(startFeature, endFeature);

        pathPlaningSource.clear();
        pathPlaningSource.addFeatures(lineFeatureList);
        pathPlaningPopupSource.clear();
        pathPlaningPopupSource.addFeatures(popupFeaturesArray);

        if (!isPathPlaningSourceAdd) {
          map.addLayer(pathPlaningDownLayer);
          map.addLayer(pathPlaningUpperLayer);
          map.addLayer(pathPlaningArrowLayer);
          map.addLayer(pathPlaningPopupLayer);
          isPathPlaningSourceAdd = true;
        }

        map.getView().fit(pathPlaningArrowSource.getExtent(), {
          padding: [100, 100, 100, 100],
          duration: 1000,
        });
      });
    });
    // 更新比例尺时更新箭头数量和指向
    map.getView().on('change:resolution', () => {
      // 计算箭头数量
      calculateArrowPoints(lineFeatureList);
    });
  }
  function calculateArrowPoints(lineFeatureList) {
    arrowPoints = [];
    lineFeatureList.forEach((lineFeature) => {
      let arrowNumber = Math.ceil(
        lineFeature.getGeometry().getLength() / map.getView().getResolution() / 100,
      );
      for (var i = 0; i <= arrowNumber; i++) {
        let fracPosition = i / arrowNumber;
        if (fracPosition > 1) fracPosition -= 1;
        let arrowPoint = new Feature(
          new Point(lineFeature.getGeometry().getCoordinateAt(fracPosition)),
        );
        arrowPoints.push(arrowPoint as never);
      }
    });
    pathPlaningArrowSource.clear();
    pathPlaningArrowSource.addFeatures(arrowPoints);
  }

  let map;
  const mapStore = useMapStore();
  onMounted(() => {
    mapStore.initOpenlayers('container');
    map = mapStore.GetMap;
    pathPlaningTest();
  });
</script>

<style scoped>
  #container {
    height: 100%;
    width: 100%;
  }
</style>
