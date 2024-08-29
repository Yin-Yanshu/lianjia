import { defHttp } from '/@/utils/http/axios';

export const getCardList = (data) => {
  return defHttp.post({
    url: '/heatmap',
    data: {
      ...data,
    },
  });
};
