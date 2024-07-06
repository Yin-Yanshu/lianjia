import type { AppRouteModule } from '/@/router/types';

import { LAYOUT } from '/@/router/constant';
import { t } from '/@/hooks/web/useI18n';

const dashboard: AppRouteModule = {
  path: '/bigcsreem',
  name: 'Bigcsreem',
  component: LAYOUT,
  redirect: '/bigcsreem/index',
  meta: {
    hideChildrenInMenu: true,
    icon: 'simple-icons:about-dot-me',
    title: t('routes.dashboard.bigscreem'),
    orderNo: 100000,
  },
  children: [
    {
      path: 'index',
      name: 'BigcsreemPage',
      component: () => import('/@/views/bigscreem/index.vue'),
      meta: {
        title: t('routes.dashboard.bigscreem'),
        icon: 'simple-icons:about-dot-me',
        hideMenu: true,
      },
    },
  ],
};

export default dashboard;
