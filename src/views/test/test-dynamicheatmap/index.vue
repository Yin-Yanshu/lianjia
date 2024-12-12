<template>
  <div id="container">
    <div ref="calendarContainerRef" class="calendar-container"></div>
    <div ref="sliderContainerRef" class="slider-container"></div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import addMap from '/@/store/modules/map';
  import { Map } from 'ol';
  import { useDynamicHeatmap } from './dynamicheatmap';

  const calendarContainerRef = ref();
  const sliderContainerRef = ref();
  const params = {
    start_time: '2024-01-10',
    end_time: '2024-01-20',
  };
  let map: Map;
  onMounted(async () => {
    map = addMap('container', 'testDynamicHeatmap');
    const { addDynamicHeatMap, setCalenderContainer, setTimeSliderContainer } =
      useDynamicHeatmap(map);

    await addDynamicHeatMap(params);
    setCalenderContainer(calendarContainerRef.value);
    setTimeSliderContainer(sliderContainerRef.value);
  });
</script>

<style scoped>
  #container {
    height: 100%;
    width: 100%;
    position: relative;

    .calendar-container {
      width: 550px;
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 10;
    }
    .slider-container {
      position: absolute;
      top: 16px;
      left: 16px;
      /* width: 550px; */
      z-index: 10;
    }
  }
</style>
