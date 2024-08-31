<template>
  <div class="container">
    <GrowCard :loading="loading" class="enter-y" />
    <div class="wrapper">
      <div id="map-container"></div>
      <div class="pie-container">
        <HouseTypePie />
        <HousePricePie />
      </div>
    </div>

    <a-range-picker
      :value="hackValue || value"
      :disabled-date="disabledDate"
      @change="onChange"
      @openChange="onOpenChange"
      @calendarChange="onCalendarChange"
      class="time-picker"
    />
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
  import { getTimeHouseHeatMap, HeatMapTimeData } from '/@/api/point';
  import { useMapStore } from '/@/store/modules/map';

  const loading = ref(true);
  const mapStore = useMapStore();

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

  type RangeValue = [Moment, Moment];
  const dates = ref<RangeValue>();
  const value = ref<RangeValue>();
  const hackValue = ref<RangeValue>();

  const disabledDate = (current: Moment) => {
    if (!dates.value || (dates.value as any).length === 0) {
      return false;
    }
    const tooLate = dates.value[0] && current.diff(dates.value[0], 'days') > 120;
    const tooEarly = dates.value[1] && dates.value[1].diff(current, 'days') > 120;
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
  // mapstore获取全局唯一map
  let map;
  onMounted(() => {
    mapStore.initOpenlayers('map-container');
    map = mapStore.GetMap;
    // AddHeatMap(map, getCurrentHouseHeatMap);
    const params: HeatMapTimeData = {
      start_time: '2024-01-10',
      end_time: '2024-02-10',
    };
    AddHeatMap(map, getTimeHouseHeatMap, params);
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
      width: 67%;
      height: 100%;
    }

    .pie-container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 33%;
      height: 100%;
      padding: 16px;
      padding-left: 0px;
    }
  }

  .time-picker {
    width: 100px;
    height: 100px;
  }
</style>
