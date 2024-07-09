<template>
  <div id="container">
    <div class="right">
      <Button class="subway-right" @click="ActiveButtonHandle(0)">地铁线路查询</Button>
      <AntSelect
        class="subway-right"
        v-if="subwayActiveButton"
        v-model:value="activeLine"
        @change="SubwaySelect"
      >
        <SelectOption v-for="option in subwaylines" :key="option.layer" :value="option.label">{{
          option.label
        }}</SelectOption>
      </AntSelect>
    </div>
    <div class="left">
      <Button class="search-button" @click="ActiveButtonHandle(1)">多边形查询</Button>
      <Button class="search-button" @click="ActiveButtonHandle(2)">可达性查询</Button>
      <div style="height: 200px; z-index: 999; margin-left: 30px">
        <Slider v-if="activeButton === 2" v-model:value="arriveTime" :min="10" :max="45" vertical />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import 'ol/ol.css';
  import { Map } from 'ol';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  import { Fill, Style, Stroke, Circle, Text } from 'ol/style';
  // import { Cluster } from 'ol/source';
  import GeoJSON from 'ol/format/GeoJSON';
  import { Draw, Snap } from 'ol/interaction';
  import { Button, Select as AntSelect, SelectOption, Slider } from 'ant-design-vue';
  import { useMapStore } from '../../store/modules/map';
  import BaseLayer from 'ol/layer/Base';
  import gaodePromise from '../../utils/gaode';
  import { Point, Polygon } from 'ol/geom';
  import Feature from 'ol/Feature.js';
  import { getPlotsInPolygon, getPlotsInPolygonList, getPlotsInCircle } from '../../api/point';

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

  /**
   * 按钮选择处理器
   */
  const activeButton = ref(-1);
  function ActiveButtonHandle(index) {
    switch (index) {
      case 0:
        SubwaySearchHandle(index);
        activeButton.value = index;
        break;
      case 1:
        PolygonSearchHandle(index);
        activeButton.value = index;
        break;
      case 2:
        ArrivalRangeHandle(index);
        activeButton.value = index;
    }
  }

  //
  /**
   * 点聚合图层绘制
   */
  // let clusterLayerAdded = false;
  // const featuresArr = [];
  // const clusterVectorSource = new VectorSource({
  //   features: featuresArr,
  // });
  // const cluster = new Cluster({
  //   source: clusterVectorSource,
  //   distance: 100,
  // });
  // const clusterLayer = new VectorLayer({
  //   source: cluster,
  //   style: function (feature) {
  //     let size = feature.get('features').length;
  //     if (size < 10) {
  //       return new Style({
  //         image: new Circle({
  //           radius: 8,
  //           fill: new Fill({
  //             color: '#ff0813',
  //           }),
  //         }),
  //       });
  //     }
  //     let style = new Style({
  //       fill: new Fill({
  //         color: 'rgba(255, 255, 255, 0.2)',
  //       }),
  //       stroke: new Stroke({
  //         color: '#ffcc33',
  //         width: 2,
  //       }),
  //       image: new Circle({
  //         radius: 16,
  //         fill: new Fill({
  //           color: '#ffcc33',
  //         }),
  //       }),
  //     });
  //     return style;
  //   },
  // });
  // function ClusterPoint(map: Map, coordinates: number[]) {
  //   for (let i = 0; i < coordinates.length; i++) {
  //     let feature = new Feature({
  //       geometry: new Point([coordinates[i].wgs84_lng, coordinates[i].wgs84_lat]),
  //     });
  //     featuresArr.push(feature as never);
  //   }
  //   clusterVectorSource.clear();
  //   clusterVectorSource.addFeatures(featuresArr);
  //   if (!clusterLayerAdded) map.addLayer(clusterLayer);
  // }

  const activeLine = ref('请选择地铁线路');
  const subwayActiveButton = ref(0);
  // 激活地铁选择下拉栏
  function SubwaySearchHandle(index) {
    subwayActiveButton.value = subwayActiveButton.value === 0 ? 1 : 0;
    if (activeButton.value == index) {
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
  // 获取图层要素信息
  let subwayLayerAdd = false;
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
    let center;
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
        // let features = subwayVectorLayer.getSource().getFeatures(event.pixel);
        // // console.log(features);
        // if (features.length !== 0) {
        //   let property = features[0].getProperties();
        //   console.log('property');
        //   console.log(property);

        //   let point = features[0].getGeometry();
        //   let coordinates = point.getCoordinates();
        //   console.log('property.line');
        //   console.log(property.line);
        //   if (coordinates !== null) {
        //     center = coordinates;
        //     // console.log('coordinates');
        //     // console.log(coordinates);
        //   }
        //   return true;
        // }
        // return false;

        let features = map.getFeaturesAtPixel(event.pixel);
        console.log(features);
        if (features.length !== 0) {
          let point = features[0].getGeometry();
          let coordinates = point.getCoordinates();
          if (coordinates !== null) {
            center = coordinates;
            // console.log('coordinates');
            // console.log(coordinates);
          }
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

    // 本项目规范，一定需要定义但未使用的变量采用_前缀
    circleDraw.on('drawend', async (_event) => {
      const parm = {
        longitude: center[0],
        latitude: center[1],
        radius: 0.02,
      };
      // const parm = {
      //   longitude: '121.452921',
      //   latitude: '31.220755',
      //   radius: 0.02,
      // };
      const result = await getPlotsInCircle(parm);
      AddOverlay(map, result.data.plots);
    });
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
    if (!subwayLayerAdd) map.addLayer(subwayVectorLayer);
  }

  // 多边形搜索处理
  // const polygonActiveButton = ref(0);
  const houseList = [];
  let polygonDraw = null;
  function PolygonSearchHandle(index) {
    const drawerHandle = mapStore.GetDrawer;

    if (activeButton.value == index) {
      drawerHandle.RemoveDraw();
      polygonDraw = null;
      return;
    }
    polygonDraw = drawerHandle.GetDraw('Polygon');
    PolygonSearch(polygonDraw);
  }
  function PolygonSearch(draw) {
    const map = mapStore.GetMap;
    const polygon = [];
    draw.on('drawend', async (event) => {
      const polygons = event.feature.getGeometry();
      let coordinates = polygons.getCoordinates();
      coordinates[0].forEach((item) => {
        let point = {
          longitude: item[0],
          latitude: item[1],
        };
        polygon.push(point as never);
      });
      const param = {
        polygon: polygon,
      };
      const response = await getPlotsInPolygon(param);
      AddOverlay(map as Map, response.data.plots);
      houseList.length = 0;
      houseList.push(response.data.houseList as never);
    });
  }

  // 公交可达圈分析处理
  let pointDraw = null;
  let isDrawLayerAdd = false;
  const arriveTime = ref(20);
  const arriveOption = ref('SUBWAY,BUS');
  const drawVectorSource = new VectorSource();
  const drawVectorLayer = new VectorLayer({
    source: drawVectorSource,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 205, 255, 0.9)',
      }),
      stroke: new Stroke({
        color: '#ff1233',
        width: 2,
      }),
    }),
  });
  function ArrivalRangeHandle(index) {
    const drawerHandle = mapStore.GetDrawer;
    if (activeButton.value == index) {
      drawerHandle.RemoveDraw();
      drawVectorLayer.getSource().clear();
      polygonDraw = null;
      return;
    }
    pointDraw = drawerHandle.GetDraw('Point');
    ArrivalRangeSearch(pointDraw);
  }
  function ArrivalRangeSearch(pointDraw) {
    const map = mapStore.GetMap;
    pointDraw.on('drawend', (event) => {
      const point = event.feature.getGeometry();
      const coordinates = point.getCoordinates();

      const polygonList = [];
      const polygonListParam = {
        polygonList: polygonList,
      };

      gaodePromise.then((arrivalRange) => {
        arrivalRange.search(
          [coordinates[0], coordinates[1]],
          arriveTime.value,
          async (_status, result) => {
            VectorLayerDraw(result.bounds);
            polygonList.length = 0;

            result.bounds.forEach((element) => {
              const polygon = [];
              let polygonParam = {
                polygon: polygon,
              };
              element[0].forEach((item) => {
                let point = {
                  longitude: item[0],
                  latitude: item[1],
                };
                polygon.push(point);
              });
              polygonList.push(polygonParam);
            });
            // console.log('paramPolygonList');
            // console.log(polygonListParam);
            const response = await getPlotsInPolygonList(polygonListParam);
            console.log(response);
            AddOverlay(map as Map, response.data.plots);
          },
          {
            policy: arriveOption.value,
          },
        );
      });
    });
  }
  // 矢量图层绘制
  function VectorLayerDraw(polygon) {
    const map = mapStore.GetMap;
    drawVectorLayer.getSource().clear();
    let featureArray = [];
    polygon.forEach((element) => {
      let feature = new Feature({
        geometry: new Polygon(element),
      });
      featureArray.push(feature as never);
    });
    drawVectorSource.addFeatures(featureArray);
    if (isDrawLayerAdd === false) {
      map.addLayer(drawVectorLayer);
      isDrawLayerAdd = true;
    }
  }

  // function ArrivalRangeSearch() {
  //   const drawerHandle = mapStore.GetDrawer;
  //   const pointDraw = drawerHandle.GetDraw('Point');
  //   pointDraw.on('drawend', (event) => {
  //     const point = event.feature.getGeometry();
  //     const coordinates = point.getCoordinates();

  //     gaodePromise.then((arrivalRange) => {
  //       arrivalRange.search(
  //         [coordinates[0], coordinates[1]],
  //         arriveTime.value,
  //         (status, result) => {
  //           console.log(result);
  //           VectorLayerDraw(result.bounds);
  //         },
  //         {
  //           policy: arriveOption.value,
  //         },
  //       );
  //     });
  //   });
  // }

  let overLaySourceAdd = false;
  const overlayFeatureArray = [];
  const overLaySource = new VectorSource();
  const overLayLayer = new VectorLayer({
    source: overLaySource,
    style: (feature) => {
      // console.log(feature.getProperties());
      const property = feature.getProperties();
      const count = property.count;
      const plot = property.plot;

      return new Style({
        text: new Text({
          font: '14px Arial',
          text: plot + '|' + count + '套',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        image: new Circle({
          radius: 16,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      });
    },
  });
  function AddOverlay(map: Map, data) {
    overLayLayer.getSource().clear();
    data.forEach((element) => {
      let feature = new Feature({
        geometry: new Point([element.wgs84_lng, element.wgs84_lat]),
      });
      feature.setProperties({
        count: element.count,
        plot: element.plot,
      });
      overlayFeatureArray.push(feature as never);
    });
    overLaySource.addFeatures(overlayFeatureArray);
    console.log(overLayLayer);

    if (overLaySourceAdd === false) {
      map.addLayer(overLayLayer);
      overLaySourceAdd = true;
    }
  }

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
      display: flex;
      width: 120px;
      height: 100px;
      .search-button {
        width: 100%;
        height: 40%;
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
