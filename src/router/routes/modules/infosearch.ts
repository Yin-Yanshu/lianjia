import type { AppRouteModule } from '/@/router/types';

import { LAYOUT } from '/@/router/constant';

const infosearch: AppRouteModule = {
  path: '/infosearch',
  name: 'Infosearch',
  component: LAYOUT,
  redirect: '/infosearch/index',
  meta: {
    hideChildrenInMenu: true,
    icon: 'ant-design:search-outlined',
    title: '信息查询',
    orderNo: 100000,
  },
  children: [
    {
      path: 'index',
      name: 'InfosearchPage',
      component: () => import('/@/views/infosearch/index.vue'),
      meta: {
        title: '信息查询',
        hideMenu: true,
      },
    },
  ],
};

export default infosearch;
