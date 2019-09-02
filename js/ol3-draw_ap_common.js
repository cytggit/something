var placeid = '0';
var floorid = '01';// 楼层编号    选择楼层

var mode;
var placeType = 'null';// 区域名称
var locateTimeout;
var deviceId;//设备自动生成

var DBs = 'mote'; //数据源
var locateIp = 'http://47.100.36.235:8086';
var locateUrl = locateIp + '/LocateServer/getLocation.action';
var locateCertainUrl = locateIp + '/LocateServer/getCertainLocation.action';
var comIp = 'http://114.215.83.3:8090';
var APUrl = 'http://114.215.83.3:8091/ConfigServer/getBeacons.action';
var UpdAPUrl = 'http://114.215.83.3:8091/ConfigServer/updateBeacon.action';
var DltAPUrl = 'http://114.215.83.3:8091/ConfigServer/delBeacon.action';

var wfsUrl = comIp + '/geoserver/wfs';
var wmsUrl = comIp + '/geoserver/' + DBs + '/wms';
// 设置中心点
var motecenter = [121.4287933,31.1664993]; 
var zhongbeicenter = [121.407121820159,31.2265797284321]; 
var minhangcenter = [121.457171250547,31.0275850273072]; 
var zhanlancenter = [121.452368605797,31.2253976215524]; 
var lunchuancenter = [121.505282235984,31.408037933827]; 
var fengpucenter = [121.433152478344,30.9342295206643];
var yukaicenter = [121.353859274294,31.1264078852129];

var geomPlaces;
var geomBackgrounds = {};
var geomPolygons = {};
var geomPolylines = {};
var geomPOIs = {};

//设置视图
var view = new ol.View({
	center: [121.4286933,31.1664993],
	projection: 'EPSG:4326',
	zoom: 19
});

// 室内图数据获取 	
var geojsonObject = function(filter,Typename){
	var geojson = {};
	$.ajax({
		url: wfsUrl,
		data: {
			service: 'WFS',
			version: '1.1.0',
			request: 'GetFeature',
			typename: DBs + Typename,
			outputFormat: 'application/json',
			cql_filter: filter
		},
		type: 'GET',
		dataType: 'json',	
		async: false,
		success: function(response){
			var features = new ol.format.GeoJSON().readFeatures(response);
			var floorLength = features.length;
			if(floorLength > 0){
				for(var i=0;i<features.length;i++){
					var featuresFloor = features[i].get('floor_id');
					if(geojson[featuresFloor] == undefined){
						geojson[featuresFloor] = [];
					}
					geojson[featuresFloor].push(features[i]);
				}	
			}
		}
	});
	// 返回经过条件筛选后的数据
	return geojson; 
};
/* get 室内图 */
function getGeomData(){
	geomBackgrounds = geojsonObject('place_id='+placeid,':polygon_background');
	geomPolygons = geojsonObject('place_id='+placeid,':polygon');
	geomPolylines = geojsonObject('place_id='+placeid,':polyline');
	geomPOIs = geojsonObject('place_id='+placeid,':point');
}

//获取所有place
var getGeomPlaces = function(Typename){
	var geojson = [];
	$.ajax({
		url: wfsUrl,
		data: {
			service: 'WFS',
			version: '1.1.0',
			request: 'GetFeature',
			typename: DBs + Typename,
			outputFormat: 'application/json',
		},
		type: 'GET',
		dataType: 'json',	
		async: false,
		success: function(response){
			geojson = new ol.format.GeoJSON().readFeatures(response);
		}
	});
	return geojson; 
};
geomPlaces = getGeomPlaces(':polygon_background');
//获取中心点
var mapCenter = function(placeId){
	var placeLength = geomPlaces.length;
	var places = 0,placeLonSum = 0,placeLatSum = 0;
	for (var placeNum =0;placeNum < placeLength;placeNum++){
		if (geomPlaces[placeNum].get('place_id') == placeId){
			placeLonSum += geomPlaces[placeNum].getGeometry().getInteriorPoint().getCoordinates()[0];
			placeLatSum += geomPlaces[placeNum].getGeometry().getInteriorPoint().getCoordinates()[01];
			places ++;
		}
	}
	return [placeLonSum/places,placeLatSum/places];
}

