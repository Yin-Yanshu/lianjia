<template>
  <div>
    <Form class="middle-item-leaseform" v-if="filterOption === 'huxing'">
      <FormItem>
        <CheckboxGroup v-model:value="room_number">
          <Checkbox :value="0">一室</Checkbox>
          <Checkbox :value="1">两室</Checkbox>
          <Checkbox :value="2">三室</Checkbox>
          <Checkbox :value="3">四室+</Checkbox>
        </CheckboxGroup>
      </FormItem>
      <FormItem>
        <Button @click="handleResetParams('room_number')">重置</Button>
        <Button @click="handleUpdateParams">确认</Button>
      </FormItem>
    </Form>

    <Form class="middle-item-priceform" v-if="filterOption === 'zujin'">
      <FormItem>
        <Slider v-model:value="priceSliderValue" range :min="0" :max="9000" />
      </FormItem>
      <FormItem>
        <Button @click="handleResetParams(['price_min', 'price_max'])">重置</Button>
        <Button @click="handleUpdateParams">确认</Button>
      </FormItem>
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { Button, Checkbox, CheckboxGroup, Form, FormItem, Slider } from 'ant-design-vue';
  import { ref, watch } from 'vue';
  import { OptionData } from '/@/api/point';
  import { useApiStore } from '/@/store/modules/api';

  const apiStore = useApiStore();

  defineProps({
    filterOption: {
      type: String,
      default: 'huxing',
    },
  });

  // 过滤器选项
  let option: OptionData = {};
  const room_number = ref([]);
  const priceSliderValue = ref<[number, number]>([2000, 5000]);

  watch(room_number, (newValue) => {
    if (newValue) {
      option.room_number = newValue;
    }
  });
  watch(priceSliderValue, (newValue) => {
    if (newValue) {
      option.price_min = newValue[0];
      option.price_max = newValue[1];
    }
  });

  function handleUpdateParams() {
    apiStore.updateFilterParams(option);
  }

  function handleResetParams(resetOption) {
    apiStore.resetFilterParams(resetOption);
  }
</script>

<style scoped></style>
