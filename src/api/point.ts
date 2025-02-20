import { defHttp } from '/@/utils/http/axios';

export interface OptionData {
  price_min?: number;
  price_max?: number;
  lease_type?: string;
  room_number?: number[];
  direction?: string[];
  pagination?: {
    page: number;
    page_size: number;
  };
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

export interface HeatMapTimeData {
  start_time: string | null;
  end_time: string | null;
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

export const getCurrentHouseHeatMap = () => {
  return defHttp.get({
    url: '/heatmap/current-house-heatmap',
  });
};

export const getDynamicHouseHeatMap = (data: HeatMapTimeData) => {
  return defHttp.post({
    url: '/heatmap/dynamic-heatmap',
    data: {
      ...data,
    },
  });
};

export const getHouseList = (data: OptionData) => {
  return defHttp.post({
    url: '/house/random-list',
    data: {
      ...data,
    },
  });
};

export const getVRHouse = (data) => {
  return defHttp.post({
    url: '/house/houseid',
    data: {
      ...data,
    },
  });
};

// TODO 从apiStore获取过滤条件，全局过滤，所有使用以上接口都会使用同一个过滤条件，减少每次调用接口时过滤操作
export const getFilterHouseList = (data: OptionData) => {
  return defHttp.post({
    url: '/common/filter-house',
    data: {
      ...data,
    },
  });
};
