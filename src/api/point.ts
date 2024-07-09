import { defHttp } from '/@/utils/http/axios';

export const getPointInCircle = (data) => {
  return defHttp.post({
    url: '/plots/within-circle',
    data: {
      ...data,
    },
  });
};

export const getPlotsInPolygon = (data) => {
  return defHttp.post({
    url: '/plots/within-polygon',
    data: {
      ...data,
    },
  });
};

export const getPlotsInPolygonList = (data) => {
  return defHttp.post({
    url: '/plots/within-polygon-list',
    data: {
      ...data,
    },
  });
};

export const getPlotsInCircle = (data) => {
  return defHttp.post({
    url: '/plots/within-circle',
    data: {
      ...data,
    },
  });
};
