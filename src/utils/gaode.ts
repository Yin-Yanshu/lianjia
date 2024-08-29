import AMapLoader from '@amap/amap-jsapi-loader';

// @ts-ignore
window._AMapSecurityConfig = {
  securityJsCode: 'aabb2721fd1b9add4e41443ce65e9e6a',
};
const AMap = await AMapLoader.load({
  key: '2eabe002d0eabc32258472ea7320e36e',
  version: '1.4.15',
  plugins: ['AMap.ArrivalRange', 'AMap.Autocomplete', 'AMap.PlaceSearch'],
});

// 可达性分析接口
async function initArrivalRange() {
  return await new AMap.ArrivalRange();
}

// 输入查询地理位置自动补全接口
async function initAutoComplete() {
  return await new AMap.Autocomplete();
}

// 地点查询接口，获取位置信息，属性信息
async function initPlaceSearch() {
  return await new AMap.PlaceSearch();
}

/**
 * 调用高德api
 */
const arrivalRangePromise = initArrivalRange();
const autoCompletePromise = initAutoComplete();
const PlaceSearchPromise = initPlaceSearch();
export default function initGaoDe() {
  return {
    arrivalRangePromise,
    autoCompletePromise,
    PlaceSearchPromise,
  };
}
