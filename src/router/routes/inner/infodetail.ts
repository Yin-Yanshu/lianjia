import type { AppRouteModule } from '/@/router/types';

import { LAYOUT } from '/@/router/constant';
import { RouteRecordRaw } from 'vue-router';
import { router } from '/@/router';

const infoDetail: AppRouteModule = {
  path: '/infodetail',
  name: 'InfoDetail',
  component: LAYOUT,
  redirect: '/infodetail/index',
  meta: {
    hideChildrenInMenu: true,
    icon: 'ant-design:fund-outlined',
    title: '360看房',
    orderNo: 100000,
  },
  children: [
    {
      path: 'index',
      name: 'InfoDetailPage',
      component: () => import('/src/views/infosearch/components/InfoDetail.vue'),
      meta: {
        title: '详细面板',
        icon: 'simple-icons:about-dot-me',
        hideMenu: true,
      },
    },
  ],
};

router.addRoute(infoDetail as unknown as RouteRecordRaw);