// 室内图样式设置
var geojsonstylefunction = function(feature){
	// var featureiiiid = feature.I.feature_id;
	var featureiiiid = feature.values_.feature_id;
	var featureangle = feature.values_.angle = null ? 0: feature.values_.angle;
	if (feature.getGeometry().getType() == 'Point'  && (featureiiiid == '30060300' || featureiiiid == '30060000' || featureiiiid == '30040100')){
		// geojsonstyle[featureiiiid].getText().setText(feature.I.name);
		geojsonstyle[featureiiiid].getText().setText(feature.values_.name);
	}
	if (featureiiiid == '30060100' || featureiiiid == '30060200' ){
		if (map.getView().getZoom() > 19){
			geojsonstyle[featureiiiid].getImage().setScale((map.getView().getZoom()-19)*0.1);
		}else {
			geojsonstyle[featureiiiid].getImage().setScale(0.1);
		}
		geojsonstyle[featureiiiid].getImage().setRotation(featureangle);
	}
	if (featureiiiid == '30050100' || featureiiiid == '30050800' || featureiiiid == '30050200' || featureiiiid == '30050300' ){
		if (map.getView().getZoom() > 18){
			geojsonstyle[featureiiiid].getImage().setScale((map.getView().getZoom()-18)*0.06);
		}else {
			geojsonstyle[featureiiiid].getImage().setScale(0.1);
		}
	}
	
	if (featureiiiid == undefined)  {
		var geomType = feature.getGeometry().getType();
		switch(geomType){
			case 'Point':
				return geojsonstyle[30999999];	
				break;
			case 'Polyline':
				console.log(feature);
				return geojsonstyle[20020900];	
				break;
			case 'Polygon':
				return geojsonstyle[10030602];	
				break;			
		}
	}else {
		// 返回数据的style
		return geojsonstyle[featureiiiid];		
	}
};

// ap样式设置
var APStyleFun = function(feature){
	var featureMode = feature.values_.mode ==  undefined ? 11 + mode :  feature.values_.mode + mode;

	// 返回数据的style
	return APStyle[featureMode];
};

// 编辑
var newFeature = null;
var newdrawNum;
var electronicLayerOff = true; // 显示电子围栏的FLAG 当为true时显示电子围栏图层
var drawFlag = false;
var drawtype = null;   // add or upd or rm
var FeatureColumnFlag = false; // 绘制的形状的属性flag
var DrawFeature; // 绘制的interaction  draw
var ModifyFeature; // 修改的interaction  select and modify
var DeleteFeature; // 删除的interaction  select
var FeatureDummy =[]; // 电子围栏的feature 临时存储

// 修改记录
function updateNewFeature(features,featureType,updType){
	var WFSTSerializer = new ol.format.WFS();
    var formatGML = new ol.format.GML({  
		featureNS: 'http://www.' + DBs + '.com',
		featurePrefix: DBs,
        featureType: featureType,
        srsName: 'EPSG:4326',
    }); 	
	var featObject;
	switch (updType) {  
		case 'insert': 
			featObject = WFSTSerializer.writeTransaction(features,null,null,formatGML);
			break;
		case 'update': 
			featObject = WFSTSerializer.writeTransaction(null,features,null,formatGML);
			break;
		case 'remove': 
			featObject = WFSTSerializer.writeTransaction(null,null,features,formatGML);
			break;
	}
	var serializer = new XMLSerializer();
	var featString = serializer.serializeToString(featObject);
	featObjectSend(featString);
	console.log(featString);
}

// 发送操作数据库请求
function featObjectSend(featString){
	var request = new XMLHttpRequest();
	request.open('POST', wfsUrl + '?service=wfs');
	request.setRequestHeader('Content-Type', 'text/xml');
	request.send(featString);		
}

