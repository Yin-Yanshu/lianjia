<template>
  <div id="viewer"></div>
</template>

<script setup lang="ts">
  import { Viewer } from 'photo-sphere-viewer';
  import { CubemapAdapter } from 'photo-sphere-viewer/dist/adapters/cubemap';
  import { MarkersPlugin } from 'photo-sphere-viewer/dist/plugins/markers';
  import { VirtualTourPlugin } from 'photo-sphere-viewer/dist/plugins/virtual-tour.js';
  import 'photo-sphere-viewer/dist/photo-sphere-viewer.css';
  import { onMounted } from 'vue';
  import { getVRHouse } from '/@/api/point';

  let viewer;
  onMounted(() => {
    initViewer();
  });

  const response = {
    firstView: {
      left: 'public/resource/img/360vr/d129acb2-06c6-4ae9-8323-8139abc4dc0.jpg',
      front: 'public/resource/img/360vr/6c86b35c-aad4-4f7e-9316-871c66b3f99.jpg',
      right: 'public/resource/img/360vr/055a708e-5a6b-404e-9252-9a45cef9fe5.jpg',
      back: 'public/resource/img/360vr/02e887af-38d4-4882-80ea-5d3cd60c8371.jpg',
      top: 'public/resource/img/360vr/1c255a32-4e25-432e-b112-acd7a823889.jpg',
      bottom: 'public/resource/img/360vr/b1be3c02-5534-47e1-8a9c-b9d403e37f5.jpg',
    },
    viewList: {
      viewId: {
        left: 'public/resource/img/360vr/d129acb2-06c6-4ae9-8323-8139abc4dc0.jpg',
        front: 'public/resource/img/360vr/6c86b35c-aad4-4f7e-9316-871c66b3f99.jpg',
        right: 'public/resource/img/360vr/055a708e-5a6b-404e-9252-9a45cef9fe5.jpg',
        back: 'public/resource/img/360vr/02e887af-38d4-4882-80ea-5d3cd60c8371.jpg',
        top: 'public/resource/img/360vr/1c255a32-4e25-432e-b112-acd7a823889.jpg',
        bottom: 'public/resource/img/360vr/b1be3c02-5534-47e1-8a9c-b9d403e37f5.jpg',
      },
      viewId2: {
        left: 'public/resource/img/360vr/cd3a6237-ea51-454a-8372-c3e448604110.jpg',
        front: 'public/resource/img/360vr/d0d9ed6e-26aa-4b74-bbd8-f86afea87ac3.jpg',
        right: 'public/resource/img/360vr/62bc9a9b-5295-4176-b814-7ad0d5d95447.jpg',
        back: 'public/resource/img/360vr/d634dcd1-f9f2-46a4-84c4-8a315856e02b.jpg',
        top: 'public/resource/img/360vr/8f6ae28c-917a-49e8-a513-475cfcfa7004.jpg',
        bottom: 'public/resource/img/360vr/92be44b2-7374-4dad-baea-b3bd12d4270d.jpg',
      },
    },
    markerList: [
      {
        id: 'viewId',
        longitude: 0.6,
        latitude: 0,
        image: 'public/resource/svg/subway.svg',
        width: 200,
        height: 200,
        anchor: 'bottom center',
      },
      {
        id: 'viewId2',
        longitude: 0,
        latitude: 0,
        image: 'public/resource/svg/bus.svg',
        width: 200,
        height: 200,
        anchor: 'bottom center',
      },
    ],
  };
  function initViewer() {
    viewer = new Viewer({
      container: 'viewer',
      adapter: CubemapAdapter,
      plugins: [
        MarkersPlugin,
        [
          VirtualTourPlugin,
          {
            positionMode: VirtualTourPlugin.MODE_GPS,
            renderMode: VirtualTourPlugin.MODE_3D,
          },
        ],
      ],
      panorama: response.firstView,
    });
    initMarkers(response.markerList);
    initVirtualTour();

    viewer.on('click', function (e) {
      console.log('e', e);
    });
  }

  function initMarkers(markerList) {
    const markersPlugin = viewer.getPlugin(MarkersPlugin);
    markerList.forEach((marker) => {
      markersPlugin.addMarker(marker);
    });
    markersPlugin.on('select-marker', (data) => {
      const viewId = data.args[0].config.id;
      const panorama = response.viewList[viewId];
      viewer.setPanorama(panorama);
    });
  }

  // 使用json转字符串存储view对象
  const test = [
    {
      id: '1',
      panorama: {
        left: 'public/resource/img/360vr/d129acb2-06c6-4ae9-8323-8139abc4dc0.jpg',
        front: 'public/resource/img/360vr/6c86b35c-aad4-4f7e-9316-871c66b3f99.jpg',
        right: 'public/resource/img/360vr/055a708e-5a6b-404e-9252-9a45cef9fe5.jpg',
        back: 'public/resource/img/360vr/02e887af-38d4-4882-80ea-5d3cd60c8371.jpg',
        top: 'public/resource/img/360vr/1c255a32-4e25-432e-b112-acd7a823889.jpg',
        bottom: 'public/resource/img/360vr/b1be3c02-5534-47e1-8a9c-b9d403e37f5.jpg',
      },
      name: '进门',
      links: [{ nodeId: '2' }, { nodeId: '3' }],
      position: [-90, 0],
    },
    {
      id: '2',
      panorama: {
        left: 'public/resource/img/360vr/cd3a6237-ea51-454a-8372-c3e448604110.jpg',
        front: 'public/resource/img/360vr/d0d9ed6e-26aa-4b74-bbd8-f86afea87ac3.jpg',
        right: 'public/resource/img/360vr/62bc9a9b-5295-4176-b814-7ad0d5d95447.jpg',
        back: 'public/resource/img/360vr/d634dcd1-f9f2-46a4-84c4-8a315856e02b.jpg',
        top: 'public/resource/img/360vr/8f6ae28c-917a-49e8-a513-475cfcfa7004.jpg',
        bottom: 'public/resource/img/360vr/92be44b2-7374-4dad-baea-b3bd12d4270d.jpg',
      },
      name: '浴室',
      links: [{ nodeId: '1' }],
      position: [90, 0],
    },
  ];
  function initVirtualTour() {
    // response = getVRHouse(properties.roomId);
    const virtualTour = viewer.getPlugin(VirtualTourPlugin);
    virtualTour.setNodes(
      [
        {
          id: '1',
          panorama: {
            left: 'public/resource/img/360vr/d129acb2-06c6-4ae9-8323-8139abc4dc0.jpg',
            front: 'public/resource/img/360vr/6c86b35c-aad4-4f7e-9316-871c66b3f99.jpg',
            right: 'public/resource/img/360vr/055a708e-5a6b-404e-9252-9a45cef9fe5.jpg',
            back: 'public/resource/img/360vr/02e887af-38d4-4882-80ea-5d3cd60c8371.jpg',
            top: 'public/resource/img/360vr/1c255a32-4e25-432e-b112-acd7a823889.jpg',
            bottom: 'public/resource/img/360vr/b1be3c02-5534-47e1-8a9c-b9d403e37f5.jpg',
          },
          name: '进门',
          // links: [
          //   {
          //     nodeId: '2',
          //     position: { textureX: 1500, textureY: 780 },
          //   },
          // ],
          links: [{ nodeId: '2' }],
          position: [0, 0],
          // position: [-100.156479, 210.666725, 3],
          // panoData: { poseHeading: 0 },
        },
        {
          id: '2',
          panorama: {
            left: 'public/resource/img/360vr/cd3a6237-ea51-454a-8372-c3e448604110.jpg',
            front: 'public/resource/img/360vr/d0d9ed6e-26aa-4b74-bbd8-f86afea87ac3.jpg',
            right: 'public/resource/img/360vr/62bc9a9b-5295-4176-b814-7ad0d5d95447.jpg',
            back: 'public/resource/img/360vr/d634dcd1-f9f2-46a4-84c4-8a315856e02b.jpg',
            top: 'public/resource/img/360vr/8f6ae28c-917a-49e8-a513-475cfcfa7004.jpg',
            bottom: 'public/resource/img/360vr/92be44b2-7374-4dad-baea-b3bd12d4270d.jpg',
          },
          name: '浴室',
          links: [{ nodeId: '1', position: { textureX: 1500, textureY: 780 } }],
          // position: [90, 0],
          // position: [-80.156168, -25.666623, 3],
          // panoData: { poseHeading: 358 },
        },
      ],
      '1',
    );
  }
</script>

<style scoped>
  #viewer {
    width: 100%;
    height: 100%;
  }
</style>
