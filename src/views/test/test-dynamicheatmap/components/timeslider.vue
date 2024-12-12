<template>
  <div class="dataNav">
    <button class="dataNavPrev" @click="navPrev">左</button>
    <ul class="dataNavList" ref="dataNavList">
      <li
        class="dataNavListItem"
        v-for="(item, index) in navList"
        :key="index"
        :style="{ transform: 'translateX(-' + move + 'px)' }"
        :class="{ 'highlight-item': step === parseInt(index) }"
        @click="setTimeStamp(index)"
        >{{ item }}</li
      >
    </ul>
    <button class="dataNavNext" @click="navNext">></button>
    <button class="start-stop" @click="emit('continueLoop', step)">开启</button>
  </div>
</template>

<script setup lang="ts">
  import { ref, toRefs, watch } from 'vue';
  // 自定义beforeButton nextButton事件
  const emit = defineEmits(['beforeButton', 'nextButton', 'continueLoop', 'parseLoop']);
  const props = defineProps({
    values: {
      type: Array,
      default: () => ['9-21', '9-22', '9-23', '9-24', '9-25', '9-26'], // 使用箭头函数返回数组
    },
    timeStamp: {
      type: ref<number>,
    },
  });
  const { values, timeStamp } = toRefs(props);

  let navList = values;
  let time = timeStamp;
  let move = ref(0);
  let step = ref(0);
  function navPrev() {
    // <0
    if (step.value <= 0) {
      step.value = 0;
      move.value = 0;
      emit('beforeButton', step.value);
      return;
    }
    // 0-2
    if (step.value >= 1 && step.value < 2) {
      step.value -= 1;
      emit('beforeButton', step.value);
      return;
    }
    // 中间过程
    if (step.value >= 2 && step.value < navList.value.length - 2) {
      step.value -= 1;
      move.value = move.value - 70;
      emit('beforeButton', step.value);
      return;
    }
    // n-2 -> n
    if (step.value >= navList.value.length - 2 && step.value < navList.value.length) {
      step.value -= 1;
      emit('beforeButton', step.value);
      return;
    }
  }
  function navNext() {
    // 0 -> 2
    if (step.value >= 0 && step.value < 2) {
      step.value += 1;
      emit('nextButton', step.value);
      return;
    }
    // 中间过程
    if (2 <= step.value && step.value < navList.value.length - 3) {
      step.value += 1;
      move.value = move.value + 70;
      emit('nextButton', step.value);
      return;
    }
    // n-2 -> n
    if (navList.value.length - 3 <= step.value && step.value < navList.value.length - 1) {
      step.value += 1;
      emit('nextButton', step.value);
      return;
    }
    // >n
    if (step.value >= navList.value.length - 1) {
      step.value = 0;
      move.value = 0;
      emit('nextButton', step.value);
      return;
    }
  }
  function setTimeStamp(time) {
    step.value = time;
    emit('nextButton', step.value);
    if (0 < time && time < 2) {
      move.value = 0;
    }
    if (2 <= time && time < navList.value.length - 3) {
      move.value = (step.value - 2) * 70;
    }
    if (navList.value.length - 3 <= time && time < navList.value.length - 1) {
      move.value = (navList.value.length - 5) * 70;
    }
  }
  watch(time, (_oldValue: number, _newValue: number) => {
    console.log('_newValue', _newValue);
    step.value = _newValue;
    if (0 <= step.value && step.value < 3) {
      move.value = 0;
    }
    if (3 <= step.value && step.value < navList.value.length - 3) {
      move.value = (step.value - 2) * 70;
    }
    if (navList.value.length - 3 <= step.value && step.value < navList.value.length - 1) {
      move.value = (navList.value.length - 5) * 70;
    }
  });
</script>

<style scoped>
  .dataNav {
    display: flex;
    height: 70px;
    /* width: 100%; */
    background-color: #fff;
    z-index: 10;

    .dataNavList {
      display: flex;
      overflow: hidden;
      width: 350px;
      /* width: 100%; */

      .dataNavListItem {
        display: inline-block;
        height: 35px;
        width: 70px;
        /* width: 20%; */
        min-width: 70px;
        margin: auto 0;
        border-radius: 5px;
        font-size: 13px;
        text-align: center;
        color: #7e8690;
        line-height: 35px;
        transition: transform 0.2s;
      }
      :hover {
        color: #1d4190;
        background-color: #c7cede;
        cursor: pointer;
      }
      .highlight-item {
        color: #1d4190;
        background-color: #c7cede;
        transition: transform 0.2s;
      }
    }

    .start-stop,
    .dataNavPrev,
    .dataNavNext {
      display: inline-block;
      width: 35px;
      min-width: 35px;
      height: 35px;
      margin: auto 0;
      border: none;
      border-radius: 5px;
      text-align: center;
      line-height: 35px;
      background-color: rgba(0, 0, 0, 0);
      &:focus {
        outline: none;
      }
      &:hover {
        color: #1d4190;
        background-color: #c7cede;
        cursor: pointer;
      }
    }
  }
</style>