// Draw END
var drawstyle = new ol.style.Style({
    fill: new ol.style.Fill({
		color: 'rgba(255,0, 0, 1)'
    }),
    stroke: new ol.style.Stroke({
		color: '#ffcc33',
		width: 2
    }),
    image: new ol.style.Circle({
		radius: 7,
		fill: new ol.style.Fill({
			color: '#ffcc33'
		})
	}),
	zIndex: 500
});
var drawpointstyle = new ol.style.Style({
    image: new ol.style.Circle({
		radius: 4,
		stroke: new ol.style.Stroke({
			color: '#ffcc33',
			width: 1.5
		}),
		fill: new ol.style.Fill({
			color: '#ffffff'
		})
	}),
	zIndex: 500
});
	
// AP style
var APStyle = {
	'00'/*wifi*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/00.png',
			anchor: [0.5,0.5],
			opacity: 1,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'01'/*wifi*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/00.png',
			anchor: [0.5,0.5],
			opacity: 0.5,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'02'/*wifi*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/00.png',
			anchor: [0.5,0.5],
			opacity: 0.5,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'11'/*蓝牙*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/11.png',
			anchor: [0.5,0.5],
			opacity: 1,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'10'/*蓝牙*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/11.png',
			anchor: [0.5,0.5],
			opacity: 0.5,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'12'/*蓝牙*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/11.png',
			anchor: [0.5,0.5],
			opacity: 0.5,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'22'/*RFID*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/22.png',
			anchor: [0.5,0.5],
			opacity: 1,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'20'/*RFID*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/22.png',
			anchor: [0.5,0.5],
			opacity: 0.5,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'21'/*RFID*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/22.png',
			anchor: [0.5,0.5],
			opacity: 0.5,
			scale: 0.4
		}),
		zIndex: 450
	}),
	'110'/*增加WiFi*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/110.png',
			anchor: [0.5,0.5],
			opacity: 1,
			scale: 0.4
		}),
		zIndex: 500
	}),
	'111'/*增加蓝牙*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/111.png',
			anchor: [0.5,0.5],
			opacity: 1,
			scale: 0.4
		}),
		zIndex: 500
	}),
	'112'/*增加RFID*/: new ol.style.Style({
		image: new ol.style.Icon({
			src: './icon/112.png',
			anchor: [0.5,0.5],
			opacity: 1,
			scale: 0.4
		}),
		zIndex: 500
	})
}

// 定位 style 
var locationStyle = new ol.style.Style({
	image: new ol.style.Icon({
		src: 'http://127.0.0.1:8090/map/icon/location.png',
		scale: 0.3,
		anchor: [0.5,0.5],
	}),
	zIndex: 600
});

