<template>
  <div id="container">
    <div class="right">
      <div class="right-item">
        <Button class="search-button" @click="activeButtonHandle(0)">地铁线路查询</Button>
        <AntSelect v-if="activeButton === 0" v-model:value="activeLine" @change="subwaySelect">
          <SelectOption v-for="options in subwaylines" :key="options.label" :value="options.value"
            >{{ options.label }}
          </SelectOption>
        </AntSelect>
      </div>
      <div class="right-item">
        <Button class="search-button" @click="activeButtonHandle(1)">多边形查询</Button>
      </div>
      <div class="right-item">
        <Button class="search-button" @click="activeButtonHandle(2)">可达性查询</Button>
        <div v-if="activeButton == 2" class="slider-container">
          <Slider v-model:value="arriveTime" :min="10" :max="45" vertical />
        </div>
      </div>
    </div>
    <div class="middle">
      <div class="middle-item">
        <!-- TODO 样式调整 -->
        <InputSearch
          v-model:value="placeInfo.name"
          @search="placeSearch"
          @focus="inputBlurHandler"
        />
        <Button @click="activeButtonHandle(3)">规划</Button>
        <Button @click="propertiesActiveButtonHandle(0)">方式</Button>
        <Button @click="propertiesActiveButtonHandle(1)">租金</Button>
        <Button @click="searchFilterHandle(0)">清空筛选</Button>
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
            <Button @click="searchFilterHandle(-2)">重置</Button>
            <Button @click="searchFilterHandle(2)">确认</Button>
          </FormItem>
        </Form>
      </div>
      <div class="middle-item" v-if="propertyFromShow === 1">
        <Form class="middle-item-priceform">
          <FormItem>
            <Slider v-model:value="priceSliderValue" range :min="0" :max="9000" />
          </FormItem>
          <FormItem>
            <Button @click="searchFilterHandle(-1)">重置</Button>
            <Button @click="searchFilterHandle(1)">确认</Button>
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
            <ListItem @click="[handleAutoCompleteListItemClick(item), inputBlurHandler()]">
              <ListItemMeta>
                <template #description>
                  <div>{{ item.name }}</div>
                </template>
              </ListItemMeta>
            </ListItem>
          </template>
        </List>
      </div>
      <div
        class="middle-item"
        v-if="pathPlaningShow"
        style="display: flex; flex-direction: column; background-color: #fff"
      >
        <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <FormItem label="起点">
            <Input v-model:value="pathPlaningForm.startPlace" @click="activeInputHandler(1)" />
          </FormItem>
          <FormItem label="终点">
            <Input id="2" v-model:value="pathPlaningForm.endPlace" @click="activeInputHandler(2)" />
          </FormItem>
          <FormItem>
            <Button @click="pathPlaning">搜索</Button>
          </FormItem>
        </Form>
        <List
          class="middle-item-searchlist"
          :data-source="placeInfoList"
          item-layout="horizontal"
          :pagination="pagination"
        >
          <template #renderItem="{ item }">
            <ListItem @click="pathPlaningListItemClickHandler(item)">
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
                <img width="60" alt="logo" src="public/resource/img/lianjia_logo.png" />
                <!-- <img width="60" alt="logo" src="../../assets/images/lianjia_logo.png" /> -->
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
  </div>
</template>

