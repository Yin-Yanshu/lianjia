<template>
  <div id="container">
    <div class="left">
      <Button class="search-button" @click="PolygonSearchHandle">多边形查询</Button>
    </div>
    <div class="right">
      <Button class="subway-right" @click="SubwaySearchHandle">地铁线路查询</Button>
      <AntSelect
        class="subway-right"
        v-if="subwayActiveButton"
        v-model:value="activeLine"
        @change="SubwaySelect"
      >
        <SelectOption v-for="option in subwaylines" :key="option.layer" :value="option.label"
          >{{ option.label }}
        </SelectOption>
      </AntSelect>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import 'ol/ol.css';
  import { Map } from 'ol';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  // import { Point } from 'ol/geom';
  import { Fill, Style, Stroke, Circle } from 'ol/style';
  // import { Cluster } from 'ol/source';
  import GeoJSON from 'ol/format/GeoJSON';
  import { Draw, Snap } from 'ol/interaction';
  // import AMapLoader from '@amap/amap-jsapi-loader';
  import { Button, Select as AntSelect, SelectOption } from 'ant-design-vue';
  import { useMapStore } from '../../store/modules/map';
  import BaseLayer from 'ol/layer/Base';

  const subwaylines = {
    lineOne: {
      label: '一号线',
      layer: 'line_one',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aline_one&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineTwo: {
      label: '二号线',
      layer: 'line_two',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aline_two&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineThree: {
      label: '三号线',
      layer: 'line_three',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aline_three&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFour: {
      label: '四号线',
      layer: 'line_four',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aline_four&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFive: {
      label: '五号线',
      layer: 'line_five',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aline_five&maxFeatures=50&outputFormat=application%2Fjson',
    },
  };
  const mapStore = useMapStore();

  // 鼠标绘制多边形
  // function DrawPolygon(map: Map) {
  //   const drawlayer = new VectorLayer({
  //     source: new VectorSource(),
  //     style: new Style({
  //       fill: new Fill({
  //         color: 'rgba(255, 255, 255, 0.5)',
  //       }),
  //       stroke: new Stroke({
  //         color: '#ff1233',
  //         width: 2,
  //       }),
  //     }),
  //   });
  //   const draw = new Draw({
  //     source: drawlayer.getSource(),
  //     type: 'Polygon',
  //     style: new Style({
  //       fill: new Fill({
  //         color: 'rgba(255, 255, 255, 0.5)',
  //       }),
  //       stroke: new Stroke({
  //         color: '#ff1233',
  //         width: 2,
  //       }),
  //     }),
  //   });
  //   console.log(draw);
  //   map.addInteraction(draw);
  //   map.addLayer(drawlayer);
  //   // 打印多边形点位坐标

  //   draw.on('drawend', (event) => {
  //     const geometry = event.feature.getGeometry();
  //     let corrdinates = geometry.getCoordinates();
  //     console.log(corrdinates);
  //   });
  // }
  // 打印鼠标经纬度
  // function PrintPosition(map: Map) {
  //   map.on('click', (event) => {
  //     const coordinate = event.coordinate;
  //     console.log('object', coordinate);
  //   });
  // }
  // 点聚合图层绘制
  // function ClusterPoint(map: Map, coordinates: number[][]) {
  //   const featuresArr = [];
  //   for (let i = 0; i < coordinates.length; i++) {
  //     let feature = new Feature({
  //       geometry: new Point([coordinates[i][0], coordinates[i][1]]),
  //     });
  //     featuresArr.push(feature as never);
  //   }

  //   const cluster = new Cluster({
  //     source: new VectorSource({
  //       features: featuresArr,
  //     }),
  //     distance: 100,
  //   });

  //   const pointLayer = new VectorLayer({
  //     source: cluster,
  //     style: function (feature) {
  //       let size = feature.get('features').length;
  //       if (size < 3) {
  //         return new Style({
  //           image: new Circle({
  //             radius: 8,
  //             fill: new Fill({
  //               color: '#ff0813',
  //             }),
  //           }),
  //         });
  //       }
  //       let style = new Style({
  //         fill: new Fill({
  //           color: 'rgba(255, 255, 255, 0.2)',
  //         }),
  //         stroke: new Stroke({
  //           color: '#ffcc33',
  //           width: 2,
  //         }),
  //         image: new Circle({
  //           radius: 16,
  //           fill: new Fill({
  //             color: '#ffcc33',
  //           }),
  //         }),
  //         text: new Text({
  //           text: size.toString(),
  //           fill: new Fill({
  //             color: 'white',
  //           }),
  //         }),
  //       });
  //       return style;
  //     },
  //   });
  //   map.addLayer(pointLayer);
  // }

  /**
   * @param map
   * 加载WMS服务图层
   */
  // function AddWMS(map: Map, layer) {
  //   const wms = new TileLayer({
  //     source: new TileWMS({
  //       url: 'http://localhost:8080/geoserver/lianjia/wms',
  //       params: {
  //         TILED: true,
  //         // 工作空间:图层名
  //         LAYERS: 'lianjia:' + layer,
  //       },
  //       serverType: 'geoserver',
  //     }),
  //   });
  //   map.addLayer(wms);
  // }

  /**
   * @param map
   * Select控件获取要素信息
   */
  // function GetFeature(map: Map) {
  //   const select = new Select();
  //   map.addInteraction(select);
  //   select.on('select', function (event) {
  //     var features = event.target.getFeatures().getArray();
  //     var coordinates = features[0].getGeometry().getCoordinates();
  //     console.log(coordinates);
  //     var property = features[0].getProperties();
  //     console.log(property);
  //   });
  // }

  // 加载高德公交可达性接口
  /**
   * 调用高德api
   */
  // function InitGaode() {
  //   window._AMapSecurityConfig = {
  //     securityJsCode: 'aabb2721fd1b9add4e41443ce65e9e6a',
  //   };
  //   AMapLoader.load({
  //     key: '2eabe002d0eabc32258472ea7320e36e',
  //     version: '1.4.15',
  //     plugins: ['AMap.ArrivalRange'],
  //   }).then((AMap) => {
  //     const arrivalRange = new AMap.ArrivalRange();
  //     // 起点 时间 回调函数
  //     arrivalRange.search([118.12, 24.123], 20, (status, result) => {
  //       console.log(result);
  //     });
  //   });
  // }
  // 获取租房信息

  /**
   * @param map
   * 获取图层要素信息
   */
  let circleDraw: Draw;
  let snap: Snap;
  function GetFeature(map: Map) {
    // map.on('pointermove', (event) => {
    //   let features = map.getFeaturesAtPixel(event.pixel);
    //   if (features !== null) {
    // move | default |pointer
    //     map.getTargetElement().style.cursor = 'default';
    //   }
    // });
    circleDraw = new Draw({
      source: new VectorSource(),
      type: 'Circle',
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.3)',
        }),
        stroke: new Stroke({
          color: '#ff1233',
          width: 2,
        }),
      }),
      // condition接受boolen，函数返回true绘制当前点
      condition: (event) => {
        let features = map.getFeaturesAtPixel(event.pixel);
        if (features.length !== 0) {
          var point = features[0].getGeometry();
          let coordinates = point.getCoordinates();
          console.log(coordinates);
          return true;
        }
        return false;
      },
    });
    map.addInteraction(circleDraw);
    snap = new Snap({
      source: subwayVectorSource,
      pixelTolerance: 20,
    });
    map.addInteraction(snap);

    console.log(map.getInteractions());
  }
  // 加载WFS服务图层
  var subwayVectorSource: VectorSource | undefined;
  var subwayVectorLayer: BaseLayer;
  function AddWFS(map: Map, layer) {
    subwayVectorSource = new VectorSource({
      format: new GeoJSON(),
      url: layer,
    });
    subwayVectorLayer = new VectorLayer({
      source: subwayVectorSource,
      style: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });
    map.addLayer(subwayVectorLayer);
  }

  const activeLine = ref('请选择地铁线路');
  const subwayActiveButton = ref(0);

  // 激活地铁选择下拉栏
  function SubwaySearchHandle() {
    subwayActiveButton.value = subwayActiveButton.value === 0 ? 1 : 0;
    if (subwayActiveButton.value === 0) {
      SubwaySearchClear();
    }
  }
  // 选择地铁线路
  function SubwaySelect() {
    const map = mapStore.GetMap;
    // subwayVectorSource等于undefined判断为true，赋值给isFirstCall标记为第一次进行选择
    let isFirstCall = subwayVectorSource === undefined;
    if (subwayVectorSource != undefined) {
      subwayVectorLayer.getSource().clear();
    }
    switch (activeLine.value) {
      case '一号线':
        AddWFS(map as Map, subwaylines.lineOne.url);
        break;
      case '二号线':
        AddWFS(map as Map, subwaylines.lineTwo.url);
        break;
      case '三号线':
        AddWFS(map as Map, subwaylines.lineThree.url);
        break;
      case '四号线':
        AddWFS(map as Map, subwaylines.lineFour.url);
        break;
      case '五号线':
        AddWFS(map as Map, subwaylines.lineFive.url);
        break;
    }
    if (isFirstCall) {
      GetFeature(map as Map);
    }
  }
  // 地铁查询清除
  function SubwaySearchClear() {
    const map = mapStore.GetMap;
    activeLine.value = '请选择地铁线路';
    // 清理图层数据
    subwayVectorLayer.getSource().clear();
    subwayVectorSource = undefined;
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Snap) {
        map.removeInteraction(interaction);
      }
      if (interaction instanceof Draw) {
        map.removeInteraction(interaction);
      }
    });
  }

  // 多边形搜索处理
  const polygonActiveButton = ref(0);
  let polygonDraw = null;
  function PolygonSearchHandle() {
    const drawerHandle = mapStore.GetDrawer;
    polygonActiveButton.value = polygonActiveButton.value === 0 ? 1 : 0;
    if (polygonActiveButton.value === 1) {
      polygonDraw = drawerHandle.GetDraw('Polygon');
      PolygonSearch(polygonDraw);
    } else if (polygonActiveButton.value === 0 && polygonDraw) {
      drawerHandle.RemoveDraw();
      polygonDraw = null;
    }
  }
  function PolygonSearch(draw) {
    draw.on('drawend', (event) => {
      const polygon = event.feature.getGeometry();
      let corrdinates = polygon.getCoordinates();
      console.log(corrdinates);
    });
  }

  // function PolygonSearchHandle() {
  //   polygonActiveButton.value = polygonActiveButton.value === 0 ? 1 : 0;
  //   const drawerHandle = mapStore.GetDrawer;
  //   if (polygonActiveButton.value === 1) {
  //     polygonDraw = drawerHandle.GetDraw('Polygon');
  //     polygonDraw.on('drawend', (event) => {
  //       const polygon = event.feature.getGeometry();
  //       let coordinates = polygon.getCoordinates();
  //       console.log(coordinates);
  //     });
  //   } else if (polygonActiveButton.value === 0 && polygonDraw) {
  //     drawerHandle.RemoveDraw();
  //   }
  // }

  onMounted(() => {
    mapStore.InitOpenlayers('container');
  });
</script>

<style lang="less" scoped>
  #container {
    width: 100%;
    height: 100%;
    .left {
      position: absolute;
      top: 80px;
      left: 20px;
      .search-button {
        width: 102px;
        height: 42px;
        z-index: 999;
      }
    }
    .right {
      position: absolute;
      top: 80px;
      right: 20px;
      width: 120px;
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .subway-right {
        width: 100%;
        height: 40%;
        z-index: 999;
      }
    }
  }
</style>
