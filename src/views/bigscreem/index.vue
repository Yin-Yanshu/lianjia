<template>
  <div id="container">
    <div class="right">
      <div class="right-item">
        <Button class="search-button" @click="ActiveButtonHandle(0)">地铁线路查询</Button>
        <AntSelect v-if="activeButton === 0" v-model:value="activeLine" @change="SubwaySelect">
          <SelectOption v-for="option in subwaylines" :key="option.label" :value="option.label"
            >{{ option.label }}
          </SelectOption>
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
    <div class="middle">
      <div class="middle-item">
        <Input v-model:value="placeInfo.name" @onBlur="inputBlurHandler" />
        <Button @click="placeSearch">搜索</Button>
        <Button @click="PropertiesActiveButtonHandle(0)">方式</Button>
        <Button @click="PropertiesActiveButtonHandle(1)">租金</Button>
        <Button @click="SearchfilterHandle(0)">清空筛选</Button>
      </div>
      <div class="middle-item" v-if="propertyFromShow === 0">
        <Form class="middle-item-leaseform">
          <FormItem>
            <CheckboxGroup v-model:value="lease_typeCheck">
              <Checkbox :value="0">整租</Checkbox>
              <Checkbox :value="1">合租</Checkbox>
              <!-- <Checkbox
                :checked="lease_typeCheck[0] === 1"
                :value="1"
                @change="handleCheckboxChange(1)"
                >合租</Checkbox
              > -->
            </CheckboxGroup>
          </FormItem>
          <FormItem>
            <Button @click="SearchfilterHandle(-2)">重置</Button>
            <Button @click="SearchfilterHandle(2)">确认</Button>
          </FormItem>
        </Form>
      </div>
      <div class="middle-item" v-if="propertyFromShow === 1">
        <Form class="middle-item-priceform">
          <FormItem>
            <Slider v-model:value="priceSliderValue" range :min="0" :max="9000" />
          </FormItem>
          <FormItem>
            <Button @click="SearchfilterHandle(-1)">重置</Button>
            <Button @click="SearchfilterHandle(1)">确认</Button>
          </FormItem>
        </Form>
      </div>
      <div class="middle-item" v-if="searchListShow">
        <List
          class="middle-item-searchlist"
          :data-source="placeInfoList"
          item-layout="horizontal"
          :pagination="pagination"
        >
          <template #renderItem="{ item }">
            <ListItem @click="handleAutoCompleteListItemClick(item)">
              <ListItemMeta>
                <template #description>
                  <div>{{ item.name }}</div>
                </template>
              </ListItemMeta>
            </ListItem>
          </template>
        </List>
      </div>
    </div>
    <div class="left">
      <div class="left-item left-list-title"
        ><h4>可视区域内找到{{ houseCount }}套房子</h4>
        <CaretDownOutlined @click="listShow = !listShow" />
      </div>
      <div v-if="listShow" class="left-item">
        <List
          class="left-list"
          :data-source="houseList"
          item-layout="vertical"
          :pagination="pagination"
        >
          <template #renderItem="{ item }">
            <ListItem @click="handleListItemClick(item)">
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
                <!-- <img width="60" alt="logo" src="public/resource/img/logo.png" /> -->
                <img width="60" alt="logo" src="../../assets/images/lianjia_logo.png" />
              </template>
            </ListItem>
          </template>
        </List>
      </div>
    </div>
    <div class="down">
      <img src="public/resource/svg/line.svg" /><span>{{ length }}km</span
      ><img src="public/resource/svg/line.svg" />
    </div>
    <!-- <div class="down" ref="refLengthScale"></div> -->
  </div>
</template>

