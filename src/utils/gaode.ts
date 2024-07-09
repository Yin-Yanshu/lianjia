import AMapLoader from '@amap/amap-jsapi-loader';

/**
 * 调用高德可达性分析api
 */
function InitGaode() {
  window._AMapSecurityConfig = {
    securityJsCode: 'aabb2721fd1b9add4e41443ce65e9e6a',
  };
  return AMapLoader.load({
    key: '2eabe002d0eabc32258472ea7320e36e',
    version: '1.4.15',
    plugins: ['AMap.ArrivalRange'],
  }).then((AMap) => {
    const arrivalRange = new AMap.ArrivalRange();
    return arrivalRange;
  });
}
const gaodePromise = InitGaode();
export default gaodePromise;
