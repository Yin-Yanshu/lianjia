<template>
  <div class="house-list-panel">
    <div class="left-item left-list-title">
      <!--      <h4>可视区域内找到{{ houseCount }}套房子</h4>-->
      <CaretDownOutlined
        :class="{ rotate: _isListShow }"
        class="arrow"
        @click="_isListShow = !_isListShow"
      />
    </div>
    <div class="left-item" :class="_isListShow ? 'left-list-dropdown' : 'left-list-dropup'">
      <List
        class="left-list"
        :data-source="houseList"
        item-layout="vertical"
        :pagination="pagination"
      >
        <template #renderItem="{ item }">
          <ListItem @click="handleListItemClick(item)">
            <ListItemMeta>
              <template #title>
                {{ item.title }}
              </template>
              <template #description>
                <div>{{ item.house_type }}</div>
                <div>{{ item.price }}元/月</div>
              </template>
            </ListItemMeta>

            <template #extra>
              <img width="60" alt="logo" src="/resource/img/lianjia_logo.png" />
              <!-- <img width="60" alt="logo" :src="`${staticUrl}/${item.overview_path}`" /> -->
            </template>
          </ListItem>
        </template>
      </List>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { List, ListItem, ListItemMeta } from 'ant-design-vue';
  import { CaretDownOutlined } from '@ant-design/icons-vue';
  import { onMounted, ref, watch } from 'vue';
  import { useMapStore } from '/@/store/modules/map';

  const mapStore = useMapStore();

  const props = defineProps({
    mapName: {
      type: String,
      required: true,
    },
    isListShow: {
      type: Boolean,
      required: true,
    },
    houseList: {
      type: Array,
      required: true,
    },
  });

  const pagination = {
    pageSize: 4,
  };

  let map;
  onMounted(async () => {
    map = await mapStore.getMap(props.mapName);
  });

  const _isListShow = ref(props.isListShow);
  watch(
    () => props.houseList,
    (newValue) => {
      if (newValue) {
        _isListShow.value = true;
      }
    },
  );

  function handleListItemClick(item) {
    map.getView().animate({
      center: [item.wgs84_lng, item.wgs84_lat],
      duration: 1000,
    });
  }
</script>

<style scoped>
  .left-item {
    background-color: #fff;
    width: 100%;

    .arrow {
      transition: transform 0.3s linear;
    }

    .rotate {
      transform: rotate(180deg);
      transition: transform 0.3s linear;
    }
  }

  .left-list-title {
    height: 40px;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .left-list {
    padding: 20px;
    height: 100%;
  }

  .left-list-dropdown {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    overflow: hidden;
    display: block;
    animation: movein 1s;
  }

  .left-list-dropup {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    overflow: hidden;
    display: none;
    animation: moveout 1s;
  }

  /* 进入动画 */
  @keyframes movein {
    0% {
      max-height: 0px;
    }
    100% {
      max-height: 600px;
    }
  }

  @keyframes moveout {
    0% {
      max-height: 600px;
      display: block;
    }
    100% {
      max-height: 0px;
      display: block;
    }
  }
</style>