// 基础图层style
var geojsonstyle = {
	'999999' : new ol.style.Style({
		fill: new ol.style.Fill({
			color: [200,200,200,1]
		}),
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width:1
		}),
		zIndex: 100
	}),
	/************
	*
	*polygon
	*
	************/
	'10020101'/*监狱*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020301'/*工厂*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020401'/*教学楼*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020511'/*公司范围*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020601'/*停车场*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [200,200,200,1]
		}),
		zIndex:101
	}),
	'10020602'/*晾晒房*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020603'/*礼堂*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020604'/*操场*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020605'/*食堂*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10020606'/*锅炉房*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width:1
		}),
		fill: new ol.style.Fill({
			color: [255,255,255,1]
		}),
		zIndex:101
	}),
	'10030101'/*监室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [250,224,204,1]
		}),
		zIndex: 103
	}),
	'10030102'/*放风场*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [217,237,218,1]
		}),
		zIndex: 103
	}),
	'10030103'/*谈话室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [195,229,233,1]
		}),
		zIndex: 103
	}),
	'10030104'/*管教办公室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [146,183,188,1]
		}),
		zIndex: 103
	}),
	'10030105'/*医疗器具室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [211,211,180,1]
		}),
		zIndex: 103
	}),
	'10030106'/*储藏室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [252,246,156,1]
		}),
		zIndex: 103
	}),
	'10030107'/*开水间*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [255,213,219,1]
		}),
		zIndex: 103
	}),
	'10030108'/*休息室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [255,143,124,1]
		}),
		zIndex: 103
	}),
	'10030109'/*值班室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [199,161,149,1]
		}),
		zIndex: 103
	}),
	'10030110'/*控制室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [189,139,142,1]
		}),
		zIndex: 103
	}),
	'10030111'/*禁闭室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [210,190,113,1]
		}),
		zIndex: 103
	}),
	'10030112'/*会见室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [174,189,196,1]
		}),
		zIndex: 103
	}),
	'10030113'/*询问室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [199,214,225,1]
		}),
		zIndex: 103
	}),
	'10030114'/*淋浴室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [255,188,155,1]
		}),
		zIndex: 103
	}),
	'10030115'/*铁栅隔离*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,0.4],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [199,214,225,0.4]
		}),
		zIndex: 102
	}),
	'10030116'/*铁栅隔离实体*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,0.4],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [199,214,225,0.4]
		}),
		zIndex: 104
	}),
	'10030117'/*办公室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [146,183,188,1]
		}),
		zIndex: 103
	}),
	'10030118'/*教室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [245,138,155,1]
		}),
		zIndex: 103
	}),
	'10030119'/*多功能厅*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [205,155,155,1]
		}),
		zIndex: 103
	}),
	'10030120'/*展示厅*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [205,155,155,1]
		}),
		zIndex: 103
	}),
	'10030121'/*阅览室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [205,155,155,1]
		}),
		zIndex: 103
	}),
	'10030122'/*宣泄室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [210,190,113,1]
		}),
		zIndex: 103
	}),
	'10030123'/*档案室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [123,188,205,1]
		}),
		zIndex: 103
	}),
	'10030124'/*沙盘室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [205,155,155,1]
		}),
		zIndex: 103
	}),
	'10030125'/*治疗室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [133,178,125,1]
		}),
		zIndex: 103
	}),
	'10030126'/*卫生室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [133,168,135,1]
		}),
		zIndex: 103
	}),
	'10030127'/*配电室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [175,178,235,1]
		}),
		zIndex: 103
	}),
	'10030128'/*放映室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [205,165,165,1]
		}),
		zIndex: 103
	}),
	'10030130'/*灯光室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [205,165,165,1]
		}),
		zIndex: 103
	}),
	'10030131'/*更衣室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [245,178,155,1]
		}),
		zIndex: 103
	}),
	'10030132'/*加工间*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [175,178,235,1]
		}),
		zIndex: 103
	}),
	'10030133'/*供应室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [252,246,156,1]
		}),
		zIndex: 103
	}),
	'10030134'/*机房*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [129,159,165,1]
		}),
		zIndex: 103
	}),
	'10030199'/*其他*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [159,129,165,1]
		}),
		zIndex: 103
	}),
	'10030201'/*诊室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [139,214,225,1]
		}),
		zIndex: 103
	}),
	'10030202'/*药房*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [199,144,205,1]
		}),
		zIndex: 103
	}),
	'10030203'/*输液室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [129,174,125,1]
		}),
		zIndex: 103
	}),
	'10030204'/*B超室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [139,214,225,1]
		}),
		zIndex: 103
	}),
	'10030205'/*手术室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [122,84,125,1]
		}),
		zIndex: 103
	}),
	'10030206'/*病房*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [139,174,135,1]
		}),
		zIndex: 103
	}),
	'10030207'/*病案室*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [99,84,125,1]
		}),
		zIndex: 103
	}),
	'10030301'/*彩板房*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [159,184,125,1]
		}),
		zIndex: 103
	}),
	'10030302'/*加工车间*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [169,194,185,1]
		}),
		zIndex: 103
	}),
	'10030501'/*总裁*/: new ol.style.Style({ 
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [204,153,255,0.5]
		}),
		zIndex: 103
	}),
	'10030502' /*财务室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030503' /*涉密机房*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [255,153,0,0.5]
		}),
		zIndex: 103
	}),
	'10030504' /*会议室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [255,255,204,0.5]
		}),
		zIndex: 103
	}),
	'10030505' /*办公桌*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [108,94,80,0.8]
		}),
		zIndex: 104
	}),
	'10030506' /*技术总监*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [220,220,255,0.5]
		}),
		zIndex: 103
	}),
	'10030507' /*市场部*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030508' /*综合部*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030509' /*质量部*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030510' /*商务部*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030511' /*人力资源*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030512' /*项目管理*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030513' /*地图办公室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [233,242,239,0.5]
		}),
		zIndex: 103
	}),
	'10030514' /*总经理室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [220,220,255,0.5]
		}),
		zIndex: 103
	}),
	'10030515' /*副总经理室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [220,220,255,0.5]
		}),
		zIndex: 103
	}),
	'10030516' /*经理*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [220,220,255,0.5]
		}),
		zIndex: 103
	}),
	'10030517' /*资料室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [252,231,212,0.5]
		}),
		zIndex: 103
	}),
	'10030518' /*技术服务*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [252,231,212,0.5]
		}),
		zIndex: 103
	}),
	'10030519' /*打印室*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [252,231,212,0.5]
		}),
		zIndex: 103
	}),
	'10030520' /*设备间*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [252,231,212,0.5]
		}),
		zIndex: 103
	}),
	'10030599' /*其他*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [252,231,212,0.5]
		}),
		zIndex: 103
	}),
	// '10030101' /*看板*/: new ol.style.Style({  
		// stroke: new ol.style.Stroke({
			// color: [128,128,128,0.6],
			// width: 1
		// }),
		// fill: new ol.style.Fill({
			// color: [255,153,204,0.8]
		// }),
		// zIndex: 104
	// }),
	'10030602' /*卫生间*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [255,178,190,1]
		}),
		zIndex: 104
	}),
	'10030603' /*沙发*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [128,128,128,0.6],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [204,204,104,0.8]
		}),
		zIndex: 104
	}),
	'10030604' /*电梯间*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [180,180,180,0.5]
		}),
		zIndex: 103
	}),
	'10030605' /*楼梯间*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 0.8
		}),
		fill: new ol.style.Fill({
			color: [180,180,180,0.5]
		}),
		zIndex: 103
	}),
	'10030606' /*书架*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [224,224,224,0.8]
		}),
		zIndex: 104
	}),
	'10030607' /*机柜*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [104,104,104,0.8]
		}),
		zIndex: 104
	}),
	'10030608' /*资料架*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [224,224,224,0.8]
		}),
		zIndex: 104
	}),
	'10030609' /*衣柜*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [204,204,204,0.8]
		}),
		zIndex: 104
	}),
	'10030610' /*床*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [244,244,204,0.8]
		}),
		zIndex: 105
	}),
	'10030611' /*餐厅*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [244,204,204,1]
		}),
		zIndex: 103
	}),
	'10030612' /*厨房*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [204,204,244,1]
		}),
		zIndex: 103
	}),
	'10030613' /*晒衣间*/: new ol.style.Style({  
		stroke: new ol.style.Stroke({
			color: [255,255,255,1],
			width: 1
		}),
		fill: new ol.style.Fill({
			color: [204,204,204,0.8]
		}),
		zIndex: 103
	}),


	/************
	*
	*polyline
	*
	************/
	'20020900'/*道路*/: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: [208,128,128,0.6],
			width: 0.8
		}),
		zIndex:200	
	}),
	/************
	*
	*point
	*
	************/
	'30060000' /*公司名*/: new ol.style.Style({  
		text: new ol.style.Text({
			font: '1em sans-serif',
			// scale: 100,
			textAlign: 'center',
			textBaseline: 'bottom',
			offsetY: -5,
			fill: new ol.style.Fill({
				color: [40,40,40,1]
			}),
			stroke: new ol.style.Stroke({
				color: [255,255,255,1],
				width: 3
			})
		}),
		zIndex:350
	}),	
	'30060100' /*工位*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/chair_right.png',
			anchor: [0.5,0.5],
			rotateWithView: true
		}),
		zIndex:300
	}),
	'30060200' /*工位*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/chair_left.png',
			anchor: [0.5,0.5],
			rotateWithView: true
		}),
		zIndex:300
	}),	
	'30060300' /*会议室&财务室&公共办公区&总经理室*/: new ol.style.Style({  
		text: new ol.style.Text({
			font: '0.81em sans-serif',
			// scale: 100,
			textAlign: 'center',
			textBaseline: 'bottom',
			offsetY: -5,
			fill: new ol.style.Fill({
				color: [40,40,40,1]
			}),
			stroke: new ol.style.Stroke({
				color: [255,255,255,1],
				width: 1
			})
		}),
		zIndex:340
	}),
	'30040100' /*教室*/: new ol.style.Style({  
		text: new ol.style.Text({
			font: '0.81em sans-serif',
			// scale: 100,
			textAlign: 'center',
			textBaseline: 'middle',
			offsetY: -5,
			fill: new ol.style.Fill({
				color: [40,40,40,1]
			}),
			stroke: new ol.style.Stroke({
				color: [255,255,255,1],
				width: 1
			})
		}),
		zIndex:340
	}),
	'30050100' /*卫生间*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/wc.png',
		}),
		zIndex:330
	}),	
	'30050200' /*楼梯*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/stair.png',
		}),
		zIndex:330
	}),	
	'30050300' /*电梯*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/elevator.png',
		}),
		zIndex:330
	}),	
	'30050800' /*大门*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/door.png',
		}),
		zIndex:330
	}),	
	'30052200' /*床*/: new ol.style.Style({  
		image: new ol.style.Icon({
			src: './icon/bed.png',
		}),
		zIndex:330
	}),	
	
};

