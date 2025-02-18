<template>
  <div class="container">
    <GrowCard :loading="loading" class="enter-y" />
    <div class="wrapper">
      <div id="map-container" ref="mapContainer">
        <a-rangePicker
          :value="hackValue || value"
          :disabled-date="disabledDate"
          @change="onChange"
          @openChange="onOpenChange"
          @calendarChange="onCalendarChange"
          class="time-picker"
        />
        <a-button class="time-picker-button" @click="buttonClick">查询</a-button>
      </div>
      <div class="pie-container">
        <HouseTypePie />
        <HousePricePie />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { Moment } from 'moment/moment';
  import { Map } from 'ol';
  import Feature from 'ol/Feature';
  import { Point } from 'ol/geom';
  import Heatmap from 'ol/layer/Heatmap';
  import VectorSource from 'ol/source/Vector';
  import { onMounted, ref } from 'vue';
  import GrowCard from './components/GrowCard.vue';
  import HousePricePie from './components/HousePricePie.vue';
  import HouseTypePie from './components/HouseTypePie.vue';
  import { getCurrentHouseHeatMap, HeatMapTimeData } from '/@/api/point';
  import { useMapStore } from '/@/store/modules/map';
  import { useMapContainerObserver } from '/@/utils/mapContainerWatch';
  import { addDynamicHeatMap } from '/@/utils/addDynamicHeatmap';

  const mapStore = useMapStore();

  const loading = ref(true);

  const heatMapSource = new VectorSource<Point>();
  const heatMapLayer = new Heatmap({
    source: heatMapSource,
    blur: 10,
    radius: 10,
    gradient: ['#2200FF', '#E8D225', '#EF1616'],
    zIndex: 4,
    opacity: 0.5,
  });

  // INFO 添加热力图
  async function AddHeatMap(map: Map, getDataFunction: Function, params = null) {
    const response = await getDataFunction(params);
    let features: Feature<Point>[];
    features = response.data.map((item) => {
      return new Feature({
        geometry: new Point([item.wgs84_lng, item.wgs84_lat]), // 添加点坐标
      });
    });
    if (heatMapSource) {
      heatMapSource.clear();
    }
    heatMapSource.addFeatures(features);
    // 判断图层是否已添加
    if (!map.getLayers().getArray().includes(heatMapLayer)) {
      map.addLayer(heatMapLayer);
    }
  }

  function clearHeatMap() {
    heatMapSource.clear();
  }

  type RangeValue = [Moment, Moment];
  const dates = ref<RangeValue>();
  const value = ref<RangeValue>();
  const hackValue = ref<RangeValue>();

  const disabledDate = (current: Moment) => {
    if (!dates.value || (dates.value as any).length === 0) {
      return false;
    }
    const tooLate = dates.value[0] && current.diff(dates.value[0], 'days') > 30;
    const tooEarly = dates.value[1] && dates.value[1].diff(current, 'days') > 30;
    return tooEarly || tooLate;
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      dates.value = [] as any;
      hackValue.value = [] as any;
    } else {
      hackValue.value = undefined;
    }
  };

  const onChange = (val: RangeValue) => {
    value.value = val;
  };

  const onCalendarChange = (val: RangeValue) => {
    dates.value = val;
  };

  const buttonClick = async () => {
    if (value.value) {
      let params = {} as HeatMapTimeData;
      params.start_time = value.value[0].format('YYYY-MM-DD');
      params.end_time = value.value[1].format('YYYY-MM-DD');
      console.log('params', params);
      clearHeatMap();
      await addDynamicHeatMap(map, params);
    }
  };
  // 获取全局唯一map
  let map;
  const mapContainer = ref();
  onMounted(() => {
    map = mapStore.addMap('map-container', 'analysis');
    // TODO 引用test-dynamicheatmap实现功能
    AddHeatMap(map, getCurrentHouseHeatMap);
    useMapContainerObserver(map, mapContainer);
  });

  setTimeout(() => {
    loading.value = false;
  }, 500);
</script>
<style lang="less" scoped>
  .container {
    padding: 16px;
    width: 100%;
    height: 100%;
  }

  .wrapper {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 85%;

    #map-container {
      padding: 16px;
      padding-left: 0px;
      padding-bottom: 0%;
      width: 67%;
      height: 100%;
      position: relative;

      .time-picker {
        width: 400px;
        height: 100px;
        position: absolute;
        top: 16px;
        right: 116px;
        z-index: 10;
      }

      .time-picker-button {
        width: 100px;
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 10;
      }
    }

    .pie-container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 33%;
      height: 100%;
      padding: 16px;
      padding-left: 0px;
      padding-bottom: 0%;
    }
  }
</style>
