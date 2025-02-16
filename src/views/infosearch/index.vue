<template>
  <div>
    <div class="filter-container">
      <div class="filter-option">
        <span>类型 </span>
        <a-radio-group v-model:value="filterParam.lease_type">
          <a-radio-button value="0">不限</a-radio-button>
          <a-radio-button value="1">整租</a-radio-button>
          <a-radio-button value="2">合租</a-radio-button>
        </a-radio-group>
      </div>
      <div class="filter-option">
        <span>租金 </span>
        <a-radio-group v-model:value="filterParam.price_max">
          <a-radio-button value="0">不限</a-radio-button>
          <a-radio-button value="1">1000元以下</a-radio-button>
          <a-radio-button value="2">1000-2000元</a-radio-button>
          <a-radio-button value="3">2000-4000元</a-radio-button>
          <a-radio-button value="4">4000-6000元</a-radio-button>
          <a-radio-button value="5">6000元以上</a-radio-button>
        </a-radio-group>
      </div>
      <div class="filter-option">
        <span>朝向 </span>
        <a-radio-group v-model:value="filterParam.direction">
          <a-radio-button value="0">不限</a-radio-button>
          <a-radio-button value="东">东</a-radio-button>
          <a-radio-button value="南">南</a-radio-button>
          <a-radio-button value="西">西</a-radio-button>
          <a-radio-button value="北">北</a-radio-button>
        </a-radio-group>
      </div>
      <div class="filter-option">
        <span>户型 </span>
        <a-radio-group v-model:value="filterParam.room_number">
          <a-radio-button value="0">不限</a-radio-button>
          <a-radio-button value="1">一居室</a-radio-button>
          <a-radio-button value="2">两居室</a-radio-button>
          <a-radio-button value="3">三居室</a-radio-button>
          <a-radio-button value="4">四居室+</a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <FlexWrap style="margin: 2vh">
      <div v-for="(item, index) in houseList" :key="index" style="width: 24%">
        <a-card hoverable style="border-radius: 1vh">
          <img style="margin-bottom: 15px" src="/resource/img/lianjia_logo.png" alt="图片缺失" />
          <a-card-meta :title="item.title">
            <template #description>
              <div>{{ item.house_type }}</div>
              <Tag color="pink">{{ item.house_type }}</Tag>
              <Tag color="blue">{{ item.price }}元/月</Tag>
            </template>
          </a-card-meta>
        </a-card>
      </div>
    </FlexWrap>
    <a-pagination default-current="1" :total="500" @change="onPageChange" />
  </div>
</template>

<script setup lang="ts">
  import { getFilterHouseList, getPlotsInCircle, OptionData } from '../../api/point';
  import { Tag } from 'ant-design-vue';
  import { onMounted, reactive, ref, watch } from 'vue';
  import FlexWrap from '/src/components/FlexWrapper/index.vue';

  const filterParam = reactive({
    lease_type: '0',
    price_max: '0',
    direction: '0',
    room_number: '0',
  });
  watch(
    filterParam,
    (newVal) => {
      const filterOptions: OptionData = {
        lease_type: newVal.lease_type,
        price_max: Number(newVal.price_max),
        direction: [newVal.direction],
        room_number: [Number(newVal.room_number)],
      };
      searchFilter(filterOptions);
    },
    { deep: true },
  );

  interface HouseList {
    title: string;
    price: string;
    lease_type: string;
    floor: string;
    direction: string;
    subway: string;
    plot: string;
    build_type: string;
    house_type: string;
    area: string;
  }

  // TODO 继续功能开发
  const houseList = ref<HouseList[]>();

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

  async function searchFilter(param: OptionData) {
    const response = await getFilterHouseList(param);
    houseList.value = [...response.data.houseList];
  }

  const currentPage = ref(1);

  async function onPageChange() {
    const param: OptionData = {
      lease_type: filterParam.lease_type,
      direction: [filterParam.direction],
      price_min: Number(filterParam.price_max),
      price_max: Number(filterParam.price_max),
      room_number: [Number(filterParam.room_number)],
      pagination: {
        page: currentPage.value,
        page_size: 20,
      },
    };
    const response = await getFilterHouseList(param);
    houseList.value = [...response.data.houseList];
  }

  onMounted(() => {
    getHouseListInfo();
  });
</script>

<style scoped>
  .filter-container {
    background-color: #fff;
    margin: 2vh;
    border-radius: 10px;

    .filter-option {
      display: flex;
      align-items: flex-start;
      height: 100%; /* 确保容器有高度 */
      padding: 10px;

      span {
        margin-right: 20px;
      }
    }
  }

  .search-list {
    width: 40%;
    background-color: #fff;
    margin: 0 auto;

    ::v-deep(.ant-list-item-extra, .ant-list-item-main) {
      margin: 20px;
    }
  }
</style>
