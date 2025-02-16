<template>
  <div class="length-scale-container">
    <img src="/resource/svg/line.svg" /><span>{{ length }}km</span
    ><img src="/resource/svg/line.svg" />
  </div>
</template>

<script setup lang="ts">
  import { Map } from 'ol';
  import { getDistance } from 'ol/sphere';
  import { onMounted, ref } from 'vue';
  import { useMapStore } from '/@/store/modules/map';

  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });

  const length = ref();

  let map;
  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
    addLengthScale(map);
  });

  function addLengthScale(map: Map) {
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
</script>

<style scoped>
  .length-scale-container {
    width: 100%;
    display: flex;
    justify-content: center;

    img {
      width: 50%;
    }

    span {
      font-size: 20px;
    }
  }
</style>
