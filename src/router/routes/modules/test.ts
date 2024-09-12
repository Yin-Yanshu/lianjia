import type { AppRouteModule } from '/@/router/types';

import { t } from '/@/hooks/web/useI18n';
import { LAYOUT } from '/@/router/constant';

const test: AppRouteModule = {
  path: '/test',
  name: 'Test',
  component: LAYOUT,
  redirect: '/test/spherephoto',
  meta: {
    orderNo: 10,
    icon: 'ion:grid-outline',
    title: t('routes.dashboard.test'),
  },
  children: [
    {
      path: 'spherephoto',
      name: 'Spherephoto',
      component: () => import('/@/views/test/test-spherephoto/index.vue'),
      meta: {
        title: t('routes.dashboard.spherephoto'),
      },
    },
    {
      path: 'pathplaning',
      name: 'Pathplaning',
      component: () => import('/@/views/test/test-pathplaning/index.vue'),
      meta: {
        title: t('routes.dashboard.pathplaning'),
      },
    },
  ],
};

export default test;
