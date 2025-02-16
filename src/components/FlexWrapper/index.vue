<template>
  <div class="flex-box-wrap">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  // import { computed, defineProps } from 'vue';
  //
  // const props = defineProps({
  //   gap: {
  //     type: Number || String,
  //     default: 10,
  //   },
  // });
  // const style = computed(() => {
  //   if (typeof props.gap === 'number') {
  //     return {
  //       // grid布局属性，设置各元素上下左右间距
  //       gap: `${props.gap}px`,
  //     };
  //   }
  //   if (typeof props.gap === 'string') {
  //     return {
  //       gap: props.gap,
  //     };
  //   } else {
  //     return {
  //       gap: '15px',
  //     };
  //   }
  // });
</script>

<style scoped>
  .flex-box-wrap {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-content: space-around;
    gap: 15px;
  }
</style>