<script setup lang="ts">
  import { CaretDownOutlined } from '@ant-design/icons-vue';
  import {
    Button,
    Checkbox,
    CheckboxGroup,
    Form,
    FormItem,
    Input,
    List,
    ListItem,
    ListItemMeta,
    Select as AntSelect,
    SelectOption,
    Slider,
  } from 'ant-design-vue';
  import { debounce } from 'lodash-es';
  import { Map } from 'ol';
  import Feature from 'ol/Feature.js';
  import { unByKey } from 'ol/Observable';
  import GeoJSON from 'ol/format/GeoJSON';
  import { MultiPolygon, Point, Polygon } from 'ol/geom';
  import { Draw, Snap } from 'ol/interaction';
  import VectorLayer from 'ol/layer/Vector';
  import 'ol/ol.css';
  import VectorSource from 'ol/source/Vector';
  import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
  import { onMounted, reactive, ref, watch } from 'vue';
  import {
    CircleData,
    getHouseInPlots,
    getPlotsInCircle,
    getPlotsInPolygon,
    getPlotsInPolygonList,
    OptionData,
    PlotData,
    PointData,
    PolygonData,
    PolygonListData,
  } from '../../api/point';
  import { useMapStore } from '../../store/modules/map';
  import initGaoDe from '../../utils/gaode';
  import { getDistance } from 'ol/sphere';

  // mapstore获取全局唯一map
  let map;
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

  let currentPropertyButton = ref(-1);

  // 属性过滤器按钮选中控制
  function PropertiesActiveButtonHandle(index) {
    switch (index) {
      // 方式过滤
      case 0:
        if (currentPropertyButton.value === index) {
          propertyFromShow.value = -1;
          currentPropertyButton.value = -1;
        } else {
          propertyFromShow.value = 0;
          currentPropertyButton.value = 0;
        }
        break;
      // 价格过滤
      case 1:
        if (currentPropertyButton.value === index) {
          propertyFromShow.value = -1;
          currentPropertyButton.value = -1;
        } else {
          propertyFromShow.value = 1;
          currentPropertyButton.value = 1;
        }
        break;
    }
  }

  // function handleCheckboxChange(value) {
  //   lease_typeCheck.value = value;
  // }
  let propertyFromShow = ref(-1);
  // 过滤器选项
  let option = {} as OptionData;
  const lease_typeCheck = ref([]);
  const priceSliderValue = ref<[number, number]>([2000, 5000]);

  /**
   * 查询参数过滤策略控制器
   * @param index 传入属性过滤参数，不同index启用不同过滤参数
   */
  function SearchfilterHandle(index) {
    switch (index) {
      //  确认关闭属性过滤
      case 0:
        option = {};
        break;
      // 确认增加 价格 过滤
      case 1:
        option.price_min = priceSliderValue.value[0];
        option.price_max = priceSliderValue.value[1];
        propertyFromShow.value = -1;
        break;
      // 确认清除 价格 过滤
      case -1:
        delete option.price_min;
        delete option.price_max;
        propertyFromShow.value = -1;
        break;
      // 确认增加 方式 过滤
      case 2:
        if (lease_typeCheck.value[0] === 0) {
          option.lease_type = '整租';
        } else if (lease_typeCheck.value[0] === 1) {
          option.lease_type = '合租';
        }
        propertyFromShow.value = -1;
        break;
      // 确认清除 方式 过滤
      case -2:
        delete option.lease_type;
        propertyFromShow.value = -1;
        break;
    }
  }

  /**
   * 查询参数过滤器
   * @param param 原始查询参数
   * @returns 返回增加属性限制的查询参数
   */
  function Searchfilter(param) {
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
    // 思路错误 switch仅能过滤有限个属性
    // switch (filterIndex.value) {
    //   //  关闭属性过滤
    //   case -1:
    //     return param;
    //   // 开启 价格 过滤
    //   case 0:
    //     param.option = {
    //       price_min: price_min,
    //       price_max: price_max,
    //     };
    //     return param;
    //   // 开启 方式 过滤
    //   case 1:
    //     param.option = {
    //       lease_type: lease_type,
    //     };
    //     return param;
    //   // 开启 价格 方式 过滤
    //   case 2:
    //     param.option = {
    //       price_min: price_min.value,
    //       price_max: price_max.value,
    //       lease_type: lease_type.value,
    //     };
    //     return param;
    // }
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

  // 监听器
  let subwaySearchListener;
  let polygonSearchListener;
  let arrivalSearchListener;
  let clickPlotListener;
  let mapMoveEndListener;
  let pointMoveListener;
  let doubleClickListener;

  // 监听器清除函数，可选保留监听器或全部清除 不提供参数exceptListener则全部清除
  function ListenerClear(exceptListener?) {
    // 如果subwaySearchListener存在且subwaySearchListener不等于保留监听器则unByKey
    if (subwaySearchListener && subwaySearchListener !== exceptListener) {
      unByKey(subwaySearchListener);
      subwaySearchListener = null;
    }
    if (polygonSearchListener && polygonSearchListener !== exceptListener) {
      unByKey(polygonSearchListener);
      polygonSearchListener = null;
    }
    if (arrivalSearchListener && arrivalSearchListener !== exceptListener) {
      unByKey(arrivalSearchListener);
      arrivalSearchListener = null;
    }
    if (mapMoveEndListener && mapMoveEndListener !== exceptListener) {
      unByKey(mapMoveEndListener);
      mapMoveEndListener = null;
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

  function GetFeature(map: Map) {
    ListenerClear();

    circleDraw = new Draw({
      source: new VectorSource(),
      type: 'Circle',
      style: drawStyle,
      // condition接受boolen，函数返回true绘制当前点
      condition: (event) => {
        let features = map.getFeaturesAtPixel(event.pixel);
        if (features.length === 0) {
          return false;
        }
        const properties = features[0].getProperties();
        const plot = properties.plot;

        if (plot) {
          console.log('property:', properties);
          return false;
        }

        const geometry = features[0].getGeometry();
        // ?. js语法访问对象属性或调用方法时，如果目标对象或属性不存在（即为 null 或 undefined）
        // 不会抛出错误，而是直接返回 undefined
        console.log('geometry:', geometry);
        const coordinates = geometry?.getCoordinates();
        if (coordinates) {
          center = coordinates;
          console.log('coordinates:', coordinates);
        }
        return true;
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
      let param: CircleData = {
        latitude: null,
        longitude: null,
        radius: null,
      };
      param.longitude = center[0];
      param.latitude = center[1];
      param.radius = 0.01;
      param = Searchfilter(param);
      const response = await getPlotsInCircle(param);
      houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      AddOverlay(map, response.data.plots);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
      GetHouseByClickPlot(map as Map);
    });
  }

  // 地铁查询清除
  function SubwaySearchClear() {
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
    subwayVectorSource.clear();
    map.removeInteraction(circleDraw);
    isFirstCall = false;
  }

  // 加载WFS服务图层
  let subwayVectorSource = new VectorSource({
    format: new GeoJSON(),
  });
  let subwayVectorLayer = new VectorLayer({
    source: subwayVectorSource,
    style: new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({
          color: 'rgb(255,255,255)',
        }),
        stroke: new Stroke({
          color: '#f9d79d',
          width: 4,
        }),
      }),
    }),
  });

  function AddWFS(map: Map, url) {
    if (subwayVectorSource) {
      subwayVectorSource.clear();
    }
    subwayVectorSource = new VectorSource({
      format: new GeoJSON(),
      url: url,
    });
    subwayVectorLayer.setSource(subwayVectorSource);

    if (!subwayLayerAdd) {
      map.addLayer(subwayVectorLayer);
      subwayLayerAdd = true;
    }
  }

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
    // 清除所有监听器
    ListenerClear();

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
      // condition接受boolen，函数返回true绘制当前点
      condition: (event) => {
        let features = map.getFeaturesAtPixel(event.pixel);
        if (features.length == 0) {
          return true;
        } else {
          console.log('features');
          console.log(features[0].getProperties());

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
      let param: PolygonData = {
        polygon: polygon,
      };
      // 参数过滤，添加查询限制条件
      param = Searchfilter(param);
      const response = await getPlotsInPolygon(param);
      houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      AddOverlay(map as Map, response.data.plots);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
      // 获取小区信息详细房屋信息
      clickPlotListener = GetHouseByClickPlot(map as Map);
    });
  }

  function PolygonSearchClear() {
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Draw) {
        let draw = map.removeInteraction(interaction);
        console.log('Draw', draw);
      }
    });

    // let draw = map.removeInteraction(polygonDraw);
    // console.log('Draw',draw);
  }

  let currentOverlayPoint;

  // 点击小区overlay获取详细租房信息
  function GetHouseByClickPlot(map: Map) {
    if (clickPlotListener) {
      return;
    }

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
        param = Searchfilter(param);
        const response = await getHouseInPlots(param);
        houseList.value = [...response.data];
        listShow.value = true;

        // 还原上一点样式
        if (currentOverlayPoint) {
          const style = overLayStyle(currentOverlayPoint);
          currentOverlayPoint.setStyle(style);
        }
        // 更改当前点样式为点击状态
        const style = overLayStyle(features[0], 'click');
        features[0].setStyle(style);
        currentOverlayPoint = features[0];
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
    style: drawStyle,
  });

  function ArrivalRangeHandle(index) {
    if (activeButton.value == index) {
      drawVectorSource.clear();
      activeButton.value = -1;
      unByKey(arrivalSearchListener);
      arrivalSearchListener = null;
    } else {
      ArrivalRangeSearch();
      activeButton.value = 2;
    }
  }

  function ArrivalRangeSearch() {
    // 清除所有监听函数
    ListenerClear();
    arrivalSearchListener = map.on('click', (event) => {
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
            polygonListParam = Searchfilter(polygonListParam);
            const response = await getPlotsInPolygonList(polygonListParam);
            houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
            AddOverlay(map as Map, response.data.plots);
            houseList.value = [...response.data.houseList];
            listShow.value = true;
            clickPlotListener = GetHouseByClickPlot(map as Map);
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
    drawVectorSource.clear();
    let featureArray = [];
    polygon.forEach((element) => {
      let feature = new Feature({
        geometry: new Polygon(element),
      });
      featureArray.push(feature as never);
    });
    drawVectorSource.addFeatures(featureArray);
    if (isDrawLayerAdd === false) {
      // 限制图层叠加至最底层，index=0为高德切片地图
      map.getLayers().insertAt(1, drawVectorLayer);
      isDrawLayerAdd = true;
    }
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
    // url: 'http://localhost:8080/geoserver/lianjia/gwc/demo/lianjia:region?gridSet=EPSG:4326&format=application/json;type=geojson',
    url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Aregion&maxFeatures=50&outputFormat=application%2Fjson',
  });
  // 如想使用矢量切片方式加载region数据需使用VectorTile图层类和VectorTile数据源类并编写切片方法
  const regionLayer = new VectorLayer({
    source: regionSource,
    style: defaultStyle,
  });
  let currentRegionFeature;

  const houseCount = ref(0);

  // 地图层级查询
  function MapLevelSearch() {
    if (mapMoveEndListener) return;

    mapMoveEndListener = map.on('moveend', async () => {
      const viewZoom = map.getView().getZoom();
      const center = map.getView().getCenter();
      if (!viewZoom || !center) return;
      // 地图层级自动查询
      if (viewZoom > 15) {
        if (regionLayerAdd) {
          regionLayer.setOpacity(0);
          regionOverlayLayer.setOpacity(0);
        }
        unByKey(pointMoveListener);
        unByKey(doubleClickListener);
        pointerMoveListenerAdded = false;
        // console.log('center', map.getView().getCenter());
        let param: CircleData = {
          longitude: center[0],
          latitude: center[1],
          radius: 0.01,
        };
        // 避免频繁发起请求，添加防抖功能
        debounce(async () => {
          param = Searchfilter(param);
          const response = await getPlotsInCircle(param);
          houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
          AddOverlay(map as Map, response.data.plots);
          clickPlotListener = GetHouseByClickPlot(map as Map);
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
        const pointMoveHandle = (event) => {
          let newFeature;
          map.forEachFeatureAtPixel(event.pixel, (feature) => {
            newFeature = feature;
            return; // 找到第一个就停止遍历
          });
          if (currentRegionFeature !== newFeature) {
            if (currentRegionFeature) {
              currentRegionFeature.setStyle(defaultStyle);
            }
            if (newFeature) {
              newFeature.setStyle(hoverStyle);
            }
            currentRegionFeature = newFeature;
          }

          // map.forEachFeatureAtPixel(event.pixel, (feature) => {
          //   console.log('feature', feature);
          //   // 还原上一要素样式为透明状态
          //   if (currentRegionFeature) {
          //     const currentFill = currentRegionFeature.getStyle()?.getFill()?.getColor();
          //     const featureFill = feature.getStyle()?.getFill()?.getColor();
          //     if (currentFill == featureFill) return;
          //     currentRegionFeature.setStyle(defaultStyle);
          //     console.log('切换style');
          //   }
          //   // 设置当前要素样式
          //   feature.setStyle(hoverStyle);
          //   currentRegionFeature = feature;
          // });
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
          pointMoveListener = map.on('pointermove', pointMoveHandle);
          doubleClickListener = map.on('dblclick', doubleClickHandle);
          pointerMoveListenerAdded = true;
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
            map.addLayer(regionOverlayLayer);
            regionOverlayLayerAdd = true;
          });
        }
      }
    });
  }

  function MapLevelSearchClear() {
    unByKey(pointMoveListener);
    unByKey(doubleClickListener);
    pointMoveListener = null;
    unByKey(mapMoveEndListener);
    mapMoveEndListener = null;
    unByKey(clickPlotListener);
    clickPlotListener = null;
    pointerMoveListenerAdded = false;
    // 调节图层透明度为0
    regionLayer.setOpacity(0);
    regionOverlayLayer.setOpacity(0);
  }

  // popup图标绘制
  let overLaySourceAdd = false;
  let overlayFeatureArray = [];
  const overLaySource = new VectorSource();
  const overLayLayer = new VectorLayer({
    source: overLaySource,
    // 传入style处理函数
    style: overLayStyle,
  });

  // 使用canvas创建 text 文本中的内容，但不渲染至屏幕，仅用于计算text像素长度
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = '14px Arial';

  // overLayLayer图层style函数
  function overLayStyle(feature, type = 'default') {
    // console.log(feature.getProperties());
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
          scale: [textWidth / 100, 0.8],
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
  function AddOverlay(map: Map, data) {
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

    if (overLaySourceAdd === false) {
      map.addLayer(overLayLayer);
      overLaySourceAdd = true;
    }
  }

  // 列表点击处理函数，列表信息与地图视窗联动
  function handleListItemClick(item) {
    map.getView().animate({
      center: [item.wgs84_lng, item.wgs84_lat],
      duration: 1000,
    });
  }

  const searchListShow = ref(true);

  function inputBlurHandler() {
    searchListShow.value == true ? false : true;
  }

  const { autoCompletePromise } = initGaoDe();
  const placeInfo = reactive({
    name: '',
    location: {
      longitude: '',
      latitude: '',
    },
  });
  watch(placeInfo, (newValue, _oldValue) => {
    if (newValue) {
      autoCompleteSearch(placeInfo.name);
    }
  });

  const placeInfoList = ref();
  function autoCompleteSearch(name) {
    autoCompletePromise.then((autoComplete) => {
      autoComplete.search(name, (_status, result) => {
        placeInfoList.value = result.tips;
      });
    });
  }

  function handleAutoCompleteListItemClick(item) {
    placeInfo.name = '';
    placeInfo.location.longitude = '';
    placeInfo.location.latitude = '';
    placeInfo.name = item.name;
    placeInfo.location.longitude = item.location.lng;
    placeInfo.location.latitude = item.location.lat;
    placeSearch();
    map.getView().animate({
      center: [item.location.lng, item.location.lat],
      duration: 1000,
    });
  }

  function placeSearch() {
    if (placeInfo.location.longitude === '' || placeInfo.location.latitude === '') return;
    let param: CircleData = {
      longitude: Number(placeInfo.location.longitude),
      latitude: Number(placeInfo.location.latitude),
      radius: 0.01,
    };
    debounce(async () => {
      param = Searchfilter(param);
      const response = await getPlotsInCircle(param);
      houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      AddOverlay(map as Map, response.data.plots);
      clickPlotListener = GetHouseByClickPlot(map as Map);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
    }, 1000)();
  }

  const length = ref();

  function addLengthScaleTest(map: Map) {
    let extent;
    let startPoint;
    let endPoint;
    // 获取初始view地图长度
    extent = map.getView().calculateExtent(map.getSize());
    startPoint = [extent[0], extent[1]];
    endPoint = [extent[2], extent[1]];
    length.value = (getDistance(endPoint, startPoint) / 1000).toFixed(2);
    // 监听zoom大小改变时地图长度
    map.getView().on('change:resolution', () => {
      extent = map.getView().calculateExtent(map.getSize());
      startPoint = [extent[0], extent[1]];
      endPoint = [extent[2], extent[1]];
      length.value = (getDistance(endPoint, startPoint) / 1000).toFixed(2);
    });
  }

  // 监听按钮在激活状态下的切换
  watch(activeButton, (newValue, oldValue) => {
    // 切换前激活地铁查询，切换后激活其他查询，且按钮不为停止状态
    if (oldValue === 0 && newValue !== 0 && newValue !== -1) {
      SubwaySearchClear();
    }
    if (oldValue === 1 && newValue !== 1 && newValue !== -1) {
      PolygonSearchClear();
    }
    if (oldValue === 2 && newValue !== 2 && newValue !== -1) {
      drawVectorSource.clear();
    }
    // 按钮为停止状态启动地图层级查询
    if (newValue === -1) {
      MapLevelSearch();
    }
    if (oldValue === -1 && newValue !== -1) {
      MapLevelSearchClear();
    }
  });

  onMounted(() => {
    mapStore.InitOpenlayers('container');
    map = mapStore.GetMap;
    MapLevelSearch();
    addLengthScaleTest(map);
  });
</script>

<style lang="less" scoped>
  #container {
    width: 100%;
    height: 100%;

    .right {
      position: absolute;
      top: 4%;
      right: 4%;
      width: 30%;
      display: flex;
      justify-content: space-between;
      z-index: 999;

      .right-item {
        position: relative;
        width: 80%;
        height: 50px;
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
      top: 4%;
      left: 4%;
      z-index: 999;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      .left-item {
        background-color: #fff;
        width: 100%;
      }

      .left-list-title {
        height: 50px;
        display: flex;
        justify-content: space-around;
        align-items: center;
      }

      .left-list {
        padding: 20px;
        height: 600px;
      }
    }

    .middle {
      position: absolute;
      top: 4%;
      left: 35%;
      z-index: 999;
      width: 30%;

      .middle-item {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: space-between;
      }

      .middle-item-leaseform {
        width: 100%;
        background-color: #fff;
        padding-top: 10px;
        padding-left: 20px;
        padding-right: 20px;
      }

      .middle-item-priceform {
        width: 100%;
        background-color: #fff;
        padding-top: 10px;
        padding-left: 20px;
        padding-right: 20px;
      }

      .middle-item-searchlist {
        width: 100%;
        background-color: #fff;
        padding-top: 10px;
        padding-left: 20px;
        padding-right: 20px;
      }
    }

    .down {
      position: absolute;
      top: 96%;
      width: 100%;
      z-index: 999;
      display: flex;
      justify-content: center;

      img {
        width: 50%;
      }

      span {
        font-size: 20px;
      }
    }
  }
</style>
