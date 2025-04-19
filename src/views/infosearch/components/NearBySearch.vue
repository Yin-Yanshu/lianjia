<template>
  <div class="nearby-wrapper">
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane v-for="item in tabPaneList" :key="item.key" :tab="item.tab">
        <a-list item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                description="Ant Design, a design language for background applications, is refined by Ant UED Team"
              >
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const activeKey = ref('transition');
  const tabPaneList = ref([
    {
      key: 'transition',
      tab: '交通',
    },
    {
      key: 'supermarket',
      tab: '商超',
    },
    {
      key: 'education',
      tab: '教育',
    },
    {
      key: 'restaurant',
      tab: '餐饮',
    },
  ]);
</script>

<style scoped>
  .nearby-wrapper {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    padding: 10px;
  }
</style>
