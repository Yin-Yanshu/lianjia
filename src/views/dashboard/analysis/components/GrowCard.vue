<template>
  <div class="md:flex">
    <template v-for="(item, index) in growCardList" :key="item.title">
      <Card
        size="small"
        :loading="loading"
        :title="item.title"
        class="md:w-1/3 w-full !md:mt-0 !mt-4"
        :class="[index + 1 < 4 && '!md:mr-4']"
        :canExpan="false"
      >
        <template #extra>
          <Tag :color="item.color">{{ item.action }}</Tag>
        </template>

        <div class="py-4 px-4 flex justify-between">
          <CountTo prefix="$" :startVal="1" :endVal="item.value" class="text-2xl" />
          <Icon :icon="item.icon" :size="40" />
        </div>
      </Card>
    </template>
  </div>
</template>
<script lang="ts" setup>
  import { Card, Tag } from 'ant-design-vue';
  import { growCardList } from '../data';
  import { CountTo } from '/@/components/CountTo/index';
  import { Icon } from '/@/components/Icon';

  defineProps({
    loading: {
      type: Boolean,
    },
  });
</script>
