<template>
  <div class="wrapper">
    <div class="info-panel">
      <div class="photo-container">
        <img class="vricon" src="/resource/svg/360.svg" @click="onImageClick" />
        <a-carousel class="image-carousel">
          <img src="/resource/img/lianjia_logo.png" alt="照片" />
          <img src="/resource/img/lianjia_logo.png" alt="照片" />
          <img src="/resource/img/lianjia_logo.png" alt="照片" />
        </a-carousel>
      </div>
      <div class="detail-info-container">
        <div class="detail-info-container-item-title">自如整租·都市公社·1居室</div>
        <div class="detail-info-container-item-content">
          <div class="detail-info-container-item-content-price">
            <div>￥2790/月(季付价)</div>
          </div>
          <a-divider />
          <div class="detail-info-container-item-content-tag">
            <a-tag>Tag 1</a-tag>
            <a-tag>Tag 1</a-tag>
            <a-tag>Tag 1</a-tag>
          </div>
          <a-divider />
          <div class="detail-info-container-item-content-table">
            <a-row>
              <a-col :span="6">
                <div class="detail-info-container-item-content-table-title">建筑面积</div>
                <div class="detail-info-container-item-content-table-context">56.4m2</div>
              </a-col>
              <a-col :span="6">
                <div class="detail-info-container-item-content-table-title">类型</div>
                <div class="detail-info-container-item-content-table-context">普通住宅/公寓</div>
              </a-col>
              <a-col :span="6">
                <div class="detail-info-container-item-content-table-title">楼层</div>
                <div class="detail-info-container-item-content-table-context">12/32层</div>
              </a-col>
              <a-col :span="6">
                <div class="detail-info-container-item-content-table-title">朝向</div>
                <div class="detail-info-container-item-content-table-context">南</div>
              </a-col>
            </a-row>
          </div>
          <a-divider />
        </div>
      </div>
    </div>
    <div class="map-panel">
      <div id="detail-info-map-container"></div>
      <div class="option-container">
        <SingleActiveWrapper :components-info="componentList" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { RouteRecordRaw, useRoute, useRouter } from 'vue-router';
  import { onMounted, ref } from 'vue';
  import { LAYOUT } from '/@/router/constant';
  import { useMapStore } from '/@/store/modules/map';
  import SingleActiveWrapper from '/@/components/SingleActiveWrapper/index.vue';
  import PathPlaningPanel from '/@/views/bigscreem/components/PathPlaningPanel.vue';
  import NearBySearch from '/@/views/infosearch/components/NearBySearch.vue';
  import { Map } from 'ol';
  import { getHouseDetailByHouseId } from '/@/api/common';

  const mapStore = useMapStore();

  const router = useRouter();
  const route = useRoute();

  const mapName = ref('detailInfoMapContainer');
  const componentList = [
    {
      name: '上班通勤',
      component: PathPlaningPanel,
      props: {
        mapName: mapName.value,
      },
    },
    {
      name: '周边配套',
      component: NearBySearch,
      props: {
        mapName: mapName.value,
      },
    },
  ];

  function onImageClick() {
    router.replace({ name: '360View', params: { pageId: 123 } });
  }

  let map: Map;
  const longitude = ref(0);
  const latitude = ref(0);
  let houseId;
  let result;
  onMounted(async () => {
    const routeParam = {
      path: '/360view',
      name: '360View',
      component: LAYOUT,
      redirect: '/360View/index',
      meta: {
        hideChildrenInMenu: true,
        icon: 'ant-design:fund-outlined',
        title: '360看房',
        orderNo: 100000,
      },
      children: [
        {
          path: 'index',
          name: '360ViewPage',
          component: () => import('/@/views/infosearch/components/360view.vue'),
          meta: {
            title: '360看房',
            icon: 'simple-icons:about-dot-me',
            hideMenu: true,
          },
        },
      ],
    };
    router.addRoute(routeParam as unknown as RouteRecordRaw);
    map = mapStore.addMap('detail-info-map-container', 'detailInfoMapContainer');

    houseId = Number(route.query.houseId);
    // TODO 无法获取到route参数
    // console.log('houseId', houseId);
    // result = await getHouseDetailByHouseId('5db641bb-833a-4bca-b7cc-e2f7df18925b');

    // TODO 网络请求获取houseId详细信息，照片路径，房屋详细信息，360vr照片路径
    // 感觉360vr照片路径需要分表存储，但连表查询还不会
    // map.getView().setCenter([longitude.value, latitude.value]);
    // map.getView().setZoom(15);
  });
</script>

<style scoped>
  .info-panel {
    width: 80%;
    display: flex;
    justify-content: space-around;
    margin: 1vw auto;
    background-color: #ffffff;
    border-radius: 10px;

    .photo-container {
      width: 50%;
      height: 100%;
      position: relative;

      .vricon {
        position: absolute;
        top: 4vh;
        left: 2vh;
        width: 30px;
        height: 30px;
        z-index: 1;
        transition: transform 0.3s ease;
      }

      .vricon:hover {
        cursor: pointer;
        transform: scale(1.2);
      }

      .image-carousel {
        padding-top: 1vw;
        padding-bottom: 1vw;
      }
    }

    .detail-info-container {
      width: 40%;
      height: 100%;
      margin: 0 1vw;

      .detail-info-container-item-title {
        font-size: 2vw;
        font-weight: bold;
        margin: 1vw 0;
      }

      .detail-info-container-item-content-price {
        font-size: 2vw;
        color: rgb(0, 182, 97);
      }

      :deep(.ant-tag) {
        font-size: 20px;
        margin-right: 15px;
        padding: 5px;
      }

      .detail-info-container-item-content-table-title {
        font-size: 1.2vw;
        color: rgb(163, 164, 163);
      }

      .detail-info-container-item-content-table-context {
        font-size: 1.5vw;
      }
    }
  }

  .map-panel {
    width: 80%;
    height: 70vh;
    margin: 1vw auto;
    padding: 1vw;
    position: relative;
    border-radius: 10px;
    background-color: #ffffff;

    #detail-info-map-container {
      width: 100%;
      height: 100%;
    }

    .option-container {
      position: absolute;
      width: 24vw;
      top: 1vw;
      right: 1vw;
    }
  }
</style>
