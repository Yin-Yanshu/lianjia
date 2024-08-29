/**
 * 点聚合图层绘制
 */
// let clusterLayerAdded = false;
// const featuresArr = [];
// const clusterVectorSource = new VectorSource({
//   features: featuresArr,
// });
// const cluster = new Cluster({
//   source: overLaySource,
//   distance: 50,
// });
// const clusterLayer = new VectorLayer({
//   source: cluster,
//   style: function (feature) {
//     const property = feature.getProperties();
//     console.log('property');
//     console.log(property);
//     // const count = property.count;
//     // const plot = property.plot;
//     const subFeatures = feature.get('features'); // 获取聚合的子feature
//     console.log('subFeatures');
//     console.log(subFeatures);
//     let size = subFeatures.length;
//     // if (size < 10) {
//     //   subFeatures.forEach((element) => {
//     //     const plot = element.get('plot');
//     //     const count = element.get('count');
//     //     return new Style({
//     //       text: new Text({
//     //         font: '14px Arial',
//     //         text: plot + '|' + count + '套',
//     //         fill: new Fill({ color: '#000' }),
//     //         stroke: new Stroke({ color: '#fff', width: 2 }),
//     //       }),
//     //       image: new Circle({
//     //         radius: 16,
//     //         fill: new Fill({
//     //           color: 'rgb(0,174,102,0.7)',
//     //         }),
//     //       }),
//     //     });
//     //   });
//     // }

//     if (size < 5) {
//       return subFeatures.map((subFeature) => {
//         const plot = subFeature.get('plot');
//         const count = subFeature.get('count');
//         return new Style({
//           text: new Text({
//             font: '14px Arial',
//             text: plot + '|' + count + '套',
//             fill: new Fill({ color: '#000' }),
//             stroke: new Stroke({ color: '#fff', width: 2 }),
//           }),
//           image: new Circle({
//             radius: 16,
//             fill: new Fill({
//               color: 'rgb(0,174,102,0.7)',
//             }),
//           }),
//         });
//       });
//     } else {
//       // 聚合样式
//       return new Style({
//         text: new Text({
//           font: '14px Arial',
//           text: size.toString(), // 将 size 转换为字符串
//           fill: new Fill({ color: '#000' }),
//         }),
//         image: new Circle({
//           radius: 13,
//           fill: new Fill({
//             color: '#ff0813',
//           }),
//         }),
//       });
//     }

//     let style = new Style({
//       text: new Text({
//         font: '14px Arial',
//         // 需要确保text为字符串 text:size (size为number，参数类型错误)
//         text: size.toString(),
//         fill: new Fill({ color: '#000' }),
//         // stroke: new Stroke({ color: '#fff', width: 2 }),
//       }),
//       image: new Circle({
//         radius: 8,
//         fill: new Fill({
//           color: '#ff0813',
//         }),
//       }),
//     });

//     // let style = new Style({
//     //   fill: new Fill({
//     //     color: 'rgba(255, 255, 255, 0.2)',
//     //   }),
//     //   stroke: new Stroke({
//     //     color: '#ffcc33',
//     //     width: 2,
//     //   }),
//     //   image: new Circle({
//     //     radius: 16,
//     //     fill: new Fill({
//     //       color: '#ffcc33',
//     //     }),
//     //   }),
//     // });
//     return style;
//   },
// });
// function ClusterPoint(map: Map, coordinates: number[]) {
//   for (let i = 0; i < coordinates.length; i++) {
//     let feature = new Feature({
//       geometry: new Point([coordinates[i].wgs84_lng, coordinates[i].wgs84_lat]),
//     });
//     featuresArr.push(feature as never);
//   }
//   clusterVectorSource.clear();
//   clusterVectorSource.addFeatures(featuresArr);
//   if (!clusterLayerAdded) map.addLayer(clusterLayer);
// }

/**
 * Select控件获取要素信息
 * @param map
 * 传入地图，获取传入地图要素
 */
// function GetFeature(map: Map) {
//   const select = new Select();
//   map.addInteraction(select);
//   select.on('select', function (event) {
//     var features = event.target.getFeatures().getArray();
//     var coordinates = features[0].getGeometry().getCoordinates();
//     console.log(coordinates);
//     var property = features[0].getProperties();
//     console.log(property);
//   });
// }
