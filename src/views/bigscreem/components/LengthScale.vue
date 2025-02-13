<template>
  <div class="down">
    <img src="/resource/svg/line.svg" /><span>{{ length }}km</span
    ><img src="/resource/svg/line.svg" />
  </div>
</template>

<script setup lang="ts">
  import { Map } from 'ol';
  import { getDistance } from 'ol/sphere';
  import { onMounted, ref } from 'vue';
  import { getMap } from '/@/store/modules/map';

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
  });

  const length = ref();
  onMounted(() => {
    setTimeout(() => {
      const map = getMap(props.mapName);
      if (map) {
        addLengthScale(map);
      }
    }, 1000);
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
  .down {
    position: absolute;
    bottom: 0;
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
</style>
