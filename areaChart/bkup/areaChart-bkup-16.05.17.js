/*
 * SVG Area Chart 
 * @Version:1.0.0
 * @CreatedOn:31-05-2016
 * @Author:SmartChartsNXT
 * @description: SVG Area Chart, that support multiple series, and zoom window.
 * @JSFiddle:
 * @Sample caller code:
 
  SmartChartsNXT.ready(function(){
    var areaChart = new SmartChartsNXT.AreaChart({
      "title":"Multi Series Chart",
      "subTitle":"Area Chart",
      "targetElem":"chartContainer",
      "canvasBorder":false,
      "bgColor":"none",
      "animated":false,
      "toolTip":{
        "content":'<table>'+
              '<tr><td><b>{{point.series.name}}</b> has produces </td></tr>' +
              '<tr><td>a total Sales of <b>Rs. {{point.value}} </b></td></tr>'+
              '<tr><td>on <b>{{point.label}}</b></tr>' +
              '</table>'
      },
      "dataSet":{
        "xAxis":{
          "title":"Date"
        },
        "yAxis":{
          "title":"Total Sales",
          "prefix":"Rs. "
        },
        "series":[
          {
            "lineWidth":2,
            "color":"#FFC107",
            "name": 'Raphael',
            "data": generateData(10,50,45)
          },
          {
            "lineWidth":2,
            "color":"#F44336",
            "noPointMarker":false,
            "markerRadius":3,
            "smoothedLine":false,
            "name": 'Wilson',
            "data": [
              {label:"Jan",value:"6446"},{label:"Feb",value:"333"},{label:"Mar",value:"470"},{label:"Apr",value:"8472"},
              {label:"May",value:"1212"},{label:"Jun",value:"6446"},{label:"Jul",value:"8472"},{label:"Aug",value:"114"},
              {label:"Sep",value:"432"},{label:"Oct",value:"3543"},{label:"Nov",value:"114"},{label:"Dec",value:"333"}
            ]
          }
        ]
      },
      zoomWindow:{
        "leftIndex":10,
        "rightIndex":20
      }
    });
  });

 */

