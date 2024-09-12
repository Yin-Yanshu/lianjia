<template>
  <div id="viewer"></div>
</template>

<script setup lang="ts">
  import { Viewer } from 'photo-sphere-viewer';
  import 'photo-sphere-viewer/dist/photo-sphere-viewer.css';
  import { onMounted } from 'vue';

  onMounted(() => {
    new Viewer({
      container: 'viewer',
      panorama: 'public/resource/img/f4600718a16423a6c1e7440a1f0673fd.png',
    });
  });
</script>

<style scoped>
  #viewer {
    width: 100%;
    height: 100%;
  }
</style>
