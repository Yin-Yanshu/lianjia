<template>
  <div class="single-wrapper-container">
    <div class="single-wrapper-button-container">
      <div v-for="(componentInfo, index) in props.componentsInfo" :key="componentInfo.name">
        <a-button
          :class="{ 'active-button': index === buttonIndex }"
          @click="changeActiveComponent(componentInfo.name, index)"
          >{{ componentInfo.name }}
        </a-button>
      </div>
    </div>

    <div class="single-wrapper-dynamic-components-container">
      <component
        v-if="isShouldDynamicComponent"
        :is="currentComponentInfo.component"
        v-bind="currentComponentInfo.props || {}"
        v-on="currentComponentInfo.listeners || {}"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  interface ComponentsInfo {
    name: string;
    component: any;
    props?: any;
    listeners?: any;
  }

  // 定义接收父组件传递的组件数组的 props
  const props = defineProps({
    componentsInfo: {
      type: Array as () => ComponentsInfo[],
      required: true,
    },
  });

  // 定义当前显示组件的索引，初始为 0
  const currentIndex = ref(0);
  const buttonIndex = ref<number | undefined>(undefined);
  // 计算当前要显示的组件
  const currentComponentInfo = computed(() => props.componentsInfo[currentIndex.value]);

  const isShouldDynamicComponent = ref(false);
  const changeActiveComponent = (componentName: string, index: number) => {
    if (componentName === currentComponentInfo.value.name && index === buttonIndex.value) {
      isShouldDynamicComponent.value = !isShouldDynamicComponent.value;
      currentIndex.value = 0;
      buttonIndex.value = undefined;
      return;
    }
    isShouldDynamicComponent.value = true;
    props.componentsInfo.forEach((item, _index) => {
      if (item.name === componentName) {
        currentIndex.value = _index;
        buttonIndex.value = index;
      }
    });
  };
</script>

<style scoped lang="less">
  .single-wrapper-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 100px;

    .single-wrapper-button-container {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .ant-btn {
        height: 40px;
        border-radius: 8px;
      }

      .ant-btn.active-button,
      .ant-btn.active-button:focus {
        color: #fff;
        background-color: rgb(9, 96, 189);
      }

      :deep(.ant-btn:focus) {
        color: inherit;
        border-color: transparent;
      }
    }

    .single-wrapper-dynamic-components-container {
      width: 100%;
    }
  }
</style>
