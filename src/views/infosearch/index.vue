<template>
  <div>
    <div class="filter-container">
      <div class="filter-option">
        <span>类型 </span>
        <a-radio-group v-model:value="houseType">
          <a-radio-button value="a">不限</a-radio-button>
          <a-radio-button value="b">整租</a-radio-button>
          <a-radio-button value="c">合租</a-radio-button>
        </a-radio-group>
      </div>
      <div class="filter-option">
        <span>租金 </span>
        <a-radio-group v-model:value="leasePrice">
          <a-radio-button value="a">不限</a-radio-button>
          <a-radio-button value="b">1000元以下</a-radio-button>
          <a-radio-button value="c">1000-1500元</a-radio-button>
          <a-radio-button value="d">1500-2000元</a-radio-button>
          <a-radio-button value="e">2000-2500元</a-radio-button>
          <a-radio-button value="f">2500元以上</a-radio-button>
        </a-radio-group>
      </div>
      <div class="filter-option">
        <span>朝向 </span>
        <a-radio-group v-model:value="houseFacing">
          <a-radio-button value="a">东</a-radio-button>
          <a-radio-button value="b">南</a-radio-button>
          <a-radio-button value="c">西</a-radio-button>
          <a-radio-button value="d">北</a-radio-button>
        </a-radio-group>
      </div>
      <div class="filter-option">
        <span>户型 </span>
        <a-radio-group v-model:value="roomNumber">
          <a-radio-button value="a">一居室</a-radio-button>
          <a-radio-button value="b">两居室</a-radio-button>
          <a-radio-button value="c">三居室</a-radio-button>
          <a-radio-button value="d">四居室+</a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <List class="search-list" item-layout="vertical" :data-source="houseList">
      <template #renderItem="{ item }">
        <ListItem>
          <ListItemMeta>
            <template #title>
              {{ item.title }}
            </template>
            <template #description>
              <div>{{ item.house_type }}</div>
              <Tag color="pink">{{ item.house_type }}</Tag>
              <Tag color="blue">{{ item.price }}元/月</Tag>
            </template>
          </ListItemMeta>

          <template #extra>
            <img width="60" alt="logo" src="/resource/img/lianjia_logo.png" />
          </template>
        </ListItem>
      </template>
    </List>
  </div>
</template>

<script setup lang="ts">
  import { OptionData, getHouseList, getPlotsInCircle } from '../../api/point';
  import { List, ListItem, ListItemMeta, Tag } from 'ant-design-vue';
  import { onMounted, ref } from 'vue';

  const houseType = ref();
  const leasePrice = ref();
  const houseFacing = ref();
  const roomNumber = ref();

  // TODO 继续功能开发
  const houseList = ref();
  const filterOptions = ref<OptionData>({});
  async function getHouseListInfo() {
    // const response = await getHouseList(filterOptions.value);
    let param = {
      latitude: 31.225833,
      longitude: 121.464277,
      radius: 0.01,
    };
    const response = await getPlotsInCircle(param);
    houseList.value = [...response.data.houseList];
  }

  onMounted(() => {
    getHouseListInfo();
  });
</script>

<style scoped>
  .filter-container {
    background-color: #fff;
    margin-bottom: 2vh;

    .filter-option {
      height: 6vh;
    }
  }

  .search-list {
    width: 40%;
    background-color: #fff;

    ::v-deep(.ant-list-item-extra, .ant-list-item-main) {
      margin: 20px;
    }
  }
</style>
