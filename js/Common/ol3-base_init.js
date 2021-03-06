
	var amapLayer = new ol.layer.Tile({
		title: '高德地图',
		visible: true,
		source: new ol.source.XYZ({
			url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
		}),
		zIndex: 0
	});
	
	// 2D
	var outdoorSource = new ol.source.Vector();
	var outdoorLayer  = new ol.layer.Vector({
		title: 'outdoor map',
		visible: true,
		source: outdoorSource,
		style: geojsonstylefunction,
		//minResolution: 0.0000015,
		//maxResolution: 0.00001,
		zIndex: 10
	});
	
	// 2D
	var placePoiSource = new ol.source.Vector();
	var placePoiLayer  = new ol.layer.Vector({
		title: 'building map',
		visible: true,
		source: placePoiSource,
		style: placePoistylefun,
		minResolution: 0.0000015,
		//maxResolution: 0.00001,
		zIndex: 60
	});
	
	// 2D
	var backgroundSource = new ol.source.Vector();
	var backgroundLayer = new ol.layer.Vector({
		title: 'background map',
		visible: true,
		source: backgroundSource,
		style: geojsonstylefunction,
		maxResolution: 0.00001
	});
	
	// 2D
	var polygonSource = new ol.source.Vector();
	var polygonLayer = new ol.layer.Vector({
		title: 'polygon map',
		visible: true,
		source: polygonSource,
		style: geojsonstylefunction,
		maxResolution: 0.00001,
		zIndex: 10
	});

	var pointSource = new ol.source.Vector();
	var pointLayer = new ol.layer.Vector({
		title: 'point map',
		visible: true,
		source: pointSource,
		style: geojsonstylefunction,
		maxResolution: 0.000003,
		zIndex: 30
	});
	var selectSingleClickLayter = new ol.layer.Vector({
		title: 'point map',
		visible: true,
		source: pointSource,
		style: selectSingleClickStyle,
		maxResolution: 0.000003,
		zIndex: 5
	});
	
	// 定位图层 			
	var center_wfs = new ol.source.Vector();
	var LocationLayer = new ol.layer.Vector({
		title: 'center point',
		visible: true,
		source: center_wfs,
		zIndex: 90
	});	
	
	// 检索图层 	
	var select_wfs = new ol.source.Vector();
	var selectLayer = new ol.layer.Vector({
		title: 'select map',
		visible: true,
		source: select_wfs,
		zIndex: 50
	});
	
	// 电子围栏图层 	
	var electronicSource = new ol.source.Vector();
	var electronicLayer = new ol.layer.Vector({
		title: 'electronicFence map',
		visible: true,
		style: electronicFenceStyleFun,
		source: electronicSource,
		zIndex: 80
	});		
	
	// 收藏图层 	
	var collectionSource = new ol.source.Vector();
	var collectionLayer = new ol.layer.Vector({
		title: 'collection map',
		visible: true,
		style: collectionStyle,
		source: collectionSource,
		zIndex: 40
	});	
	
	// 测距
	var drawlayer = new ol.layer.Vector({
		title: 'drawlayer',
		source: new ol.source.Vector(),
		style: drawstyle,
		zIndex: 70
	});
	var drawpointlayer = new ol.layer.Vector({
		title: 'drawpointlayer',
		source: new ol.source.Vector(),
		style: drawpointstyle,
		zIndex: 70
	});
	
	// 热力图
	var heatmapLayer = new ol.layer.Heatmap({
		title: 'heat map',
		visible: true,
		source: new ol.source.Vector(),
		blur: 15,
		radius: 5,
		zIndex: 100
	});	
	
	// 信息框 overlay	
	var HighlightElement = document.createElement('div');
	HighlightElement.className = 'ol-popup';
	
	var HighlightElementCloser = document.createElement('a');
	HighlightElementCloser.className = 'ol-popup-closer';
	HighlightElementCloser.href = '#';
	
	var HighlightElementContent = document.createElement('div');
	
	var HighlightElementCollection = document.createElement('input');
	HighlightElementCollection.setAttribute('type', 'button');
	HighlightElementCollection.className = 'ol-popup-collection';
	HighlightElementCollection.value = '收藏';	
	
	var HighlightElementFrom = document.createElement('input');
	HighlightElementFrom.setAttribute('type', 'button');
	HighlightElementFrom.className = 'ol-popup-from';
	HighlightElementFrom.value = '从这走';		
	
	var HighlightElementTo = document.createElement('input');
	HighlightElementTo.setAttribute('type', 'button');
	HighlightElementTo.className = 'ol-popup-to';
	HighlightElementTo.value = '去这里';	
	
	var HighlightElementSearch = document.createElement('input');
	HighlightElementSearch.setAttribute('type', 'button');
	HighlightElementSearch.className = 'ol-popup-search';
	HighlightElementSearch.value = '搜周边';
	
	HighlightElement.appendChild(HighlightElementCloser);	
	HighlightElement.appendChild(HighlightElementContent);	
	HighlightElement.appendChild(HighlightElementCollection);	
	HighlightElement.appendChild(HighlightElementFrom);	
	HighlightElement.appendChild(HighlightElementTo);	
	HighlightElement.appendChild(HighlightElementSearch);	
	
	var HighlightOverlay = new ol.Overlay({
		element: HighlightElement,
		offset: [0, -15],
		positioning: 'bottom-center'		
	}); 	
	
	// 普通模式下选择  interaction   
	var selectSingleClick; 
	
	
	
	
	