var amapLayer = new ol.layer.Tile({
	title: '高德地图',
	visible: true,
	source: new ol.source.XYZ({
		url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
	}),
	zIndex: 0
});

var viewParam = 'place_id:' + placeid + ';floor_id:' + floorid;
var backgroundTypename = DBs + ':mote_background';
var backgroundLayer = new ol.layer.Vector({
	title: 'background map',
	visible: true,
	// source: new ol.source.Vector({
		// features:  new ol.format.GeoJSON().readFeatures(geojsonObject(viewParam,backgroundTypename))
	// }),
	source: new ol.source.Vector(),
	style: geojsonstylefunction,
	maxResolution: 0.00001,
	zIndex: 1
});
// 2D
var polygonTypename = DBs + ':mote_polygon';
var polygonLayer = new ol.layer.Vector({
	title: 'polygon map',
	visible: true,
	// source: new ol.source.Vector({
		// features:  new ol.format.GeoJSON().readFeatures(geojsonObject(viewParam,polygonTypename))
	// }),
	source: new ol.source.Vector(),
	style: geojsonstylefunction,
	maxResolution: 0.00001,
	zIndex: 10
});
// 2D
var polylineTypename = DBs + ':mote_polyline';
var roadLayer = new ol.layer.Vector({
	title: 'polyline map',
	visible: true,
	// source: new ol.source.Vector({
		// features:  new ol.format.GeoJSON().readFeatures(geojsonObject(viewParam,polylineTypename))
	// }),
	source: new ol.source.Vector(),
	style: geojsonstylefunction,
	maxResolution: 0.00001,
	zIndex: 20
});

var pointTypename = DBs + ':mote_point';
var pointLayer = new ol.layer.Vector({
	title: 'point map',
	visible: true,
	// source: new ol.source.Vector({
		// features:  new ol.format.GeoJSON().readFeatures(geojsonObject(viewParam,pointTypename))
	// }),
	source:new ol.source.Vector(),
	style: geojsonstylefunction,
	maxResolution: 0.000003,
	zIndex: 30
});

// 电子围栏图层 	
var electronicLayer = new ol.layer.Vector({
	title: 'electronicFence map',
	visible: true,
	style: APStyleFun,
	source: new ol.source.Vector(),
	zIndex: 80
});		

	// 定位图层 			
var center_wfs = new ol.source.Vector();
var LocationLayer = new ol.layer.Vector({
	title: 'center point',
	visible: true,
	source: center_wfs,
	style: locationStyle,
	zIndex: 60
});	