<template>
  <Card title="成交户型占比" :loading="loading">
    <div ref="chartRef" :style="{ width, height }"></div>
  </Card>
</template>
<script lang="ts" setup>
  import { Card } from 'ant-design-vue';
  import { Ref, ref, watch } from 'vue';
  import { useECharts } from '/@/hooks/web/useECharts';

  const props = defineProps({
    loading: Boolean,
    width: {
      type: String as PropType<string>,
      default: '100%',
    },
    height: {
      type: String as PropType<string>,
      default: '220px',
    },
  });

  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);
  watch(
    () => props.loading,
    () => {
      if (props.loading) {
        return;
      }
      setOptions({
        tooltip: {
          trigger: 'item',
        },

        series: [
          {
            name: '成交价格分布',
            type: 'pie',
            radius: '80%',
            center: ['50%', '50%'],
            color: ['#75bedc', '#ef6567', '#91cd77', '#f9c956'],
            data: [
              { value: 400, name: '1k-2k' },
              { value: 610, name: '2k-3k' },
              { value: 574, name: '3k-4k' },
              { value: 400, name: '4k及以上' },
            ].sort(function (a, b) {
              return a.value - b.value;
            }),
            roseType: 'radius',
            animationType: 'scale',
            animationEasing: 'exponentialInOut',
            animationDelay: function () {
              return Math.random() * 400;
            },
          },
        ],
      });
    },
    { immediate: true },
  );
</script>
