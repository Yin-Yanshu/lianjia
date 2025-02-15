<template>
  <div>
    <a-input-search v-model:value="placeInfo.name" placeholder="搜索位置" @search="placeSearch" />
    <div class="middle-item">
      <a-list
        class="middle-item-searchlist"
        :data-source="placeInfoList"
        item-layout="horizontal"
        :pagination="pagination"
      >
        <template #renderItem="{ item }">
          <a-list-item @click="[handleAutoCompleteListItemClick(item)]">
            <a-list-item-meta>
              <template #description>
                <div>{{ item.name }}</div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { CircleData, getHouseInPlots, getPlotsInCircle, PlotData } from '/@/api/point';
  import { debounce } from 'lodash-es';
  import initGaoDe from '/@/utils/gaode';
  import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
  import { useMapStore } from '/@/store/modules/map';
  import { Map } from 'ol';
  import Feature from 'ol/Feature';
  import { Fill, Icon, Style, Text } from 'ol/style';
  import { Point } from 'ol/geom';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  import { useApiStore } from '/@/store/modules/api';

  const apiStore = useApiStore();
  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });
  const emits = defineEmits(['placeSearchResult']);

  let map: Map;
  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
  });

  const { autoCompletePromise } = initGaoDe();

  const pagination = {
    pageSize: 4,
  };

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

  const placeInfo = reactive({
    name: '',
    location: {
      longitude: '',
      latitude: '',
    },
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

  watch(placeInfo, (newValue, _oldValue) => {
    if (newValue) {
      autoCompleteSearch(placeInfo.name);
    }
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
        emits('placeSearchResult', [...response.data]);

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

  // function addOverlay(map: Map, data) {
  //   // 检查地图中是否已存在overlayLayer
  //   let overLayLayer = map
  //     .getLayers()
  //     .getArray()
  //     .find((layer) => layer instanceof VectorLayer && layer.get('name') === 'overlayLayer');
  //
  //   if (!overLayLayer) {
  //     overLayLayer = new VectorLayer({
  //       source: new VectorSource<Point>(),
  //       // 传入style处理函数
  //       style: (feature) => {
  //         const property = feature.getProperties();
  //         const count = property.count;
  //         const plot = property.plot;
  //         const text = plot + '|' + count + '套';
  //         // 计算text像素长度
  //         const textWidth = context.measureText(text).width;
  //
  //         return new Style({
  //           text: new Text({
  //             font: '14px Arial',
  //             text: text,
  //             fill: new Fill({ color: '#fff' }),
  //             offsetX: 8,
  //           }),
  //           image: new Icon({
  //             src: '/resource/svg/overlay-bg.svg',
  //             anchor: [0.5, 20],
  //             anchorXUnits: 'fraction',
  //             anchorYUnits: 'pixels',
  //             scale: [textWidth / 100, 0.9],
  //           }),
  //         });
  //       },
  //       name: 'overlayLayer',
  //     });
  //     map.addLayer(overLayLayer);
  //   }
  //
  //   overlayFeatureArray = data.map((element) => {
  //     let feature = new Feature({
  //       geometry: new Point([element.wgs84_lng, element.wgs84_lat]),
  //     });
  //     feature.setProperties({
  //       count: element.count,
  //       plot: element.plot,
  //     });
  //     return feature;
  //   });
  //
  //   (overLayLayer as VectorLayer<VectorSource<Point>>).getSource()!.clear();
  //   (overLayLayer as VectorLayer<VectorSource<Point>>)
  //     .getSource()!
  //     .addFeatures(overlayFeatureArray);
  // }

  function placeSearch() {
    if (placeInfo.location.longitude === '' || placeInfo.location.latitude === '') return;
    let param: CircleData = {
      longitude: Number(placeInfo.location.longitude),
      latitude: Number(placeInfo.location.latitude),
      radius: 0.01,
    };
    const clickPlotListener = getHouseByClickPlot(map);
    const listenerParam = {
      listener: clickPlotListener,
      listenerId: 'clickPlotListener-placeSearch',
      listenerGroup: 'placeSearch',
    };
    mapStore.addListener(listenerParam);
    debounce(async () => {
      // param = searchFilter(param);
      // TODO 修改使支持过滤查询
      apiStore.getFilterParams();
      const response = await getPlotsInCircle(param);
      // houseCount.value = response.data.plots.reduce((sum, plot) => sum + plot.count, 0);
      addOverlay(map, response.data.plots);
      emits('placeSearchResult', [...response.data.houseList]);
    }, 1000)();
  }

  onBeforeUnmount(() => {
    mapStore.removeListener({ listenerGroup: 'placeSearch' });
    map.removeLayer(overLayLayer);
  });
</script>

<style scoped></style>
