import { defHttp } from '/@/utils/http/axios';

export interface OptionData {
  price_min?: number;
  price_max?: number;
  lease_type?: string;
}

export interface PointData {
  longitude: number;
  latitude: number;
}

export interface PolygonData {
  polygon: PointData[];
  option?: OptionData;
}

export interface PolygonListData {
  polygonList: PolygonData[];
  option?: OptionData;
}

export interface CircleData {
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  option?: OptionData;
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

export const getHouseCountInRegion = (data: PolygonData) => {
  return defHttp.post({
    url: '/house/within-region',
    data: {
      ...data,
    },
  });
};
