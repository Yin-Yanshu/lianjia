<template>
  <div class="bigscreem-container">
    <div id="bigscreem-map-container" ref="refMapContainer"></div>
    <SingleActiveWrapper class="left-container" :components-info="componentList2" />
    <SingleActiveWrapper class="middle-container" :components-info="componentList1" />
    <HouseListPanel
      class="right-container"
      :house-list="houseList"
      :map-name="mapName"
      :is-list-show="listShow"
    />
    <LengthScale class="bottom-container" :mapName="mapName" />
  </div>
</template>

<script setup lang="ts">
  import { debounce } from 'lodash-es';
  import { Map } from 'ol';
  import Feature from 'ol/Feature.js';
  import GeoJSON from 'ol/format/GeoJSON';
  import { MultiPolygon, Point } from 'ol/geom';
  import VectorLayer from 'ol/layer/Vector';
  import 'ol/ol.css';
  import VectorSource from 'ol/source/Vector';
  import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
  import { onMounted, ref, watch } from 'vue';
  import {
    CircleData,
    getHouseInPlots,
    getPlotsInCircle,
    OptionData,
    PlotData,
  } from '/@/api/point';
  import { useGlobSetting } from '/@/hooks/setting';
  import LengthScale from '/@/views/bigscreem/components/LengthScale.vue';
  import PathPlaningPanel from '/@/views/bigscreem/components/PathPlaningPanel.vue';
  import HouseListPanel from '/@/views/bigscreem/components/HouseListPanel.vue';
  import PositionSearchPanel from '/src/views/bigscreem/components/PlaceSearchPanel.vue';
  import SingleActiveWrapper from '/@/components/SingleActiveWrapper/index.vue';
  import FilterSearchForm from '/@/views/bigscreem/components/FilterSearchForm.vue';
  import SubwaySearch from '/@/views/bigscreem/components/SubwaySearch.vue';
  import PolygonSearch from '/@/views/bigscreem/components/PolygonSearch.vue';
  import ArrivalRangeSearch from '/@/views/bigscreem/components/ArrivalRangeSearch.vue';
  import { useMapStore } from '/@/store/modules/map';
  import { useMapContainerObserver } from '/@/utils/mapContainerWatch';

  const mapStore = useMapStore();

  const { staticUrl, geoserverUrl } = useGlobSetting();

  // 获取全局唯一map
  let map: Map;
  const mapName = ref();
  mapName.value = 'bigscreem';
  const componentList1 = [
    {
      name: '可达性查询',
      component: ArrivalRangeSearch,
      props: {
        mapName: mapName.value,
      },
      listeners: {
        arrivalRangeSearchResult: (result) => {
          houseList.value = result;
        },
      },
    },
    {
      name: '空间查询',
      component: PolygonSearch,
      props: {
        mapName: mapName.value,
      },
      listeners: {
        polygonSearchResult: (result) => {
          houseList.value = result;
        },
      },
    },
    {
      name: '地铁线路查询',
      component: SubwaySearch,
      props: {
        mapName: mapName.value,
      },
      listeners: {
        subwaySearchResult: (result) => {
          houseList.value = result;
        },
      },
    },
  ];
  const componentList2 = [
    {
      name: '位置搜索',
      component: PositionSearchPanel,
      props: {
        mapName: mapName.value,
      },
      listeners: {
        placeSearchResult: (result) => {
          houseList.value = result;
        },
      },
    },
    {
      name: '路径规划',
      component: PathPlaningPanel,
      props: {
        mapName: mapName.value,
      },
    },

    {
      name: '户型',
      component: FilterSearchForm,
      props: {
        filterOption: 'huxing',
      },
    },
    {
      name: '租金',
      component: FilterSearchForm,
      props: {
        filterOption: 'zujin',
      },
    },
  ];

  /**
   * 按钮选择处理器
   */
  const activeButton = ref(-1);

  // 过滤器选项
  let option: OptionData = {};

  /**
   * 查询参数过滤器
   * @param param 原始查询参数
   * @returns 返回增加属性限制的查询参数
   */
  function searchFilter(param) {
    // 过滤选项option为空，返回param
    if (Object.keys(option).length == 0) return param;
    if (!param.option) {
      param.option = {};
    }
    // 过滤选项option为空，遍option内容赋值给param
    Object.entries(option).forEach(([key, value]) => {
      param.option[key] = value;
    });
    return param;
  }

  const listShow = ref(false);
  const houseList = ref([] as any[]);

  let currentOverlayPoint;

  // 点击小区overlay获取详细租房信息
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
        param = searchFilter(param);
        const response = await getHouseInPlots(param);
        houseList.value = [...response.data];
        listShow.value = true;

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

  // 地图层级查询模块
  let regionLayerAdd = false;
  let regionOverlayLayerAdd = false;
  let pointerMoveListenerAdded = false;
  const regionOverlaySource = new VectorSource();
  const regionOverlayLayer = new VectorLayer({
    source: regionOverlaySource,
    style: (feature) => {
      const property = feature.getProperties();
      const text = property.properties.name + '\n' + property.properties.house_count + '套';
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
          scale: [1, 0.9],
        }),
      });
    },
  });
  const defaultStyle = new Style({
    fill: new Fill({
      color: 'rgb(255,255,255,0)',
    }),
  });
  const hoverStyle = new Style({
    fill: new Fill({
      color: 'rgb(172,223,200,0.3)',
    }),
    stroke: new Stroke({
      color: 'rgb(0,174,102,0.4)',
      width: 2,
    }),
  });
  const regionSource = new VectorSource({
    format: new GeoJSON(),
    url:
      geoserverUrl +
      '/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aregion&maxFeatures=50&outputFormat=application%2Fjson',
  });
  // 如想使用矢量切片方式加载region数据需使用VectorTile图层类和VectorTile数据源类并编写切片方法
  const regionLayer = new VectorLayer({
    source: regionSource,
    style: defaultStyle,
  });
  let selection = {};
  const hoverRegionLayer = new VectorLayer({
    source: regionSource,
    style: (feature) => {
      if (feature['ol_uid'] in selection) {
        return hoverStyle;
      }
    },
  });
  let currentRegionFeature;

  const houseCount = ref(0);

  // INFO 地图层级查询
  function mapLevelSearch() {
    if (mapStore.getListener('mapMoveEndListener')) return;

    const mapMoveEndListener = map.on('moveend', async () => {
      const viewZoom = map.getView().getZoom();
      const center = map.getView().getCenter();
      if (!viewZoom || !center) return;
      // 地图层级自动查询
      if (viewZoom > 15) {
        if (regionLayerAdd) {
          regionLayer.setOpacity(0);
          regionOverlayLayer.setOpacity(0);
        }
        mapStore.removeListener({ listenerId: 'pointMoveListener' });
        mapStore.removeListener({ listenerId: 'doubleClickListener' });
        pointerMoveListenerAdded = false;
        let param: CircleData = {
          longitude: center[0],
          latitude: center[1],
          radius: 0.01,
        };
        const clickPlotListener = getHouseByClickPlot(map);
        const listenerParam = {
          listener: clickPlotListener,
          listenerId: 'clickPlotListener-mapLevelSearch',
          listenerGroup: 'mapLevelSearch',
        };
        mapStore.addListener(listenerParam);
        // 避免频繁发起请求，添加防抖功能
        debounce(async () => {
          param = searchFilter(param);
          const response = await getPlotsInCircle(param);
          houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
          addOverlay(map, response.data.plots);
          // houseList.value = [...response.data.houseList];
          // listShow.value = true;
        }, 1000)(); // 1000ms 防抖延迟
      }
      // 行政区概括查询
      if (viewZoom > 10 && viewZoom < 14) {
        if (!regionLayerAdd) {
          map.addLayer(regionLayer);
          regionLayer.setStyle(defaultStyle);
          regionLayerAdd = true;
        }
        regionLayer.setOpacity(1);
        regionOverlayLayer.setOpacity(1);
        // 鼠标移动事件回调函数
        const pointMoveHandle = async (event) => {
          let newFeature;
          let newFeatureList = await regionLayer.getFeatures(event.pixel);
          newFeature = newFeatureList[0];
          if (currentRegionFeature !== newFeature) {
            if (currentRegionFeature) {
              currentRegionFeature.setStyle(defaultStyle);
            }
            if (newFeature) {
              newFeature.setStyle(hoverStyle);
            }
            currentRegionFeature = newFeature;
          }
        };
        // 鼠标双击事件回调函数，平移至所选多边形中心点
        const doubleClickHandle = (event) => {
          const features = map.getFeaturesAtPixel(event.pixel);
          if (!features || features.length === 0) return;
          const feature = features[0];
          const polygonGeometry = feature.getGeometry();
          if (polygonGeometry instanceof MultiPolygon) {
            const centerPoint = polygonGeometry.getInteriorPoints();
            const centerCoordinates = centerPoint.getCoordinates()[0];
            map.getView().animate({
              center: [centerCoordinates[0], centerCoordinates[1]],
              duration: 1000,
            });
          }
        };
        // 渲染鼠标悬停区域region图层
        if (!pointerMoveListenerAdded) {
          const pointMoveListener = map.on('pointermove', pointMoveHandle);
          const doubleClickListener = map.on('dblclick', doubleClickHandle);
          pointerMoveListenerAdded = true;

          const param1 = {
            listener: pointMoveListener,
            listenerId: 'pointMoveListener',
            listenerGroup: 'mapLevelSearch',
          };
          const param2 = {
            listener: doubleClickListener,
            listenerId: 'doubleClickListener',
            listenerGroup: 'mapLevelSearch',
          };
          mapStore.addListener([param1, param2]);
        }
        // 加载regionoverlay租房数量信息
        if (regionOverlayLayerAdd === false) {
          // 渲染区域房源概要信息overlay ,等待regionSource数据加载完成
          regionSource.once('featuresloadend', function () {
            const properties = regionSource.getFeatures().map((feature) => {
              return feature.getProperties();
            });
            const features = properties.map((property) => {
              return new Feature({
                geometry: new Point([property.wgs84_lng, property.wgs84_lat]),
                properties: {
                  name: property.name,
                  house_count: property.house_count,
                },
              });
            });
            regionOverlaySource.clear();
            regionOverlaySource.addFeatures(features);
            map.addLayer(hoverRegionLayer);
            map.addLayer(regionOverlayLayer);
            regionOverlayLayerAdd = true;
          });
        }
      }
    });

    const param = {
      listener: mapMoveEndListener,
      listenerId: 'mapMoveEndListener',
      listenerGroup: 'mapLevelSearch',
    };
    mapStore.addListener(param);
  }

  function mapLevelSearchClear() {
    mapStore.removeListener({ listenerGroup: 'mapLevelSearch' });
    // 调节图层透明度为0
    regionLayer.setOpacity(0);
    regionOverlayLayer.setOpacity(0);
  }

  // popup图标绘制
  let overlayFeatureArray: Feature<Point>[] = [];
  const overLaySource = new VectorSource<Point>();
  const overLayLayer = new VectorLayer({
    source: overLaySource,
    // 传入style处理函数
    style: overLayStyle,
  });

  // 使用canvas创建 text 文本中的内容，但不渲染至屏幕，仅用于计算text像素长度
  const canvas = document.createElement('canvas');
  // 使用非空断言操作符!
  const context = canvas.getContext('2d')!;
  context.font = '14px Arial';

  // overLayLayer图层style函数
  function overLayStyle(feature) {
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
  }

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
        // src: 'src/assets/svg/overlay-bg.svg',
        src: '/resource/svg/overlay-bg.svg',
        anchor: [0.5, 20],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: [textWidth / 100, 0.9],
      }),
    });
  }

  /**
   * 添加overlay图层内容
   * @param map 添加要素至地图
   * @param data feature数据
   */
  function addOverlay(map: Map, data: any[]) {
    overlayFeatureArray = data.map((element) => {
      let feature = new Feature({
        geometry: new Point([element.wgs84_lng, element.wgs84_lat]),
      });
      feature.setProperties({
        count: element.count,
        plot: element.plot,
      });
      return feature;
    });

    if (overLaySource) {
      overLaySource.clear();
    }
    overLaySource.addFeatures(overlayFeatureArray);
    overLayLayer.setSource(overLaySource);

    if (!mapStore.isLayerExist(map, overLayLayer)) {
      map.addLayer(overLayLayer);
    }
  }

  // 监听按钮在激活状态下的切换
  watch(activeButton, (newValue, oldValue) => {
    // 按钮为停止状态启动地图层级查询
    if (newValue === -1) {
      mapLevelSearch();
    }
    if (oldValue === -1 && newValue !== -1) {
      mapLevelSearchClear();
    }
  });

  // const searchResult = useMapLevelSearch();
  // houseList.value = searchResult.value;
  const refMapContainer = ref();
  onMounted(() => {
    map = mapStore.addMap('bigscreem-map-container', mapName.value);
    useMapContainerObserver(map, refMapContainer);
  });
</script>

<style lang="less" scoped>
  .bigscreem-container {
    width: 100%;
    height: 100%;

    #bigscreem-map-container {
      width: 100%;
      height: 100%;
    }

    .left-container {
      position: absolute;
      top: 2vw;
      left: 2vw;
      width: 20vw;
    }

    .middle-container {
      position: absolute;
      top: 2vw;
      left: 35%;
      width: 20vw;
    }

    .right-container {
      position: absolute;
      width: 24vw;
      top: 2vw;
      right: 2vw;
    }

    .bottom-container {
      position: absolute;
      bottom: 0;
      width: 100%;
    }
  }
</style>