<script setup lang="ts">
  import { CaretDownOutlined } from '@ant-design/icons-vue';
  import {
    Select as AntSelect,
    Button,
    Checkbox,
    CheckboxGroup,
    Form,
    FormItem,
    Input,
    InputSearch,
    List,
    ListItem,
    ListItemMeta,
    SelectOption,
    Slider,
  } from 'ant-design-vue';
  import { debounce } from 'lodash-es';
  import { Map } from 'ol';
  import Feature from 'ol/Feature.js';
  import { unByKey } from 'ol/Observable';
  import GeoJSON from 'ol/format/GeoJSON';
  import { LineString, MultiPolygon, Point, Polygon } from 'ol/geom';
  import { Draw, Interaction, Snap } from 'ol/interaction';
  import VectorLayer from 'ol/layer/Vector';
  import 'ol/ol.css';
  import VectorSource from 'ol/source/Vector';
  import { getDistance } from 'ol/sphere';
  import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
  import { onMounted, reactive, ref, watch, watchEffect } from 'vue';
  import {
    CircleData,
    OptionData,
    PlotData,
    PointData,
    PolygonData,
    PolygonListData,
    getHouseInPlots,
    getPlotsInCircle,
    getPlotsInPolygon,
    getPlotsInPolygonList,
  } from '../../api/point';
  import initGaoDe from '../../utils/gaode';
  import addMap from '/@/store/modules/map';
  import mapContainerWatch from '/@/utils/mapContainerWatch';

  // 获取全局唯一map
  let map: Map;
  const subwaylines = {
    lineOne: {
      label: '一号线',
      value: 'lineOne',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line1&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineTwo: {
      label: '二号线',
      value: 'lineTwo',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line2&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineThree: {
      label: '三号线',
      value: 'lineThree',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line3&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFour: {
      label: '四号线',
      value: 'lineFour',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line4&maxFeatures=50&outputFormat=application%2Fjson',
    },
    lineFive: {
      label: '五号线',
      value: 'lineFive',
      url: 'http://localhost:8080/geoserver/lianjia/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lianjia%3Ashanghai_subawy_line5&maxFeatures=50&outputFormat=application%2Fjson',
    },
  };

  /**
   * 按钮选择处理器
   */
  const activeButton = ref(-1);

  function activeButtonHandle(index) {
    switch (index) {
      case 0:
        subwaySearchHandle(index);
        break;
      case 1:
        polygonSearchHandle(index);
        break;
      case 2:
        arrivalRangeHandle(index);
        break;
      case 3:
        pathPlaningHandle(index);
        break;
    }
  }

  let currentPropertyButton = ref(-1);

  // 属性过滤器按钮选中控制
  function propertiesActiveButtonHandle(index) {
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
  let option: OptionData = {};
  const lease_typeCheck = ref([]);
  const priceSliderValue = ref<[number, number]>([2000, 5000]);

  /**
   * 查询参数过滤策略控制器
   * @param index 传入属性过滤参数，不同index启用不同过滤参数
   */
  function searchFilterHandle(index) {
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

  // 获取图层要素信息
  let subwayLayerAdd = false;
  let circleDraw: Interaction | null;
  let snap: Interaction | null;

  // 监听器
  let subwaySearchListener;
  let polygonSearchListener;
  let arrivalSearchListener;
  let clickPlotListener;
  let mapMoveEndListener;
  let pointMoveListener;
  let doubleClickListener;
  let pathPlaningListener;

  // 监听器清除函数，可选保留监听器或全部清除 不提供参数exceptListener则全部清除
  function listenerClear(exceptListener = null) {
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
    if (pathPlaningListener && pathPlaningListener !== exceptListener) {
      unByKey(pathPlaningListener);
      pathPlaningListener = null;
    }
  }

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

  // 激活地铁选择下拉栏
  function subwaySearchHandle(index) {
    if (activeButton.value == index) {
      subwaySearchClear();
      activeButton.value = -1;
    } else {
      activeButton.value = 0;
    }
  }

  // INFO 选择地铁线路
  function subwaySelect() {
    let url = subwaylines[activeLine.value].url;
    subwayVectorSource.setUrl(url);
    subwayVectorSource.refresh();
    if (!subwayLayerAdd) {
      map.addLayer(subwayVectorLayer);
      subwayLayerAdd = true;
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

  function getFeature(map: Map) {
    listenerClear();

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
    subwaySearchListener = circleDraw.on('drawend', async (_event) => {
      let param: CircleData = {
        latitude: null,
        longitude: null,
        radius: null,
      };
      param.longitude = center[0];
      param.latitude = center[1];
      param.radius = radius;
      param = searchFilter(param);
      const response = await getPlotsInCircle(param);
      houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      addOverlay(map, response.data.plots);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
      getHouseByClickPlot(map);
    });
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
  }

  const pagination = {
    pageSize: 4,
  };

  // 多边形搜索处理
  const listShow = ref(false);
  const houseList = ref([] as any[]);
  let polygonDraw;

  function polygonSearchHandle(index) {
    if (activeButton.value == index) {
      polygonSearchClear();
      listShow.value = false;
      activeButton.value = -1;
    } else {
      polygonSearch();
      activeButton.value = 1;
    }
  }

  // INFO 多边形搜索功能
  function polygonSearch() {
    // 清除所有监听器
    listenerClear();

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
    polygonSearchListener = polygonDraw.on('drawend', async (event) => {
      const polygons = event.feature.getGeometry();
      let coordinates = polygons.getCoordinates();
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
      param = searchFilter(param);
      const response = await getPlotsInPolygon(param);
      houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      addOverlay(map, response.data.plots);
      houseList.value = [...response.data.houseList];
      listShow.value = true;
      // 获取小区信息详细房屋信息
      clickPlotListener = getHouseByClickPlot(map);
    });
  }

  function polygonSearchClear() {
    map.removeInteraction(polygonDraw);
  }

  let currentOverlayPoint;

  // 点击小区overlay获取详细租房信息
  function getHouseByClickPlot(map: Map) {
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

  // 公交可达圈分析处理
  let isDrawLayerAdd = false;
  const arriveTime = ref(20);
  const arriveOption = ref('SUBWAY,BUS');
  const drawVectorSource = new VectorSource();
  const drawVectorLayer = new VectorLayer({
    source: drawVectorSource,
    style: drawStyle,
  });

  function arrivalRangeHandle(index) {
    if (activeButton.value == index) {
      drawVectorSource.clear();
      activeButton.value = -1;
      unByKey(arrivalSearchListener);
      arrivalSearchListener = null;
    } else {
      arrivalRangeSearch();
      activeButton.value = 2;
    }
  }

  // INFO 可达范围搜索功能
  function arrivalRangeSearch() {
    // 清除所有监听函数
    listenerClear();
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
            polygonListParam = searchFilter(polygonListParam);
            const response = await getPlotsInPolygonList(polygonListParam);
            houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
            addOverlay(map, response.data.plots);
            houseList.value = [...response.data.houseList];
            listShow.value = true;
            clickPlotListener = getHouseByClickPlot(map);
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
    let featureArray: Feature[] = [];
    polygon.forEach((element) => {
      let feature = new Feature({
        geometry: new Polygon(element),
      });
      featureArray.push(feature);
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

  // INFO 地图层级查询
  function mapLevelSearch() {
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
          param = searchFilter(param);
          const response = await getPlotsInCircle(param);
          houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
          addOverlay(map, response.data.plots);
          clickPlotListener = getHouseByClickPlot(map);
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
          pointMoveListener = map.on('pointermove', debounce(pointMoveHandle, 100));
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

  function mapLevelSearchClear() {
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

  const searchListShow = ref<boolean>(false);
  function inputBlurHandler() {
    searchListShow.value = searchListShow.value === false ? true : false;
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

  // INFO 地名自动补全
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
      param = searchFilter(param);
      const response = await getPlotsInCircle(param);
      houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      addOverlay(map, response.data.plots);
      clickPlotListener = getHouseByClickPlot(map);
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

  // 路径规划部分
  const pathPlaningShow = ref<boolean>(false);
  const pathPlaningForm = reactive({
    startPlace: '',
    endPlace: '',
  });
  // watch(
  //   () => pathPlaningForm.startPoint,
  //   (newValue, _oldValue) => {
  //     if (newValue) {
  //       autoCompleteSearch(pathPlaningForm.startPoint);
  //     }
  //   },
  // );

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
  function planingUpperStyle(feature: Feature) {
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

  // INFO 路径规划
  let lineFeatureList: Feature<LineString>[];
  const { pathPlaningPromise } = initGaoDe();
  /**
   * 输入起终地点名进行路径规划
   */
  function pathPlaning() {
    listenerClear();
    pathPlaningPromise.then((pathPlaning) => {
      pathPlaning.search(
        [{ keyword: pathPlaningForm.startPlace }, { keyword: pathPlaningForm.endPlace }],
        (_status, result) => {
          console.log('result', result);
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
        },
      );
    });

    // 更新比例尺时更新箭头数量和指向
    listenerClear(pathPlaningListener);
    pathPlaningListener = map.getView().on('change:resolution', () => {
      // 计算箭头数量
      calculateArrowPoints(lineFeatureList);
    });
  }
  let arrowPoints: Feature<Point>[];
  function calculateArrowPoints(lineFeatureList) {
    arrowPoints = [];
    lineFeatureList.forEach((lineFeature) => {
      let arrowNumber = Math.ceil(
        lineFeature.getGeometry().getLength() / map.getView().getResolution()! / 100,
      );
      for (var i = 0; i <= arrowNumber; i++) {
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
  function pathPlaningHandle(index) {
    if (activeButton.value == index) {
      pathPlaningClear();
      pathPlaningShow.value = pathPlaningShow.value === false ? true : false;
      activeButton.value = -1;
    } else {
      pathPlaningShow.value = pathPlaningShow.value === false ? true : false;
      activeButton.value = 3;
    }
  }
  function pathPlaningClear() {
    pathPlaningSource.clear();
    pathPlaningArrowSource.clear();
    pathPlaningPopupSource.clear();
  }

  // 监听按钮在激活状态下的切换
  watch(activeButton, (newValue, oldValue) => {
    // 切换前激活地铁查询，切换后激活其他查询，且按钮不为停止状态
    if (oldValue === 0 && newValue !== 0 && newValue !== -1) {
      subwaySearchClear();
    }
    if (oldValue === 1 && newValue !== 1 && newValue !== -1) {
      polygonSearchClear();
    }
    if (oldValue === 2 && newValue !== 2 && newValue !== -1) {
      drawVectorSource.clear();
    }
    if (oldValue === 3 && newValue !== 3 && newValue !== -1) {
      pathPlaningClear();
    }
    // 按钮为停止状态启动地图层级查询
    if (newValue === -1) {
      mapLevelSearch();
    }
    if (oldValue === -1 && newValue !== -1) {
      mapLevelSearchClear();
    }
  });

  onMounted(() => {
    map = addMap('container', 'bigscreem');
    mapLevelSearch();
    addLengthScaleTest(map);
    mapContainerWatch(map);
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