window.SmartChartsNXT.AreaChart = function (opts) {

  //call base chart constructor
  $SC.BaseChart.call(this);

  var PAGE_OPTIONS = {};
  var self = this;
  var PAGE_DATA = {
    scaleX: 0,
    scaleY: 0,
    svgCenter: 0,
    chartCenter: 0,
    maxima: 0,
    minima: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    gridBoxWidth: 0,
    gridBoxHeight: 0,
    fullChartHeight: 60,
    fullSeries: [],
    fsScaleX: 0,
    fcMarginTop: 80,
    windowLeftIndex: 0,
    windowRightIndex: -1,
    longestSeries: 0,
    series: [],
    mouseDown: 0,
    newDataSet: [],
    newCatgList: []
  };

  var PAGE_CONST = {
    FIX_WIDTH: 800,
    FIX_HEIGHT: 600,
    MIN_WIDTH: 250,
    MIN_HEIGHT: 400,
    hGridCount: 9,
    runId: "areachart_" + Math.round(Math.random() * 1000000001)
  };

  self._PAGE_DATA = PAGE_DATA;
  self._PAGE_CONST = PAGE_CONST;
  self._PAGE_OPTIONS = {};
  console.log(this);

  function init() {
    try {
      self.init("areaChart", opts);
      PAGE_OPTIONS = self._PAGE_OPTIONS;
      PAGE_DATA = self._PAGE_DATA;

      console.log(self);

      initDataSet();
      PAGE_DATA.chartCenter = new $SC.geom.Point(PAGE_DATA.svgCenter.x, PAGE_DATA.svgCenter.y + 50);
      PAGE_DATA.marginLeft = ((-1) * PAGE_DATA.scaleX / 2) + 100;
      PAGE_DATA.marginRight = ((-1) * PAGE_DATA.scaleX / 2) + 20;
      PAGE_DATA.marginTop = ((-1) * PAGE_DATA.scaleY / 2) + 120;
      PAGE_DATA.marginBottom = ((-1) * PAGE_DATA.scaleY / 2) + 170;

      var longestSeries = 0,
        longSeriesLen = 0;
      for (var index = 0; index < PAGE_OPTIONS.dataSet.series.length; index++) {

        if (PAGE_OPTIONS.dataSet.series[index].data.length > longSeriesLen) {
          longestSeries = index;
          longSeriesLen = PAGE_OPTIONS.dataSet.series[index].data.length;
        }
      }
      PAGE_DATA.longestSeries = longestSeries;

      if (PAGE_OPTIONS.zoomWindow) {
        if (PAGE_OPTIONS.zoomWindow.leftIndex && PAGE_OPTIONS.zoomWindow.leftIndex >= 0 && PAGE_OPTIONS.zoomWindow.leftIndex < longSeriesLen - 1)
          PAGE_DATA.windowLeftIndex = PAGE_OPTIONS.zoomWindow.leftIndex;
        if (PAGE_OPTIONS.zoomWindow.rightIndex && PAGE_OPTIONS.zoomWindow.rightIndex > PAGE_OPTIONS.zoomWindow.leftIndex && PAGE_OPTIONS.zoomWindow.rightIndex <= longSeriesLen - 1)
          PAGE_DATA.windowRightIndex = PAGE_OPTIONS.zoomWindow.rightIndex;
        else
          PAGE_DATA.windowRightIndex = (longSeriesLen) - 1;
      } else
        PAGE_DATA.windowRightIndex = (longSeriesLen) - 1;

      prepareChart();

    } catch (ex) {
      $SC.handleError(ex, "Error in AreaChart");
    }

  } /*End init()*/

  function initDataSet() {
    PAGE_DATA.fullSeries = [];
    PAGE_DATA.series = [];
    PAGE_DATA.newDataSet = [];
    PAGE_DATA.newCatgList = [];
    PAGE_DATA.windowLeftIndex = 0;
    PAGE_DATA.windowRightIndex = -1;
  } /*End initDataSet()*/

  function prepareChart() {
    prepareDataSet();
    var strSVG = "";
    if (PAGE_OPTIONS.canvasBorder) {
      strSVG += "<g>";
      strSVG += "  <rect x='" + ((-1) * PAGE_DATA.scaleX / 2) + "' y='" + ((-1) * PAGE_DATA.scaleY / 2) + "' width='" + ((PAGE_DATA.svgCenter.x * 2) + PAGE_DATA.scaleX) + "' height='" + ((PAGE_DATA.svgCenter.y * 2) + PAGE_DATA.scaleY) + "' style='fill:none;stroke-width:1;stroke:#717171;' \/>";
      strSVG += "<\/g>";
    }
    strSVG += "<g>";
    strSVG += "  <text id='txtTitleGrp' fill='#717171' font-family='Lato' >";
    strSVG += "    <tspan id='txtTitle' x='" + (100 / PAGE_CONST.FIX_WIDTH * PAGE_OPTIONS.width) + "' y='" + (50 / PAGE_CONST.FIX_HEIGHT * PAGE_OPTIONS.height) + "' font-size='20'><\/tspan>";
    strSVG += "    <tspan id='txtSubtitle' x='125' y='80' font-size='13'><\/tspan>";
    strSVG += "  <\/text>";
    strSVG += "<\/g>";


    strSVG += "<g id='legendContainer'>";
    strSVG += "<\/g>";

    strSVG += "<g id='fullSeriesContr'>";
    strSVG += "</g>";

    strSVG += "<path id='hLine' fill='none' stroke='#333' stroke-width='1' opacity='1'></path>";
    strSVG += "<path id='vLine' fill='none' stroke='#333' stroke-width='1' opacity='1'></path>";
    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strSVG);

    /*Set Title of chart*/
    self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtTitle").textContent = PAGE_OPTIONS.title;
    self._PAGE_DATA.objChart.querySelector("#txtSubtitle").textContent = PAGE_OPTIONS.subTitle;

    createGrid();
    createFullSeries();

    var scaleX = PAGE_DATA.gridBoxWidth / PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length;
    for (var index = 0; index < PAGE_OPTIONS.dataSet.series.length; index++) {
      createSeries(PAGE_OPTIONS.dataSet.series[index].data, index, scaleX);
      if (PAGE_OPTIONS.dataSet.series.length > 1)
        createLegands(index);
      appendGradFill(index);
    }

    var scaleX = PAGE_DATA.gridBoxWidth / PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(0, PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length);
    createHorizontalLabel(PAGE_OPTIONS.dataSet.xAxis.categories, scaleX);

    /*Creating horizontal and vertical subtitles*/
    strSVG = "<text id='hTextSubTitle' fill='#717171' font-family='Lato'  x='" + (PAGE_DATA.marginLeft + (PAGE_DATA.gridBoxWidth / 2) - 30) + "' y='" + (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + 70) + "' font-size='18' >" + PAGE_OPTIONS.dataSet.xAxis.title + "<\/text>";
    strSVG += "<text id='vTextSubTitle' fill='#717171' font-family='Lato'  x='" + (PAGE_DATA.marginLeft - 30) + "' y='" + (PAGE_DATA.marginTop + (PAGE_DATA.gridBoxHeight / 2) - 5) + "' font-size='18' >" + PAGE_OPTIONS.dataSet.yAxis.title + "<\/text>";

    var zoomOutBox = {
      top: PAGE_DATA.marginTop - 40,
      left: PAGE_DATA.marginLeft + PAGE_DATA.gridBoxWidth - 40,
      width: 40,
      height: 40
    };

    strSVG += "<g id='zoomOutBoxCont' style='display:none;'>";
    strSVG += "  <rect id='zoomOutBox' x='" + zoomOutBox.left + "' y='" + zoomOutBox.top + "' width='" + zoomOutBox.width + "' height='" + zoomOutBox.height + "' pointer-events='all' stroke='#717171' fill='none' stroke-width='0' \/>";
    strSVG += "  <circle r='10' cx='" + (zoomOutBox.left + (zoomOutBox.width / 2)) + "' cy='" + (zoomOutBox.top + (zoomOutBox.height / 2)) + "' pointer-events='none' stroke-width='1' fill='none' stroke='#333'/>";
    strSVG += "  <line x1='" + (zoomOutBox.left + (zoomOutBox.width / 2) - 4) + "' y1='" + (zoomOutBox.top + (zoomOutBox.height / 2)) + "' x2='" + (zoomOutBox.left + (zoomOutBox.width / 2) + 4) + "' y2='" + (zoomOutBox.top + (zoomOutBox.height / 2)) + "' pointer-events='none' stroke-width='1' fill='none' stroke='#333'/>";
    var lineStart = $SC.geom.polarToCartesian((zoomOutBox.left + (zoomOutBox.width / 2)), (zoomOutBox.top + (zoomOutBox.height / 2)), 10, 135);
    var lineEnd = $SC.geom.polarToCartesian((zoomOutBox.left + (zoomOutBox.width / 2)), (zoomOutBox.top + (zoomOutBox.height / 2)), 20, 135);
    strSVG += "  <line x1='" + lineStart.x + "' y1='" + lineStart.y + "' x2='" + lineEnd.x + "' y2='" + lineEnd.y + "' pointer-events='none' stroke-width='2' fill='none' stroke='#333'/>";
    strSVG += "</g>";

    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strSVG);

    resetTextPositions();

    resetSliderPos("left", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
    resetSliderPos("right", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);

    //bindEvents();
    bindSliderEvents();

    var fullSeries = self._PAGE_DATA.objChart.querySelector("#fullSeriesContr");
    fullSeries.parentNode.removeChild(fullSeries);
    self._PAGE_DATA.objChart.appendChild(fullSeries);

    reDrawSeries();
  } /*End prepareChart()*/


  function createFullSeries() {
    var strSVG = "";
    strSVG += "<rect id='sliderLeftOffset' x='" + (PAGE_DATA.marginLeft) + "' y='" + ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop) + "' width='0' height='" + (PAGE_DATA.fullChartHeight) + "' fill= 'rgba(128,179,236,0.1)'  style='stroke-width:0.1;stroke:#717171;' \/>";
    strSVG += "<rect id='sliderRightOffset' x='" + ((PAGE_DATA.svgCenter.x * 2) - PAGE_DATA.marginRight) + "' y='" + ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop) + "' width='0' height='" + (PAGE_DATA.fullChartHeight) + "' fill= 'rgba(128,179,236,0.1)' style='stroke-width:0.1;stroke:#717171;' \/>";
    self._PAGE_DATA.objChart.querySelector("#fullSeriesContr").insertAdjacentHTML("beforeend", strSVG);

    /* ploting actual points */
    for (var index = 0; index < PAGE_OPTIONS.dataSet.series.length; index++) {
      drawFullSeries(PAGE_OPTIONS.dataSet.series[index].data, index);
    }

    var outerContPath = [
      "M", (PAGE_DATA.marginLeft), ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop + 10),
      "L", (PAGE_DATA.marginLeft), ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop),
      "L", (PAGE_DATA.marginLeft + PAGE_DATA.gridBoxWidth), ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop),
      "L", (PAGE_DATA.marginLeft + PAGE_DATA.gridBoxWidth), ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop + 10)
    ];

    strSVG = "";
    strSVG += "<path stroke='#333' fill='none' d='" + outerContPath.join(" ") + "' stroke-width='1' opacity='1'></path>";
    strSVG += "<rect id='outerFrame' x='" + (PAGE_DATA.marginLeft) + "' y='" + ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop) + "' width='" + ((PAGE_DATA.svgCenter.x * 2) - PAGE_DATA.marginLeft - PAGE_DATA.marginRight) + "' height='" + (PAGE_DATA.fullChartHeight) + "' style='fill:none;stroke-width:0.1;stroke:none;' \/>";
    strSVG += "<path id='sliderLeft' stroke='rgb(178, 177, 182)' fill='none' d='' stroke-width='1' opacity='1'></path>";
    strSVG += "<path id='sliderRight' stroke='rgb(178, 177, 182)' fill='none' d='' stroke-width='1' opacity='1'></path>";
    strSVG += "<g id='sliderLeftHandle'>";
    strSVG += "  <path id='slideLSel' stroke='rgb(178, 177, 182)' fill='#fafafa' d='' stroke-width='1' opacity='1'></path>";
    strSVG += "  <path id='slideLSelInner' stroke='rgb(178, 177, 182)' fill='none' d='' stroke-width='1' opacity='1'></path>";
    strSVG += "</g>";
    strSVG += "<g id='sliderRightHandle'>";
    strSVG += "  <path id='slideRSel' stroke='rgb(178, 177, 182)' fill='#fafafa' d='' stroke-width='1' opacity='1'></path>";
    strSVG += "  <path id='slideRSelInner' stroke='rgb(178, 177, 182)' fill='none' d='' stroke-width='1' opacity='1'></path>";
    strSVG += "</g>";
    self._PAGE_DATA.objChart.querySelector("#fullSeriesContr").insertAdjacentHTML("beforeend", strSVG);


    function drawFullSeries(dataSet, index) {
      var d = [];
      var scaleX = PAGE_DATA.fsScaleX = (PAGE_DATA.gridBoxWidth / PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length);
      var scaleYfull = (PAGE_DATA.fullChartHeight / PAGE_DATA.maxima);
      var arrPointsSet = [],
        strSeries = "";
      for (var dataCount = 0; dataCount < dataSet.length; dataCount++) {
        var p = new $SC.geom.Point(PAGE_DATA.marginLeft + (dataCount * scaleX) + (scaleX / 2), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fullChartHeight + PAGE_DATA.fcMarginTop) - (dataSet[dataCount].value * scaleYfull));
        arrPointsSet.push(p);
      }

      PAGE_DATA.fullSeries.push(arrPointsSet);

      var line = [],
        area = [];
      strSeries = "<g id='fullSeries_" + index + "' class='fullSeries'>";
      line.push.apply(line, ["M", arrPointsSet[0].x, arrPointsSet[0].y]);
      var point = 0;
      for (var point = 0;
        (point + 2) < arrPointsSet.length; point++) {
        if (PAGE_OPTIONS.dataSet.series[index].smoothedLine) {
          var curve = $SC.geom.describeBezireArc(arrPointsSet[point], arrPointsSet[point + 1], arrPointsSet[point + 2]);
          line.push.apply(line, curve);
        } else {
          line.push.apply(line, ["L", arrPointsSet[point].x, arrPointsSet[point].y]);
        }
      }

      if (!PAGE_OPTIONS.dataSet.series[index].smoothedLine && arrPointsSet.length > 1)
        line.push.apply(line, ["L", arrPointsSet[arrPointsSet.length - 2].x, arrPointsSet[arrPointsSet.length - 2].y]);
      line.push.apply(line, ["L", arrPointsSet[arrPointsSet.length - 1].x, arrPointsSet[arrPointsSet.length - 1].y]);
      area.push.apply(area, line);
      d = ["L", arrPointsSet[arrPointsSet.length - 1].x, (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fullChartHeight + PAGE_DATA.fcMarginTop), "L", PAGE_DATA.marginLeft + (scaleX / 2), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fullChartHeight + PAGE_DATA.fcMarginTop), "Z"];
      area.push.apply(area, d);

      var color = PAGE_OPTIONS.dataSet.series[index].color || $SC.util.getColor(index);
      strSeries += "<path id='fLine_" + index + "' stroke='" + color + "' fill='none' d='" + line.join(" ") + "' stroke-width='1' opacity='1'></path>";
      strSeries += "<path id='fArea_" + index + "' stroke='none' fill='url(#" + PAGE_OPTIONS.targetElem + "-areachart-gradLinear" + index + ")' d='" + area.join(" ") + "' stroke-width='1' opacity='1'></path>";

      self._PAGE_DATA.objChart.querySelector("#fullSeriesContr").insertAdjacentHTML("beforeend", strSeries);
    } /*End drawFullSeries()*/

  } /*End createFullChart()*/

  function prepareDataSet(dataSet) {
    var maxSet = [],
      minSet = [],
      categories = [];
    dataSet = dataSet || PAGE_OPTIONS.dataSet.series;

    for (var i = 0; i < dataSet.length; i++) {
      var arrData = [];
      for (var j = 0; j < dataSet[i].data.length; j++) {
        arrData.push(dataSet[i].data[j].value);
        if (categories.indexOf(dataSet[i].data[j].label) < 0)
          categories.push(dataSet[i].data[j].label);
      }
      var maxVal = Math.max.apply(null, arrData);
      var minVal = Math.min.apply(null, arrData);
      maxSet.push(maxVal);
      minSet.push(minVal);
    }
    PAGE_OPTIONS.dataSet.xAxis.categories = categories;
    PAGE_DATA.maxima = Math.max.apply(null, maxSet);
    PAGE_DATA.minima = Math.min.apply(null, minSet);
    PAGE_DATA.maxima = round(PAGE_DATA.maxima);

    //fire Event afterParseData
    var afterParseDataEvent = new self.Event("afterParseData", {
      srcElement: self
    });
    self.dispatchEvent(afterParseDataEvent);
  } /*End prepareDataSet()*/

  function createSeries(dataSet, index, scaleX) {
    var d = [];
    var elemSeries = self._PAGE_DATA.objChart.querySelector("#series_" + index);
    var elemActualSeries = self._PAGE_DATA.objChart.querySelector("#series_actual_" + index);
    if (elemSeries) elemSeries.parentNode.removeChild(elemSeries);
    if (elemActualSeries) elemActualSeries.parentNode.removeChild(elemActualSeries);

    if (dataSet.length < 1)
      return;
    var interval = scaleX || (PAGE_DATA.gridBoxWidth / (dataSet.length));
    var scaleY = (PAGE_DATA.gridBoxHeight / PAGE_DATA.maxima);
    var arrPointsSet = [],
      strSeries = "";

    /* ploting actual points */
    var strSeries = "<g id='series_actual_" + index + "' class='series' pointer-events='none' >";
    for (var dataCount = 0; dataCount < dataSet.length; dataCount++) {
      var p = new $SC.geom.Point(PAGE_DATA.marginLeft + (dataCount * scaleX) + (interval / 2), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight) - (dataSet[dataCount].value * scaleY));
      if (dataCount === 0)
        d.push("M");
      else
        d.push("L");
      d.push(p.x);
      d.push(p.y);
      arrPointsSet.push(p);
    }

    var color = PAGE_OPTIONS.dataSet.series[index].color || $SC.util.getColor(index);
    var strokeWidth = PAGE_OPTIONS.dataSet.series[index].lineWidth || 3;
    var areaOpacity = PAGE_OPTIONS.dataSet.series[index].areaOpacity || 0.3;
    areaOpacity = PAGE_OPTIONS.dataSet.series[index].showGradient ? 1 : areaOpacity;
    var fill = PAGE_OPTIONS.dataSet.series[index].showGradient ? "url(#" + PAGE_OPTIONS.targetElem + "-areachart-gradLinear" + index + ")" : color;

    if (PAGE_OPTIONS.dataSet.series[index].smoothedLine)
      strSeries += "<path stroke='" + color + "' fill='none' d='" + d.join(" ") + "' stroke-dasharray='1,1' stroke-width='1' opacity='1'></path>";
    else
      strSeries += "<path stroke='" + color + "' fill='none' d='" + d.join(" ") + "' stroke-width='" + strokeWidth + "' opacity='1'></path>";
    strSeries += "</g>";
    if (dataSet.length < 50)
      self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strSeries);
    PAGE_DATA.series.push(arrPointsSet);

    var line = [],
      area = [];
    strSeries = "<g id='series_" + index + "' class='series' pointer-events='none' >";

    line.push.apply(line, ["M", arrPointsSet[0].x, arrPointsSet[0].y]);
    var point = 0;
    for (var point = 0;
      (point + 2) < arrPointsSet.length; point++) {
      if (PAGE_OPTIONS.dataSet.series[index].smoothedLine) {
        var curve = $SC.geom.describeBezireArc(arrPointsSet[point], arrPointsSet[point + 1], arrPointsSet[point + 2]);
        line.push.apply(line, curve);
      } else {
        line.push.apply(line, ["L", arrPointsSet[point].x, arrPointsSet[point].y]);
      }
    }

    if (!PAGE_OPTIONS.dataSet.series[index].smoothedLine && arrPointsSet.length > 1)
      line.push.apply(line, ["L", arrPointsSet[arrPointsSet.length - 2].x, arrPointsSet[arrPointsSet.length - 2].y]);
    line.push.apply(line, ["L", arrPointsSet[arrPointsSet.length - 1].x, arrPointsSet[arrPointsSet.length - 1].y]);

    area.push.apply(area, line);
    d = ["L", arrPointsSet[arrPointsSet.length - 1].x, PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight, "L", PAGE_DATA.marginLeft + (interval / 2), PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight, "Z"];
    area.push.apply(area, d);

    strSeries += "<path id='area_" + index + "' stroke='none' fill='" + fill + "' d='" + area.join(" ") + "' stroke-width='1' opacity='" + areaOpacity + "'></path>";
    strSeries += "<path id='line_" + index + "' stroke='" + color + "' fill='none' d='" + line.join(" ") + "' stroke-width='" + strokeWidth + "' opacity='1'></path>";

    var radius = PAGE_OPTIONS.dataSet.series[index].markerRadius || 4;
    if (!PAGE_OPTIONS.dataSet.series[index].noPointMarker) {
      for (var point = 0;
        (point + 2) < arrPointsSet.length; point++) {
        if (dataSet.length < 30) {
          strSeries += "<circle cx=" + arrPointsSet[point + 1].x + " cy=" + arrPointsSet[point + 1].y + " r='" + radius + "' class='dot' style='fill:" + color + "; opacity: 1; stroke-width: 1px;'></circle>";
          strSeries += "<circle cx=" + arrPointsSet[point + 1].x + " cy=" + arrPointsSet[point + 1].y + " r='2' class='dot' style='fill:white; opacity: 1; stroke-width: 1px;'></circle>";
        }
      }
    }
    strSeries += "</g>";
    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strSeries);

  } /*End createSeries()*/

  function appendGradFill(index) {
    /*Creating gradient fill for area*/
    var color = PAGE_OPTIONS.dataSet.series[index].color || $SC.util.getColor(index);
    var areaOpacity = PAGE_OPTIONS.dataSet.series[index].areaOpacity || 0.5;
    var strSVG = "";
    strSVG += "<defs>";
    strSVG += "  <linearGradient gradientUnits = 'userSpaceOnUse' id='" + PAGE_OPTIONS.targetElem + "-areachart-gradLinear" + index + "' x1='0%' y1='0%' x2='100%' y2='0%'>";
    strSVG += "  <stop offset='0%' style='stop-color:white;stop-opacity:" + areaOpacity + "' />";
    strSVG += "  <stop offset='100%' style='stop-color:" + color + ";stop-opacity:" + areaOpacity + "' />";
    strSVG += "  </linearGradient>";
    strSVG += "</defs>";
    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strSVG);
  } /*End appendGradFill()*/

  function createLegands(index) {
    var seriesLegend = self._PAGE_DATA.objChart.querySelector("#legendContainer #series_legend_" + index);
    if (seriesLegend) seriesLegend.parentNode.removeChild(seriesLegend);

    /*Creating series legend*/
    var color = PAGE_OPTIONS.dataSet.series[index].color || $SC.util.getColor(index);
    var strSVG = "";
    strSVG = "<g id='series_legend_" + index + "' style='cursor:pointer;'>";
    strSVG += "<rect id='legend_color_" + index + "' x='" + PAGE_DATA.marginLeft + "' y='" + (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + 130) + "' width='10' height='10' fill='" + color + "' stroke='none' stroke-width='1' opacity='1'></rect>";
    strSVG += "<text id='legend_txt_" + index + "' font-size='12' x='" + (PAGE_DATA.marginLeft + 20) + "' y='" + (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + 140) + "' fill='#717171' font-family='Verdana' >" + PAGE_OPTIONS.dataSet.series[index].name + "</text>";
    strSVG += "</g>";
    self._PAGE_DATA.objChart.querySelector("#legendContainer").insertAdjacentHTML("beforeend", strSVG);
  }


  function createGrid() {
    PAGE_DATA.gridBoxWidth = (PAGE_DATA.svgCenter.x * 2) - PAGE_DATA.marginLeft - PAGE_DATA.marginRight;
    PAGE_DATA.gridBoxHeight = (PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginTop - PAGE_DATA.marginBottom;
    PAGE_DATA.gridHeight = (((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginTop - PAGE_DATA.marginBottom) / (PAGE_CONST.hGridCount - 1));
    var hGrid = self._PAGE_DATA.objChart.querySelector("#hGrid");
    if (hGrid) hGrid.parentNode.removeChild(hGrid);

    var strGrid = "";
    strGrid += "<g id='hGrid' >";
    for (var gridCount = 0; gridCount < PAGE_CONST.hGridCount; gridCount++) {
      var d = ["M", PAGE_DATA.marginLeft, PAGE_DATA.marginTop + (gridCount * PAGE_DATA.gridHeight), "L", PAGE_DATA.marginLeft + PAGE_DATA.gridBoxWidth, PAGE_DATA.marginTop + (gridCount * PAGE_DATA.gridHeight)];
      strGrid += "<path fill='none' d='" + d.join(" ") + "' stroke='#D8D8D8' stroke-width='1' stroke-opacity='1'></path>";
    }
    var d = ["M", PAGE_DATA.marginLeft, PAGE_DATA.marginTop, "L", PAGE_DATA.marginLeft, PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + 10];
    strGrid += "<rect id='gridRect' x='" + PAGE_DATA.marginLeft + "' y='" + PAGE_DATA.marginTop + "' width='" + PAGE_DATA.gridBoxWidth + "' height='" + PAGE_DATA.gridBoxHeight + "' pointer-events='all' style='fill:none;stroke-width:0;stroke:#717171;' \/>";
    strGrid += "<path id='gridBoxLeftBorder' d='" + d.join(" ") + "' fill='none' stroke='#333' stroke-width='1' opacity='1'></path>";
    strGrid += "</g>";
    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strGrid);
    createVerticalLabel();
  } /*End createGrid()*/

  function createVerticalLabel() {
    var vTextLabel = self._PAGE_DATA.objChart.querySelector("#vTextLabel");
    if (vTextLabel) vTextLabel.parentNode.removeChild(vTextLabel);

    var interval = (PAGE_DATA.maxima) / (PAGE_CONST.hGridCount - 1);
    var strText = "<g id='vTextLabel'>";
    for (var gridCount = PAGE_CONST.hGridCount - 1, i = 0; gridCount >= 0; gridCount--) {
      var value = (i++ * interval);
      value = (value >= 1000 ? (value / 1000).toFixed(2) + "K" : value.toFixed(2));
      strText += "<text font-family='Lato' fill='black'><tspan x='" + (PAGE_DATA.marginLeft - 55) + "' y='" + (PAGE_DATA.marginTop + (gridCount * PAGE_DATA.gridHeight) + 5) + "' font-size='12' >" + ((PAGE_OPTIONS.dataSet.yAxis.prefix) ? PAGE_OPTIONS.dataSet.yAxis.prefix : "") + value + "<\/tspan></text>";
      var d = ["M", PAGE_DATA.marginLeft, (PAGE_DATA.marginTop + (gridCount * PAGE_DATA.gridHeight)), "L", (PAGE_DATA.marginLeft - 5), (PAGE_DATA.marginTop + (gridCount * PAGE_DATA.gridHeight))];
      strText += "<path fill='none' d='" + d.join(" ") + "' stroke='#333' stroke-width='1' opacity='1'></path>";
    }
    strText += "</g>";
    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strText);

    var overFlow = 0;
    var vTextLabel = self._PAGE_DATA.objChart.querySelectorAll("#vTextLabel tspan");
    for (var i = 0; i < vTextLabel.length; i++) {
      if ((PAGE_DATA.marginLeft - vTextLabel[i].getComputedTextLength() - 50) < 0)
        overFlow = Math.abs((PAGE_DATA.marginLeft - vTextLabel[i].getComputedTextLength() - 50));
    }
    if (overFlow !== 0) {
      PAGE_DATA.marginLeft = PAGE_DATA.marginLeft + overFlow;
      createGrid();
    }
  } /*End createVerticalLabel()*/

  function createHorizontalLabel(categories, scaleX) {
    var hTextLabel = self._PAGE_DATA.objChart.querySelector("#hTextLabel");
    if (hTextLabel) hTextLabel.parentNode.removeChild(hTextLabel);

    var interval = scaleX || (PAGE_DATA.gridBoxWidth / (categories.length));

    /*if there is too much categories then discard some categories*/
    if (interval < 30) {
      var newCategories = [],
        skipLen = Math.ceil(30 / interval);
      for (var i = 0; i < categories.length; i += skipLen) {
        newCategories.push(categories[i]);
      }
      categories = newCategories;
      interval *= skipLen;
    }
    var strText = "<g id='hTextLabel'>";
    for (var hText = 0; hText < categories.length; hText++) {
      strText += "<text font-family='Lato' text-anchor='middle' dominant-baseline='central' fill='black' title='" + categories[hText] + "' x='" + (PAGE_DATA.marginLeft + (hText * interval) + (interval / 2)) + "' y='" + (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + 20) + "' ><tspan  font-size='12' >" + categories[hText] + "<\/tspan></text>";
    }

    for (var hText = 0; hText < categories.length; hText++) {
      var d = ["M", (PAGE_DATA.marginLeft + (hText * interval) + (interval)), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight), "L", (PAGE_DATA.marginLeft + (hText * interval) + (interval)), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + 10)];
      strText += "<path fill='none' d='" + d.join(" ") + "' stroke='#333' stroke-width='1' opacity='1'></path>";
    }
    var d = ["M", PAGE_DATA.marginLeft, PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight, "L", PAGE_DATA.marginLeft + PAGE_DATA.gridBoxWidth, PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight];
    strText += "<path id='gridBoxBottomBorder' d='" + d.join(" ") + "' fill='none' stroke='#333' stroke-width='1' opacity='1'></path>";
    strText += "</g>";

    /*bind hover event*/
    self._PAGE_DATA.objChart.insertAdjacentHTML("beforeend", strText);
    var hTextLabels = self._PAGE_DATA.objChart.querySelectorAll("#hTextLabel text");
    var totalHTextWidth = 0;
    for (var i = 0; i < hTextLabels.length; i++) {
      var txWidth = hTextLabels[i].getComputedTextLength();
      totalHTextWidth += (txWidth);
    }

    for (var i = 0; i < hTextLabels.length; i++) {
      var txtWidth = hTextLabels[i].querySelector("tspan").getComputedTextLength();
      if (parseFloat(totalHTextWidth + (hTextLabels.length * 5)) < parseFloat(PAGE_DATA.gridBoxWidth)) {
        while (txtWidth + 5 > interval) {
          hTextLabels[i].querySelector("tspan").textContent = hTextLabels[i].querySelector("tspan").textContent.substring(0, (hTextLabels[i].querySelector("tspan").textContent.length - 4)) + "...";
          txtWidth = (hTextLabels[i].querySelector("tspan").getComputedTextLength());
        }
      }

      hTextLabels[i].addEventListener("mouseenter", function (e) {
        e.stopPropagation();
        var mousePointer = $SC.ui.cursorPoint(PAGE_OPTIONS.targetElem, e);
        $SC.ui.toolTip(PAGE_OPTIONS.targetElem, mousePointer, "#555", e.target.getAttribute("title"));
      }, false);

      hTextLabels[i].addEventListener("mouseleave", function (e) {
        e.stopPropagation();
        $SC.ui.toolTip(PAGE_OPTIONS.targetElem, "hide");
      }, false);

    }

  } /*End createHorizontalLabel()*/


  function resetTextPositions() {
    var txtTitleLen = self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtTitle").getComputedTextLength();
    var txtSubTitleLen = self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtSubtitle").getComputedTextLength();
    var txtTitleGrp = self._PAGE_DATA.objChart.querySelector("#txtTitleGrp");


    if (txtTitleLen > PAGE_CONST.FIX_WIDTH) {
      var fontSize = self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtTitle").getAttribute("font-size");
      self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtTitle").setAttribute("font-size", fontSize - 5);
      self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtTitle").getComputedTextLength();
      fontSize = self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtSubtitle").getAttribute("font-size");
      self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtSubtitle").setAttribute("font-size", fontSize - 3);
      txtSubTitleLen = self._PAGE_DATA.objChart.querySelector("#txtTitleGrp #txtSubtitle").getComputedTextLength();
    }

    txtTitleGrp.querySelector("#txtTitle").setAttribute("x", (PAGE_DATA.svgCenter.x - (txtTitleLen / 2)));
    txtTitleGrp.querySelector("#txtTitle").setAttribute("y", 70);
    txtTitleGrp.querySelector("#txtSubtitle").setAttribute("x", (PAGE_DATA.svgCenter.x - (txtSubTitleLen / 2)));
    txtTitleGrp.querySelector("#txtSubtitle").setAttribute("y", 90);

    /*Reset vertical text label*/
    var arrVLabels = self._PAGE_DATA.objChart.querySelectorAll("#vTextLabel");
    var vLabelwidth = arrVLabels[0].getBBox().width;
    var arrVText = self._PAGE_DATA.objChart.querySelectorAll("#vTextLabel tspan");
    for (var i = 0; i < arrVText.length; i++)
      arrVText[i].setAttribute("x", (PAGE_DATA.marginLeft - vLabelwidth - 10));

    /*Reset horzontal text label*/
    var totalHTextWidth = 0;
    var arrHText = self._PAGE_DATA.objChart.querySelectorAll("#hTextLabel text");
    for (var i = 0; i < arrHText.length; i++) {
      var txWidth = arrHText[i].getComputedTextLength();
      totalHTextWidth += (txWidth);
    }
    var interval = 70;
    if (parseFloat(totalHTextWidth + (arrHText.length * 10)) > parseFloat(PAGE_DATA.gridBoxWidth)) {
      for (var i = 0; i < arrHText.length; i++) {
        var cx = arrHText[i].getAttribute("x");
        var cy = arrHText[i].getAttribute("y");

        txWidth = arrHText[i].querySelector("tspan").getComputedTextLength();
        arrHText[i].setAttribute("transform", "translate(0," + (10) + ")rotate(-45," + (cx) + "," + (cy) + ")");

        if (txWidth + 15 > interval) {
          var fontSize = arrHText[i].querySelector("tspan").getAttribute("font-size");
          arrHText[i].querySelector("tspan").setAttribute("font-size", (fontSize - 2));
          txWidth = arrHText[i].querySelector("tspan").getComputedTextLength();
        }
        while (txWidth + 15 > interval) {
          arrHText[i].querySelector("tspan").textContent = arrHText[i].querySelector("tspan").textContent.substring(0, (arrHText[i].querySelector("tspan").textContent.length - 4)) + "...";
          txWidth = (arrHText[i].querySelector("tspan").getComputedTextLength());
        }
      }
    }

    var vTxtSubTitle = self._PAGE_DATA.objChart.querySelector("#vTextSubTitle");
    vTxtSubTitle.setAttribute("transform", "matrix(0,-1,1,0," + (PAGE_DATA.marginLeft - vLabelwidth - 30) + "," + (PAGE_DATA.svgCenter.y) + ")");
    vTxtSubTitle.setAttribute("x", 0);
    vTxtSubTitle.setAttribute("y", 0);

    /*Set position for legend text*/
    var arrLegendText = self._PAGE_DATA.objChart.querySelectorAll("#legendContainer text");
    var arrLegendColor = self._PAGE_DATA.objChart.querySelectorAll("#legendContainer rect");
    var width = 0,
      row = 0;
    for (var i = 0; i < arrLegendText.length; i++) {
      arrLegendColor[i].setAttribute("x", (width + PAGE_DATA.marginLeft - 60));
      arrLegendText[i].setAttribute("x", (width + PAGE_DATA.marginLeft + 20 - 60));
      arrLegendColor[i].setAttribute("y", (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + PAGE_DATA.fullChartHeight + 10 + (row * 20)));
      arrLegendText[i].setAttribute("y", (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + PAGE_DATA.fullChartHeight + 20 + (row * 20)));
      width += (arrLegendText[i].getBBox().width + 50);

      if (width > PAGE_CONST.FIX_WIDTH) {
        width = 0;
        row++;
        arrLegendColor[i].setAttribute("x", (width + PAGE_DATA.marginLeft - 60));
        arrLegendText[i].setAttribute("x", (width + PAGE_DATA.marginLeft + 20 - 60));
        arrLegendColor[i].setAttribute("y", (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + PAGE_DATA.fullChartHeight + 10 + (row * 20)));
        arrLegendText[i].setAttribute("y", (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + PAGE_DATA.fullChartHeight + 20 + (row * 20)));
        width += (arrLegendText[i].getBBox().width + 50);
      }

    }

  } /*End resetTextPositions()*/

  function bindEvents() {
    PAGE_DATA.windowRightIndex = (PAGE_DATA.windowRightIndex < 0) ? PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length : PAGE_DATA.windowRightIndex;
    PAGE_DATA.newDataSet = [], PAGE_DATA.newCatgList = [];

    for (var i = PAGE_DATA.windowLeftIndex; i <= PAGE_DATA.windowRightIndex; i++)
      PAGE_DATA.newCatgList.push(PAGE_OPTIONS.dataSet.xAxis.categories[i % PAGE_OPTIONS.dataSet.xAxis.categories.length]);

    for (var setIndex = 0; setIndex < PAGE_OPTIONS.dataSet.series.length; setIndex++) {
      var set = PAGE_OPTIONS.dataSet.series[setIndex].data.slice(PAGE_DATA.windowLeftIndex, PAGE_DATA.windowRightIndex + 1);
      PAGE_DATA.newDataSet.push(set);
    }

    for (var index = 0; index < PAGE_OPTIONS.dataSet.series.length; index++) {
      var legend = self._PAGE_DATA.objChart.querySelector("#series_legend_" + index);
      if (legend) {
        legend.removeEventListener("click", onLegendClick);
        legend.addEventListener("click", onLegendClick, false);
      }
    }

    var gridRect = self._PAGE_DATA.objChart.querySelector("#gridRect");
    if (gridRect) {
      gridRect.removeEventListener("mousemove", onMouseMove);
      gridRect.addEventListener("mousemove", onMouseMove, false);
      gridRect.removeEventListener("click", onMouseMove);
      gridRect.addEventListener("click", onMouseMove, false);
      gridRect.removeEventListener("mousleave", onMouseLeave);
      gridRect.addEventListener("mouseleave", onMouseLeave, false);
    }

    var zoomOutBox = self._PAGE_DATA.objChart.querySelector("#zoomOutBox");
    if (zoomOutBox) {
      zoomOutBox.removeEventListener("click", onZoomOut);
      zoomOutBox.addEventListener("click", onZoomOut, false);
    }

    window.removeEventListener('resize', onWindowResize);
    window.addEventListener('resize', onWindowResize, true);
  } /*End bindEvents()*/


  var timeOut = null;
  var onWindowResize = function () {
    var containerDiv = document.querySelector("#" + PAGE_OPTIONS.targetElem);
    if (PAGE_CONST.runId != containerDiv.getAttribute("runId")) {
      window.removeEventListener('resize', onWindowResize);
      if (timeOut != null) {
        clearTimeout(timeOut);
      }
      return;
    }
    if (containerDiv.offsetWidth !== PAGE_CONST.FIX_WIDTH || containerDiv.offsetHeight !== PAGE_CONST.FIX_HEIGHT) {
      if (timeOut != null) {
        clearTimeout(timeOut);
      }
      callChart();

      function callChart() {
        if (containerDiv) {
          if (containerDiv.offsetWidth === 0 && containerDiv.offsetHeight === 0) {
            timeOut = setTimeout(function () {
              callChart();
            }, 100);
          } else {
            timeOut = setTimeout(function () {
              init();
            }, 500);
          }
        }
      }
    }
  }; /*End onWindowResize()*/

  function onMouseMove(e) {
    try {
      e.stopPropagation();

      var mousePointer = $SC.ui.cursorPoint(PAGE_OPTIONS.targetElem, e);
      var gridBox = self._PAGE_DATA.objChart.querySelector("#hGrid").getBBox();
      if (mousePointer.x >= gridBox.x && mousePointer.x < (gridBox.x + PAGE_DATA.gridBoxWidth) && mousePointer.y >= gridBox.y && mousePointer.y < (gridBox.y + PAGE_DATA.gridBoxHeight)) {
        var multiSeriesPoints = [];
        for (var i = 0; i < PAGE_DATA.series.length; i++) {
          if (self._PAGE_DATA.objChart.querySelector("#series_" + i).style.display === "none")
            continue;
          for (var j = 0; j < PAGE_DATA.series[i].length - 1; j++) {
            if (mousePointer.x > PAGE_DATA.series[i][j].x && mousePointer.x < PAGE_DATA.series[i][j + 1].x) {
              multiSeriesPoints.push({
                seriesIndex: i,
                pointIndex: j + 1,
                point: PAGE_DATA.series[i][j + 1]
              });
            }
          }
          if (mousePointer.x < PAGE_DATA.series[i][0].x)
            multiSeriesPoints.push({
              seriesIndex: i,
              pointIndex: 0,
              point: PAGE_DATA.series[i][0]
            });
        }
        if (multiSeriesPoints.length === 0)
          return;

        var toolTipPoint, npIndex, indx;
        for (var i = 0; i < multiSeriesPoints.length; i++) {
          if (mousePointer.y > multiSeriesPoints[i].point.y || PAGE_DATA.series.length === 1) {
            toolTipPoint = multiSeriesPoints[i].point;
            npIndex = multiSeriesPoints[i].pointIndex;
            indx = multiSeriesPoints[i].seriesIndex;
          }
        }
        if (!indx && multiSeriesPoints.length > 0) {
          toolTipPoint = multiSeriesPoints[0].point;
          npIndex = multiSeriesPoints[0].pointIndex;
          indx = multiSeriesPoints[0].seriesIndex;
        }

        var toolTipPoint = PAGE_DATA.series[indx][npIndex];

        /*Create vertical line*/
        var vLinePath = ["M", toolTipPoint.x, toolTipPoint.y, "L", toolTipPoint.x, PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight];
        var vLine = self._PAGE_DATA.objChart.querySelector("#vLine");
        if (vLine) {
          vLine.setAttribute("d", vLinePath.join(" "));
          vLine.parentNode.removeChild(vLine);
          self._PAGE_DATA.objChart.appendChild(vLine);
        }

        if (toolTipPoint) {
          var elms = self._PAGE_DATA.objChart.querySelectorAll(".tooTipPoint");
          for (var i = 0; i < elms.length; i++)
            elms[i].parentNode.removeChild(elms[i]);

          var color = PAGE_OPTIONS.dataSet.series[indx].color || $SC.util.getColor(indx);
          var radius = PAGE_OPTIONS.dataSet.series[indx].markerRadius || 4;
          $SC.geom.createDot(toolTipPoint, "#FFF", (radius + 2), 1, "tooTipPoint", "areaChart", color);
          $SC.geom.createDot(toolTipPoint, color, radius, 1, "tooTipPoint", "areaChart");

          var toolTipRow1, toolTipRow2;
          toolTipRow1 = (PAGE_OPTIONS.dataSet.xAxis.title + " " + PAGE_DATA.newCatgList[npIndex]);
          toolTipRow2 = (PAGE_OPTIONS.dataSet.yAxis.title + " " + (PAGE_OPTIONS.dataSet.yAxis.prefix || "") + " " + PAGE_DATA.newDataSet[indx][npIndex].value);

          /*point should be available globally*/
          var point = PAGE_DATA.newDataSet[indx][npIndex];
          point["series"] = {
            name: PAGE_OPTIONS.dataSet.series[indx].name
          };

          if (PAGE_OPTIONS.toolTip && PAGE_OPTIONS.toolTip.content) {
            var toolTipContent = PAGE_OPTIONS.toolTip.content.replace(/{{/g, "${").replace(/}}/g, "}");
            var genContent = $SC.util.assemble(toolTipContent, "point");
            $SC.ui.toolTip(PAGE_OPTIONS.targetElem, toolTipPoint, color, genContent(point), "html");
          } else
            $SC.ui.toolTip(PAGE_OPTIONS.targetElem, toolTipPoint, color, toolTipRow1, toolTipRow2);

          self._PAGE_DATA.objChart.querySelector("#vLine").style.display = "block";
        }
      }
    } catch (ex) {
      console.log(ex);
    }
  } /*End onMouseMove()*/

  function onMouseLeave() {
    $SC.ui.toolTip(PAGE_OPTIONS.targetElem, "hide");
    self._PAGE_DATA.objChart.querySelectorAll(".tooTipPoint");
    var elms = self._PAGE_DATA.objChart.querySelectorAll(".tooTipPoint");
    for (var i = 0; i < elms.length; i++)
      elms[i].parentNode.removeChild(elms[i]);

    var vLine = self._PAGE_DATA.objChart.querySelector("#vLine");
    if (vLine) vLine.style.display = "none";

  } /*End onMouseLeave()*/

  function onLegendClick(e) {
    var seriesIndex = e.target.id.split("_")[2];
    var legendColor = self._PAGE_DATA.objChart.querySelector("#legend_color_" + seriesIndex);
    var area = self._PAGE_DATA.objChart.querySelector("#series_" + seriesIndex);
    var actualArea = self._PAGE_DATA.objChart.querySelector("#series_actual_" + seriesIndex);
    var color = PAGE_OPTIONS.dataSet.series[seriesIndex].color || $SC.util.getColor(seriesIndex);

    if (legendColor.getAttribute("fill") === "#eee") {
      legendColor.setAttribute("fill", color);
      area.style.display = "block";
      if (actualArea) actualArea.style.display = "block";
    } else {
      legendColor.setAttribute("fill", "#eee");
      area.style.display = "none";
      if (actualArea) actualArea.style.display = "none";
    }
  } /*End onLegendClick()*/

  function bindSliderEvents() {
    self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("mousedown", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 1;
      self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("mousemove", bindLeftSliderMove);
      self._PAGE_DATA.objChart.addEventListener("mousemove", bindLeftSliderMove);
    });

    self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("mouseup", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 0;
      self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").removeEventListener("mousemove", bindLeftSliderMove);
      self._PAGE_DATA.objChart.removeEventListener("mousemove", bindLeftSliderMove);
      resetSliderPos("left", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
      reDrawSeries();
    });

    self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("mouseleave", function (e) {
      e.stopPropagation();
      self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").removeEventListener("mousemove", bindLeftSliderMove);
    });

    self._PAGE_DATA.objChart.addEventListener("mouseup", function (e) {
      e.stopPropagation();
      if (PAGE_DATA.mouseDown === 1) {
        self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").removeEventListener("mousemove", bindLeftSliderMove);
        self._PAGE_DATA.objChart.removeEventListener("mousemove", bindLeftSliderMove);
        self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").removeEventListener("mousemove", bindRightSliderMove);
        self._PAGE_DATA.objChart.removeEventListener("mousemove", bindRightSliderMove);
        if (e.target.id === "sliderRight")
          resetSliderPos("right", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);
        else
          resetSliderPos("left", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
        reDrawSeries();
      }
      PAGE_DATA.mouseDown = 0;
    });

    self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("mousedown", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 1;
      self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("mousemove", bindRightSliderMove);
      self._PAGE_DATA.objChart.addEventListener("mousemove", bindRightSliderMove);
    });

    self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("mouseup", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 0;
      self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").removeEventListener("mousemove", bindRightSliderMove);
      self._PAGE_DATA.objChart.removeEventListener("mousemove", bindRightSliderMove);
      resetSliderPos("right", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);
      reDrawSeries();
    });

    self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("mouseleave", function (e) {
      e.stopPropagation();
      self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").removeEventListener("mousemove", bindRightSliderMove);
    });

    /*Events for touch devices*/

    self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("touchstart", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 1;
      self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("touchmove", bindLeftSliderMove);
      self._PAGE_DATA.objChart.addEventListener("touchmove", bindLeftSliderMove);
    }, false);

    self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").addEventListener("touchend", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 0;
      self._PAGE_DATA.objChart.querySelector("#sliderLeftHandle").removeEventListener("touchmove", bindLeftSliderMove);
      self._PAGE_DATA.objChart.removeEventListener("touchmove", bindLeftSliderMove);
      resetSliderPos("left", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
      reDrawSeries();
    }, false);

    self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("touchstart", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 1;
      self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("touchmove", bindRightSliderMove);
      self._PAGE_DATA.objChart.addEventListener("touchmove", bindRightSliderMove);
    });

    self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").addEventListener("touchend", function (e) {
      e.stopPropagation();
      PAGE_DATA.mouseDown = 0;
      self._PAGE_DATA.objChart.querySelector("#sliderRightHandle").removeEventListener("touchmove", bindRightSliderMove);
      self._PAGE_DATA.objChart.removeEventListener("touchmove", bindRightSliderMove);
      resetSliderPos("right", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);
      reDrawSeries();
    });


  } /*End bindSliderEvents()*/

  function bindLeftSliderMove(e) {
    e.stopPropagation();
    e.preventDefault();
    var mousePointer = $SC.ui.cursorPoint(PAGE_OPTIONS.targetElem, e.changedTouches ? e.changedTouches[0] : e);

    var sliderLsel = self._PAGE_DATA.objChart.querySelector("#slideLSel").getBBox();
    var sliderRsel = self._PAGE_DATA.objChart.querySelector("#slideRSel").getBBox();

    if (sliderLsel.x + (PAGE_DATA.fsScaleX * 2) > sliderRsel.x && e.movementX > 0) {
      self._PAGE_DATA.objChart.querySelector("#slideLSel").removeEventListener("mousemove", bindLeftSliderMove);
      self._PAGE_DATA.objChart.removeEventListener("mousemove", bindLeftSliderMove);
      resetSliderPos("left", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
      reDrawSeries();
      return;
    }

    if (mousePointer.x > (PAGE_DATA.marginLeft) && mousePointer.x < ((PAGE_DATA.svgCenter.x * 2) - PAGE_DATA.marginRight)) {
      for (var j = 0; j < PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length - 1; j++) {
        if (mousePointer.x >= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j].x && mousePointer.x <= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j + 1].x)
          if (e.movementX <= 0)
            PAGE_DATA.windowLeftIndex = j;
          else
            PAGE_DATA.windowLeftIndex = j + 1;
      }
      resetSliderPos("left", mousePointer.x);
    }
  } /*End bindLeftSliderMove()*/

  function bindRightSliderMove(e) {
    e.stopPropagation();
    e.preventDefault();
    var mousePointer = $SC.ui.cursorPoint(PAGE_OPTIONS.targetElem, e.changedTouches ? e.changedTouches[0] : e);
    var sliderLsel = self._PAGE_DATA.objChart.querySelector("#slideLSel").getBBox();
    var sliderRsel = self._PAGE_DATA.objChart.querySelector("#slideRSel").getBBox();

    if (sliderRsel.x - (PAGE_DATA.fsScaleX * 2) <= (sliderLsel.x) && e.movementX <= 0) {
      self._PAGE_DATA.objChart.querySelector("#slideLSel").removeEventListener("mousemove", bindRightSliderMove);
      self._PAGE_DATA.objChart.removeEventListener("mousemove", bindRightSliderMove);
      resetSliderPos("right", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);
      reDrawSeries();
      return;
    }
    if (mousePointer.x > (PAGE_DATA.marginLeft + PAGE_DATA.scaleX) && mousePointer.x < ((PAGE_DATA.svgCenter.x * 2) - PAGE_DATA.marginRight)) {
      for (var j = 1; j < PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length; j++) {
        if (mousePointer.x >= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j - 1].x && mousePointer.x <= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j].x)
          if (e.movementX <= 0)
            PAGE_DATA.windowRightIndex = j - 1;
          else
            PAGE_DATA.windowRightIndex = j;
      }
      if (mousePointer.x > PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length - 1].x) {
        PAGE_DATA.windowRightIndex = PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length - 1;
      }
      resetSliderPos("right", mousePointer.x);
    }
  } /*End bindRightSliderMove()*/

  function resetSliderPos(type, x) {
    var sliderSel = (type === "right") ? "slideRSel" : "slideLSel";
    var sliderLine = (type === "right") ? "sliderRight" : "sliderLeft";
    var innerBarType = (type === "right") ? "slideRSelInner" : "slideLSelInner";
    var swipeFlag = (type === "right") ? 1 : 0;
    x = (x <= 0 ? PAGE_DATA.marginLeft : x);

    var dr = ["M", x, ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fullChartHeight + PAGE_DATA.fcMarginTop), "L", x, ((PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + PAGE_DATA.fcMarginTop)];
    var innerBar = ["M", (type === "right" ? (x + 3) : (x - 3)), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + (PAGE_DATA.fullChartHeight / 2) - 5), "L", (type === "right" ? (x + 3) : (x - 3)), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + (PAGE_DATA.fullChartHeight / 2) + 5),
      "M", (type === "right" ? (x + 5) : (x - 5)), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + (PAGE_DATA.fullChartHeight / 2) - 5), "L", (type === "right" ? (x + 5) : (x - 5)), (PAGE_DATA.marginTop + PAGE_DATA.gridBoxHeight + PAGE_DATA.fcMarginTop + (PAGE_DATA.fullChartHeight / 2) + 5)
    ];

    var cy = (PAGE_DATA.svgCenter.y * 2) - PAGE_DATA.marginBottom + (PAGE_DATA.fullChartHeight / 2) + PAGE_DATA.fcMarginTop;
    self._PAGE_DATA.objChart.querySelector("#" + sliderSel).setAttribute("d", $SC.geom.describeEllipticalArc(x, cy, 15, 15, 180, 360, swipeFlag).d);
    self._PAGE_DATA.objChart.querySelector("#" + sliderLine).setAttribute("d", dr.join(" "));
    self._PAGE_DATA.objChart.querySelector("#" + innerBarType).setAttribute("d", innerBar.join(" "));
    var fullSeries = self._PAGE_DATA.objChart.querySelector("#fullSeriesContr #outerFrame");

    if (type === "left") {
      var sliderOffset = self._PAGE_DATA.objChart.querySelector("#sliderLeftOffset");
      sliderOffset.setAttribute("width", ((x - fullSeries.getBBox().x) < 0 ? 0 : (x - fullSeries.getBBox().x)));
    } else {
      var sliderOffset = self._PAGE_DATA.objChart.querySelector("#sliderRightOffset");
      sliderOffset.setAttribute("width", ((fullSeries.getBBox().width + fullSeries.getBBox().x) - x));
      sliderOffset.setAttribute("x", x);
    }

    if (type === "left") {
      if (PAGE_DATA.windowLeftIndex > 0)
        self._PAGE_DATA.objChart.querySelector("#zoomOutBoxCont").style.display = "block";
      else
        self._PAGE_DATA.objChart.querySelector("#zoomOutBoxCont").style.display = "none";
    } else if (type === "right") {
      if (PAGE_DATA.windowRightIndex < ((PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length * 2) - 1)) {
        self._PAGE_DATA.objChart.querySelector("#zoomOutBoxCont").style.display = "block";
      } else {
        self._PAGE_DATA.objChart.querySelector("#zoomOutBoxCont").style.display = "none";
      }
    }

  } /*End resetSliderPos()*/


  function reDrawSeries() {
    var dataSet = [];
    var scaleX = PAGE_DATA.gridBoxWidth / PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(PAGE_DATA.windowLeftIndex, PAGE_DATA.windowRightIndex + 1).length;
    for (var i = 0; i < PAGE_OPTIONS.dataSet.series.length; i++) {
      var set = {
        "data": PAGE_OPTIONS.dataSet.series[i].data.slice(PAGE_DATA.windowLeftIndex, PAGE_DATA.windowRightIndex + 1)
      };
      dataSet.push(set);
    }

    prepareDataSet(dataSet);
    createVerticalLabel();

    createHorizontalLabel(PAGE_OPTIONS.dataSet.xAxis.categories, scaleX);

    PAGE_DATA.series = [];
    for (var i = 0; i < dataSet.length; i++) {
      createSeries(dataSet[i].data, i, scaleX);
      if (PAGE_OPTIONS.dataSet.series.length > 1)
        createLegands(i);
    }

    resetTextPositions();
    bindEvents();
    onMouseLeave();

    //fire event afterRender
    var aftrRenderEvent = new self.Event("afterRender", {
      srcElement: self
    });
    self.dispatchEvent(aftrRenderEvent);

  } /*End reDrawSeries()*/


  function onZoomOut(e) {
    e.stopPropagation();
    e.preventDefault();
    PAGE_DATA.windowLeftIndex = 0;
    PAGE_DATA.windowRightIndex = (PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length) - 1;
    resetSliderPos("left", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
    resetSliderPos("right", PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);
    reDrawSeries();
    self._PAGE_DATA.objChart.querySelector("#zoomOutBoxCont").style.display = "none";
  } /*End onZoomOut()*/

  function round(val) {
    val = Math.round(val);
    var digitCount = val.toString().length;
    var nextVal = Math.pow(10, digitCount - 1);
    var roundVal = Math.ceil(val / nextVal) * nextVal;
    if (val < roundVal / 2)
      return roundVal / 2;
    else
      return roundVal;
  } /*End round()*/

  function showAnimatedView() {
    var dataSet = [];
    var scaleX = PAGE_DATA.gridBoxWidth / PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(PAGE_DATA.windowLeftIndex, PAGE_DATA.windowRightIndex).length;
    var pointIndex = 0;

    for (var i = 0; i < PAGE_OPTIONS.dataSet.series.length; i++) {
      var set = {
        "data": PAGE_OPTIONS.dataSet.series[i].data.slice(PAGE_DATA.windowLeftIndex, PAGE_DATA.windowRightIndex)
      };
      dataSet.push(set);
    }
    prepareDataSet(dataSet);
    PAGE_DATA.series = [];

    var maxLen = 0;
    for (var i = 0; i < dataSet.length; i++) {
      var len = dataSet[i].data.length;
      if (len > maxLen) maxLen = len;
    }

    /*if there is more than 50 points then skip the animation*/
    if (maxLen > 50)
      pointIndex = maxLen;
    var timoutId = setInterval(function () {

      for (var index = 0; index < dataSet.length; index++) {
        createSeries(dataSet[index].data.slice(0, pointIndex), index, scaleX);
      }

      if (pointIndex === maxLen) {
        clearInterval(timoutId);
        reDrawSeries();
      }
      pointIndex++;
    }, 50);
  } /*End showAnimatedView()*/


  init();
  if (PAGE_OPTIONS.animated !== false) showAnimatedView();
}; /*End of AreaChart()*/