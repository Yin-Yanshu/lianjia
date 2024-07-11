import { defHttp } from '/@/utils/http/axios';

export interface PointData {
  longitude: number;
  latitude: number;
}

export interface PolygonData {
  polygon: PointData[];
}

export interface PolygonListData {
  polygonList: PolygonData[];
}

export interface CircleData {
  latitude: number;
  longitude: number;
  radius: number;
}

export interface PlotData {
  plot: string;
}

export const getPointInCircle = (data) => {
  return defHttp.post({
    url: '/plots/within-circle',
    data: {
      ...data,
    },
  });
};

export const getPlotsInPolygon = (data: PolygonData) => {
  return defHttp.post({
    url: '/plots/within-polygon',
    data: {
      ...data,
    },
  });
};

export const getPlotsInPolygonList = (data: PolygonListData) => {
  return defHttp.post({
    url: '/plots/within-polygon-list',
    data: {
      ...data,
    },
  });
};

export const getPlotsInCircle = (data: CircleData) => {
  return defHttp.post({
    url: '/plots/within-circle',
    data: {
      ...data,
    },
  });
};

export const getHouseInPlots = (data: PlotData) => {
  return defHttp.post({
    url: '/house/within-plot',
    data: {
      ...data,
    },
  });
};
