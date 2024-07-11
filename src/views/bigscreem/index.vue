<template>
  <div id="container">
    <div class="right">
      <div class="right-item">
        <Button class="search-button" @click="ActiveButtonHandle(0)">地铁线路查询</Button>
        <AntSelect v-if="activeButton === 0" v-model:value="activeLine" @change="SubwaySelect">
          <SelectOption v-for="option in subwaylines" :key="option.label" :value="option.label">{{
            option.label
          }}</SelectOption>
        </AntSelect>
      </div>
      <div class="right-item">
        <Button class="search-button" @click="ActiveButtonHandle(1)">多边形查询</Button>
      </div>
      <div class="right-item">
        <Button class="search-button" @click="ActiveButtonHandle(2)">可达性查询</Button>
        <div v-if="activeButton == 2" class="slider-container">
          <Slider v-model:value="arriveTime" :min="10" :max="45" vertical />
        </div>
      </div>
    </div>
    <div class="left" v-if="listShow">
      <div class="left-list">可视区域内找到套房子</div>
      <List
        class="left-list"
        :data-source="houseList"
        item-layout="vertical"
        :pagination="pagination"
      >
        <template #renderItem="{ item }">
          <ListItem>
            <ListItemMeta>
              <template #title>
                {{ item.title }}
              </template>
              <template #description>
                <div>{{ item.house_type }}</div>
                <div>{{ item.price }}元/月</div>
              </template>
            </ListItemMeta>

            <template #extra>
              <img width="60" alt="logo" src="public/resource/img/logo.png" />
            </template>
          </ListItem>
        </template>
      </List>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';
  import 'ol/ol.css';
  import { Map } from 'ol';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  import { Fill, Style, Stroke, Circle, Text } from 'ol/style';
  // import { Cluster } from 'ol/source';
  import GeoJSON from 'ol/format/GeoJSON';
  import { Draw, Snap } from 'ol/interaction';
  import {
    Button,
    Select as AntSelect,
    SelectOption,
    Slider,
    List,
    ListItem,
    ListItemMeta,
  } from 'ant-design-vue';
  import { useMapStore } from '../../store/modules/map';
  import gaodePromise from '../../utils/gaode';
  import { Point, Polygon } from 'ol/geom';
  import Feature from 'ol/Feature.js';
  import {
    getPlotsInPolygon,
    getPlotsInPolygonList,
    getPlotsInCircle,
    getHouseInPlots,
    PointData,
    CircleData,
    PolygonData,
    PolygonListData,
    PlotData,
  } from '../../api/point';
  import { unByKey } from 'ol/Observable';

  const subwaylines = {
    lineOne: {
      label: '一号线',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line1&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineTwo: {
      label: '二号线',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line2&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineThree: {
      label: '三号线',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line3&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFour: {
      label: '四号线',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line4&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFive: {
      label: '五号线',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line5&maxFeatures=50&outputFormat=application%2Fjson',
    },
  };
  const mapStore = useMapStore();

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

  /**
   * 按钮选择处理器
   */
  const activeButton = ref(-1);
  function ActiveButtonHandle(index) {
    switch (index) {
      case 0:
        SubwaySearchHandle(index);
        break;
      case 1:
        PolygonSearchHandle(index);
        break;
      case 2:
        ArrivalRangeHandle(index);
        break;
    }
  }

  let isFirstCall = false;
  const activeLine = ref('请选择地铁线路');
  // 激活地铁选择下拉栏
  function SubwaySearchHandle(index) {
    if (activeButton.value == index) {
      SubwaySearchClear();
      activeButton.value = -1;
    } else {
      activeButton.value = 0;
    }
  }
  // 选择地铁线路
  function SubwaySelect() {
    const map = mapStore.GetMap;
    // subwayVectorSource等于undefined判断为true，赋值给isFirstCall标记为第一次进行选择
    // if (subwayVectorSource != undefined) {
    //   subwayVectorLayer.getSource().clear();
    // }
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
    if (!isFirstCall) {
      GetFeature(map as Map);
      isFirstCall = true;
    }
  }
  // 获取图层要素信息
  let subwayLayerAdd = false;
  let circleDraw;
  let snap;
  function GetFeature(map: Map) {
    if (polygonSearchListener) {
      unByKey(polygonSearchListener);
      polygonSearchListener = null;
    }
    if (arrivalSearchListener) {
      unByKey(arrivalSearchListener);
      arrivalSearchListener = null;
    }
    if (subwaySearchListener) {
      unByKey(subwaySearchListener);
      subwaySearchListener = null;
    }

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
          console.log('propetry');
          let plot = features[0].getProperties().plot;
          console.log(plot);
          if (plot) return false;
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
    snap = new Snap({
      source: subwayVectorSource,
      pixelTolerance: 20,
    });
    map.addInteraction(circleDraw);
    map.addInteraction(snap);

    let center;
    // 本项目规范，一定需要定义但未使用的变量采用_前缀
    subwaySearchListener = circleDraw.on('drawend', async (_event) => {
      const parm: CircleData = {
        longitude: center[0],
        latitude: center[1],
        radius: 0.01,
      };
      const response = await getPlotsInCircle(parm);
      AddOverlay(map, response.data.plots);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
      GetHouseByClickPlot(map as Map);
    });
  }
  // 地铁查询清除
  function SubwaySearchClear() {
    const map = mapStore.GetMap;
    // if (snap) {
    //   let result = map.removeInteraction(snap);
    //   // snap = null;
    //   console.log('removesnap');
    //   console.log(result);
    // }
    // if (circleDraw) {
    //   let result = map.removeInteraction(circleDraw);
    //   // circleDraw = null;
    //   console.log('removecircleDraw');
    //   console.log(result);
    // }

    // 清理图层数据
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Snap) {
        map.removeInteraction(interaction);
      }
      if (interaction instanceof Draw) {
        let result = map.removeInteraction(interaction);
        console.log('Draw');
        console.log(result);
      }
    });
    activeLine.value = '请选择地铁线路';
    subwayVectorLayer.getSource().clear();
    map.removeInteraction(circleDraw);
    isFirstCall = false;
  }
  // 加载WFS服务图层
  let subwayVectorSource: VectorSource | undefined;
  let subwayVectorLayer = new VectorLayer({
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
  function AddWFS(map: Map, layer) {
    if (subwayVectorSource != undefined) {
      subwayVectorLayer.getSource().clear();
    }
    subwayVectorSource = new VectorSource({
      format: new GeoJSON(),
      url: layer,
    });
    subwayVectorLayer.setSource(subwayVectorSource);

    if (!subwayLayerAdd) {
      map.addLayer(subwayVectorLayer);
      subwayLayerAdd = true;
    }
  }

  let subwaySearchListener;
  let polygonSearchListener;
  let arrivalSearchListener;
  let clickPlotListener;
  const pagination = {
    pageSize: 4,
  };
  // 多边形搜索处理
  const listShow = ref(false);
  const houseList = ref([] as any[]);
  let polygonDraw;
  function PolygonSearchHandle(index) {
    if (activeButton.value == index) {
      PolygonSearchClear();
      listShow.value = false;
      activeButton.value = -1;
    } else {
      PolygonSearch();
      activeButton.value = 1;
    }
  }
  function PolygonSearch() {
    const map = mapStore.GetMap;
    // 清除所有监听器
    if (polygonSearchListener) {
      unByKey(polygonSearchListener);
      polygonSearchListener = null;
    }
    if (arrivalSearchListener) {
      unByKey(arrivalSearchListener);
      arrivalSearchListener = null;
    }
    polygonDraw = new Draw({
      source: new VectorSource(),
      type: 'Polygon',
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
        if (features.length == 0) {
          return true;
        } else {
          let plot = features[0].getProperties().plot;
          if (plot) return false;
          return true;
        }
      },
    });
    map.addInteraction(polygonDraw);

    // draw.on这些on监听方法好像很奇怪，会导致作用域的问题，
    // 比如const polygon = [];写在draw.on就无法正常清除内部数据
    // gpt解释，每次调用 PolygonSearch 函数时，polygon 数组被清空一次。
    // 但是，如果不在 drawend 事件处理程序内部再进行清空操作，那么数组 polygon 可能会在多次绘制操作之间积累点。
    polygonSearchListener = polygonDraw.on('drawend', async (event) => {
      const polygons = event.feature.getGeometry();
      let coordinates = polygons.getCoordinates();
      const polygon = [];
      coordinates[0].forEach((item) => {
        let point = {
          longitude: item[0],
          latitude: item[1],
        };
        polygon.push(point as never);
      });
      const param: PolygonData = {
        polygon: polygon,
      };

      const response = await getPlotsInPolygon(param);
      AddOverlay(map as Map, response.data.plots);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
      // 获取小区信息详细房屋信息
      clickPlotListener = GetHouseByClickPlot(map as Map);
    });
  }
  function PolygonSearchClear() {
    const map = mapStore.GetMap;
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Draw) {
        let result = map.removeInteraction(interaction);
        console.log('Draw');
        console.log(result);
      }
    });

    // let result = map.removeInteraction(polygonDraw);
    // console.log('Draw');
    // console.log(result);
  }
  // 点击小区overlay获取详细租房信息
  function GetHouseByClickPlot(map: Map) {
    if (clickPlotListener) {
      unByKey(clickPlotListener);
      clickPlotListener = null;
    }

    return map.on('click', async (event) => {
      let features = map.getFeaturesAtPixel(event.pixel);
      if (features.length !== 0) {
        let property = features[0].getProperties();
        if (property.plot !== undefined) {
          const param: PlotData = {
            plot: property.plot,
          };
          const response = await getHouseInPlots(param);
          houseList.value = [...response.data];
        }
        console.log(property);
      }
    });
  }

  // 公交可达圈分析处理
  let isDrawLayerAdd = false;
  const arriveTime = ref(20);
  const arriveOption = ref('SUBWAY,BUS');
  const drawVectorSource = new VectorSource();
  const drawVectorLayer = new VectorLayer({
    source: drawVectorSource,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 205, 255, 0.4)',
      }),
      stroke: new Stroke({
        color: '#ff1233',
        width: 2,
      }),
    }),
  });
  function ArrivalRangeHandle(index) {
    if (activeButton.value == index) {
      drawVectorLayer.getSource().clear();
      activeButton.value == -1;
    } else {
      ArrivalRangeSearch();
      activeButton.value = 2;
    }
  }
  function ArrivalRangeSearch() {
    if (polygonSearchListener) {
      unByKey(polygonSearchListener);
      polygonSearchListener = null;
    }
    if (arrivalSearchListener) {
      unByKey(arrivalSearchListener);
      arrivalSearchListener = null;
    }
    const map = mapStore.GetMap;
    arrivalSearchListener = map.on('click', (event) => {
      // 思路：判断当前点击位置与获取到的feature位置对比，小于阈值判断该位置有渲染点，取消调用高德api
      let pixelCoordinate = map.getCoordinateFromPixel(event.pixel);
      let feature = map.getFeaturesAtPixel(event.pixel);
      // console.log('feature');
      // console.log(feature);
      if (feature.length === 0) {
        // 调用高德接口
        gaodePromise.then((arrivalRange) => {
          const polygonList = [] as PolygonData[];
          const polygonListParam: PolygonListData = { polygonList: polygonList };

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
              const response = await getPlotsInPolygonList(polygonListParam);
              AddOverlay(map as Map, response.data.plots);
              houseList.value = [...response.data.houseList];
              listShow.value = true;
              GetHouseByClickPlot(map as Map);
            },
            {
              policy: arriveOption.value,
            },
          );
        });
      }
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

  // popup图标绘制
  let overLaySourceAdd = false;
  let overlayFeatureArray = [];
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
        // image: new Icon({
        //   src: 'path/to/icon.png',
        //   anchor: [0.5, 46],
        //   anchorXUnits: 'fraction',
        //   anchorYUnits: 'pixels',
        //   scale: 0.5,
        // }),
      });
    },
  });
  function AddOverlay(map: Map, data) {
    overlayFeatureArray = [];
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

    if (overLayLayer.getSource() !== null) {
      overLayLayer.getSource().clear();
    }
    overLaySource.addFeatures(overlayFeatureArray);
    overLayLayer.setSource(overLaySource);

    if (overLaySourceAdd === false) {
      map.addLayer(overLayLayer);
      overLaySourceAdd = true;
    }
  }

  // 监听按钮在激活状态下的切换
  watch(activeButton, (newValue, oldValue) => {
    // 切换前激活地铁查询，切换后激活其他查询，且按钮不为停止状态
    if (oldValue === 0 && newValue !== 0 && newValue !== -1) {
      SubwaySearchClear();
      const map = mapStore.GetMap;
      console.log('12323');
      console.log(map.getInteractions());
    }
    if (oldValue === 1 && newValue !== 1 && newValue !== -1) {
      PolygonSearchClear();
    }
    if (oldValue === 2 && newValue !== 2 && newValue !== -1) {
      drawVectorLayer.getSource().clear();
    }
  });

  onMounted(() => {
    mapStore.InitOpenlayers('container');
  });
</script>

<style lang="less" scoped>
  #container {
    width: 100%;
    height: 100%;

    .right {
      position: absolute;
      top: 60px;
      right: 20px;
      width: 360px;
      display: flex;
      justify-content: space-between;
      z-index: 999;

      .right-item {
        position: relative;
        width: 30%;
        height: 150px;
      }
    }
    .slider-container {
      position: absolute;
      top: 30%;
      width: 100%;
      height: 100%;
      z-index: 999;
    }
    .left {
      position: absolute;
      width: 350px;
      height: 650px;
      top: 30px;
      left: 20px;
      z-index: 999;
      // display: flex;
      // justify-content: center;
      // background-color: #de9c9c;
      .left-list {
        background-color: #fff;
        width: 90%;
      }
    }
  }
</style>
