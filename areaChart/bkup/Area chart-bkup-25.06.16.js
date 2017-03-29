/*
 * SVG Area Chart 
 * @CreatedOn:
 * @Author:Kausik Dey
 * @description: 
 * JSFiddle:
 * @Sample caller code:
 
 */


window.drawAreaChart = function(opts)
{
  /*if(typeof window.jQuery === "undefined"){
    setTimeout(function(){
        drawAreaChart(opts);
    },100);
    return;
  }*/

  var PAGE_OPTIONS = {
    /*"width":800,
    "height":500,
    "title":"Sales Report of ABC Group",
    "subTitle":"Report for the year, 2016",
    "targetElem":"chartContainer",
    "dataSet":{
      "xAxis":{
        "categories":["Jan","Feb","Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "title":"Month"
      },
      "yAxis":{
        "title":"Sales Units"
      },
      "series":[
        {
          name: 'John',
          data: [3000, 0, 333, 555, 444, 2000, 1212, 3323, 470, 5051, 6751]//[3, 4, 3, 5, 4, 2, 1, 3, 4, 5,4]
        },
        {
          name: 'Jane',
          data: [800,400,444, 2000, 1212, 3323,444, 2000, 1212, 3323]
        }
      ]
    }*/
  };

  var PAGE_DATA = {
    scaleX:0,
    scaleY:0,
    svgCenter:0,
    chartCenter:0,
    uniqueDataSet:[],
    maxima:0,
    minima:0,
    marginLeft:0,
    marginRight:0,
    marginTop:0,
    marginBottom:0,
    gridBoxWidth:0,
    gridBoxHeight:0,
    fullChartHeight:60,
    fullSeries:[],
    windowLeftIndex:0,
    windowRightIndex:0,
    longestSeries:0,
    series:[]
  };

  var PAGE_CONST = {
    FIX_WIDTH:800,
    FIX_HEIGHT:500,
    hGridCount:7
  };
  
  

  function init()
  {
    _mergeRecursive(PAGE_OPTIONS,opts);
    console.log(PAGE_OPTIONS);
    PAGE_DATA.scaleX = PAGE_CONST.FIX_WIDTH-PAGE_OPTIONS.width;
    PAGE_DATA.scaleY = PAGE_CONST.FIX_HEIGHT-PAGE_OPTIONS.height;
    

    var strSVG ="<svg xmlns:svg='http:\/\/www.w3.org\/2000\/svg' xmlns='http:\/\/www.w3.org\/2000\/svg' xmlns:xlink='http:\/\/www.w3.org\/1999\/xlink'"+ 
                "preserveAspectRatio='xMidYMid meet'"+
                "currentScale='1'"+
                "viewBox='"+((-1)*PAGE_DATA.scaleX/2)+" "+((-1)*PAGE_DATA.scaleY/2)+" 800 500'"+
                "version='1.1'" +
                "width='"+PAGE_OPTIONS.width+"'"+
                "height='"+PAGE_OPTIONS.height+"'"+
                "id='areaChart'"+
                "style='-moz-tap-highlight-color: rgba(0, 0, 0, 0);-webkit-tap-highlight-color:rgba(0, 0, 0, 0);-webkit-user-select:none;-khtml-user-select: none;-moz-user-select:none;-ms-user-select:none;-o-user-select:none;user-select:none;'"+
                "> <\/svg>";
    document.getElementById(PAGE_OPTIONS.targetElem).innerHTML = strSVG;

    var svgWidth = parseInt(document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").getAttribute("width"));
    var svgHeight = parseInt(document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").getAttribute("height"));
    PAGE_DATA.svgCenter = new Point((svgWidth/2),(svgHeight/2)) ;
    PAGE_DATA.chartCenter = new Point(PAGE_DATA.svgCenter.x,PAGE_DATA.svgCenter.y+50) ;
    PAGE_DATA.marginLeft = ((-1)*PAGE_DATA.scaleX/2)+100,PAGE_DATA.marginRight =((-1)*PAGE_DATA.scaleX/2)+10; //(PAGE_DATA.svgCenter.x*2)*10/100; ;
    PAGE_DATA.marginTop = ((-1)*PAGE_DATA.scaleY/2)+100;
    PAGE_DATA.marginBottom = ((-1)*PAGE_DATA.scaleY/2)+150;//(PAGE_DATA.svgCenter.x*2)*15/100;
    
    prepareChart();
    
    var longestSeries = 0,longSeriesLen = 0;
    for(var i=0;i<PAGE_DATA.fullSeries.length;i++)
    {
      if(PAGE_DATA.fullSeries[i].length > longSeriesLen){
        longestSeries = i;
        longSeriesLen = PAGE_DATA.fullSeries[i].length;
      }
    }
    PAGE_DATA.longestSeries = longestSeries;
    PAGE_DATA.windowRightIndex = longSeriesLen;

  }/*End init()*/

  function prepareChart()
  {
    prepareDataSet();
    var strSVG="";
    strSVG += "<g>";
    strSVG += "  <rect x='"+((-1)*PAGE_DATA.scaleX/2)+"' y='"+((-1)*PAGE_DATA.scaleY/2)+"' width='"+((PAGE_DATA.svgCenter.x*2)+PAGE_DATA.scaleX)+"' height='"+((PAGE_DATA.svgCenter.y*2)+PAGE_DATA.scaleY)+"' style='fill:white;stroke-width:1;stroke:#717171;' \/>";
    strSVG += "<\/g>";
    strSVG += "<g>";
    strSVG += "  <text id='txtTitleGrp' fill='#717171' font-family='Verdana' >";
    strSVG += "    <tspan id='txtTitle' x='"+(100/PAGE_CONST.FIX_WIDTH*PAGE_OPTIONS.width)+"' y='"+(50/PAGE_CONST.FIX_HEIGHT*PAGE_OPTIONS.height)+"' font-size='25'><\/tspan>";
    strSVG += "    <tspan id='txtSubtitle' x='125' y='80' font-size='15'><\/tspan>";
    strSVG += "  <\/text>";
    strSVG += "<\/g>";
    strSVG += "<g id='toolTipContainer'>";
    strSVG += "  <path id='toolTip'  fill='white' style='filter:url(#dropshadow)' stroke='rgb(124, 181, 236)' fill='none' d='' stroke-width='1' opacity='0.7'></path>";
    strSVG += "  <text id='txtToolTipGrp' fill='#717171' font-family='Verdana' >";
    strSVG += "    <tspan id='toolTipXval' font-size='12'>Month: Oct<\/tspan>";
    strSVG += "    <tspan id='toolTipYval' font-size='12'>Sales Units: 120<\/tspan>";
    strSVG += "  <\/text>";
    strSVG += "<\/g>";
    
    strSVG += "<g id='legendContainer'>";
    strSVG += "<\/g>";

    strSVG += "<filter id='dropshadow' height='130%'>";
    strSVG += "  <feGaussianBlur in='SourceGraphic' stdDeviation='1'/>"; 
    strSVG += "  <feOffset dx='2' dy='2' result='offsetblur'/>"; 
    strSVG += "  <feMerge>"; 
    strSVG += "    <feMergeNode/>";
    strSVG += "    <feMergeNode in='SourceGraphic'/>";
    strSVG += "  </feMerge>";
    strSVG += "</filter>";

    strSVG += "<g id='fullSeriesContr'>";
    strSVG += "<rect x='"+(PAGE_DATA.marginLeft+PAGE_DATA.scaleX)+"' y='"+((PAGE_DATA.svgCenter.y*2)-PAGE_DATA.marginBottom+PAGE_DATA.fullChartHeight)+"' width='"+((PAGE_DATA.svgCenter.x*2)-PAGE_DATA.marginLeft-PAGE_DATA.marginRight)+"' height='"+(PAGE_DATA.scaleY+60)+"' style='fill:none;stroke-width:0.1;stroke:#717171;' \/>";
    strSVG += "<path id='sliderLeft' stroke='#ffa500' fill='none' d='' stroke-width='2' opacity='0.5'></path>";
    strSVG += "<path id='sliderRight' stroke='#ffa500' fill='none' d='' stroke-width='2' opacity='0.5'></path>";
    strSVG += "<circle id='slideRSel' fill='#ffa500' stroke-width='1px' cx='' cy='' r='10' opacity='0.8'></circle>";
    strSVG += "<circle id='slideLSel' fill='#ffa500' stroke-width='1px' cx='' cy='' r='10' opacity='0.8'></circle>";
    strSVG += "</g>";


    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strSVG);
    

    /*Set Title of chart*/
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtTitleGrp #txtTitle").textContent = PAGE_OPTIONS.title;
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtSubtitle").textContent = PAGE_OPTIONS.subTitle;

    createGrid();
    var scaleX = PAGE_DATA.gridBoxWidth/PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length;
    for(var index=0;index<PAGE_OPTIONS.dataSet.series.length;index++)
    {
      createSeries(PAGE_OPTIONS.dataSet.series[index].data,index,scaleX);
      createFullSeries(PAGE_OPTIONS.dataSet.series[index].data,index);
      createLegands(index);
      appendGradFill(index);
    }
    
    createVerticalLabel();
    //PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(PAGE_DATA.windowLeftIndex,(PAGE_DATA.windowRightIndex+1)).length;
    var catList = [],scaleX = PAGE_DATA.gridBoxWidth/PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(0,PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length);
    //console.log(PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(0,PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.length));
    for(var i=0;i<PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length;i++)
      catList.push(PAGE_OPTIONS.dataSet.xAxis.categories[i%PAGE_OPTIONS.dataSet.xAxis.categories.length]);

    createHorizontalLabel(catList,scaleX);
    
    /*Creating horizontal and vertical subtitles*/
    strSVG = "<text id='hTextSubTitle' x='"+(PAGE_DATA.marginLeft+(PAGE_DATA.gridBoxWidth/2)-30)+"' y='"+(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+50)+"' font-size='18' >"+PAGE_OPTIONS.dataSet.xAxis.title+"<\/text>";
    strSVG +="<text id='vTextSubTitle' x='"+(PAGE_DATA.marginLeft-30)+"' y='"+(PAGE_DATA.marginTop+(PAGE_DATA.gridBoxHeight/2)-5)+"' font-size='18' >"+PAGE_OPTIONS.dataSet.yAxis.title+"<\/text>";
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strSVG);
    
    document.getElementById(PAGE_OPTIONS.targetElem).innerHTML = document.getElementById(PAGE_OPTIONS.targetElem).innerHTML;
    resetTextPositions();
    resetSliderPos("left",(PAGE_DATA.marginLeft+PAGE_DATA.scaleX));
    resetSliderPos("right",((PAGE_DATA.svgCenter.x*2)-PAGE_DATA.marginRight));
    bindEvents();
    
    var fullSeries = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #fullSeriesContr");
    fullSeries.parentNode.removeChild(fullSeries);
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").appendChild(fullSeries);
  }/*End prepareChart()*/
  
  
  function createFullSeries(dataSet,index)
  {
    var d =[];
    var categories = PAGE_OPTIONS.dataSet.xAxis.categories;
    var scaleX = (PAGE_DATA.gridBoxWidth/categories.length); 
    var scaleYfull = (PAGE_DATA.fullChartHeight/PAGE_DATA.maxima);
    var arrPointsSet = [],strSeries="";

    /* ploting actual points */
    
    for(var dataCount = 0;dataCount<dataSet.length;dataCount++)
    {
      var p = new Point(PAGE_DATA.marginLeft+(dataCount*scaleX),(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+PAGE_DATA.fullChartHeight+60)-(dataSet[dataCount]*scaleYfull));
      arrPointsSet.push(p);
    }
    
    PAGE_DATA.fullSeries.push(arrPointsSet);

    var line = [],area=[];
    strSeries = "<g id='fullSeries_"+index+"' class='fullSeries'>";
    line.push.apply(line,["M",arrPointsSet[0].x,arrPointsSet[0].y]);
    var point=0;
    for(var point = 0;(point+2)<arrPointsSet.length;point++)
    {
      var curve = describeBezireArc(arrPointsSet[point],arrPointsSet[point+1],arrPointsSet[point+2]);
      line.push.apply(line,curve);
    }
    line.push.apply(line,["L",arrPointsSet[arrPointsSet.length-1].x,arrPointsSet[arrPointsSet.length-1].y]);
    area.push.apply(area,line);
    d = ["L",arrPointsSet[arrPointsSet.length-1].x,(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+PAGE_DATA.fullChartHeight+60),"L",PAGE_DATA.marginLeft,(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+PAGE_DATA.fullChartHeight+60),"Z"];
    area.push.apply(area,d);  
    strSeries +="<path id='fLine_"+index+"' stroke='"+getColor(index)+"' fill='none' d='"+line.join(" ")+"' stroke-width='1' opacity='1'></path>";
    strSeries +="<path id='fArea_"+index+"' stroke='none' fill='url(#gradLinear"+index+")' d='"+area.join(" ")+"' stroke-width='1' opacity='1'></path>";
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #fullSeriesContr").insertAdjacentHTML("beforeend",strSeries);
  }/*End createFullChart()*/
  

  function prepareDataSet(dataSet)
  {
    var maxSet=[],minSet=[];
    dataSet = dataSet || PAGE_OPTIONS.dataSet.series;
    console.log(dataSet);
    for(var i=0;i<dataSet.length;i++)
    {
     var maxVal = Math.max.apply(null,dataSet[i].data);
     var minVal = Math.min.apply(null,dataSet[i].data);
     maxSet.push(maxVal);
     minSet.push(minVal);
    }
    PAGE_DATA.maxima = Math.max.apply(null,maxSet);
    PAGE_DATA.minima = Math.min.apply(null,minSet);
    PAGE_DATA.maxima = round(PAGE_DATA.maxima);
  }/*End prepareDataSet()*/

  function createSeries(dataSet,index,scaleX)
  {
    var d =[];
    //var categories = PAGE_OPTIONS.dataSet.xAxis.categories;
    //scaleX = scaleX;||(PAGE_DATA.gridBoxWidth/dataSet.length); 
    var scaleY = (PAGE_DATA.gridBoxHeight/PAGE_DATA.maxima); 
    var arrPointsSet = [],strSeries="";
    var elemSeries = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #series_"+index);
    if(elemSeries)
      elemSeries.parentNode.removeChild(elemSeries);
    /* ploting actual points */
    var strSeries = "<g id='series_actual_"+index+"'>";
    for(var dataCount = 0;dataCount<dataSet.length;dataCount++)
    {
      var p = new Point(PAGE_DATA.marginLeft+(dataCount*scaleX),(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight)-(dataSet[dataCount]*scaleY));
      if(dataCount === 0)
        d.push("M");
      else
        d.push("L");
      d.push(p.x);
      d.push(p.y);
      arrPointsSet.push(p);
    }
    strSeries +="<path stroke='rgb(124, 181, 236)' fill='none' d='"+d.join(" ")+"' stroke-width='1' opacity='1'></path>";
    strSeries += "</g>";
    PAGE_DATA.series.push(arrPointsSet);

    var line = [],area=[];
    strSeries = "<g id='series_"+index+"' class='series'>";
    line.push.apply(line,["M",arrPointsSet[0].x,arrPointsSet[0].y]);
    var point=0;
    for(var point = 0;(point+2)<arrPointsSet.length;point++)
    {
      var curve = describeBezireArc(arrPointsSet[point],arrPointsSet[point+1],arrPointsSet[point+2]);
      line.push.apply(line,curve);
      strSeries += "<circle cx="+arrPointsSet[point+1].x+" cy="+arrPointsSet[point+1].y+" r='3' class='dot' style='fill:"+getColor(index)+"; opacity: 1; stroke-width: 1px;'></circle>";
    }
    line.push.apply(line,["L",arrPointsSet[arrPointsSet.length-1].x,arrPointsSet[arrPointsSet.length-1].y]);
    area.push.apply(area,line);
    d = ["L",arrPointsSet[arrPointsSet.length-1].x,PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight,"L",PAGE_DATA.marginLeft,PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight,"Z"];
    area.push.apply(area,d);  
    strSeries +="<path id='line_"+index+"' stroke='"+getColor(index)+"' fill='none' d='"+line.join(" ")+"' stroke-width='1' opacity='1'></path>";
    strSeries +="<path id='area_"+index+"' stroke='none' fill='url(#gradLinear"+index+")' d='"+area.join(" ")+"' stroke-width='1' opacity='1'></path>";
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strSeries);

  }/*End createSeries()*/
  
  function appendGradFill(index) {
    /*Creating gradient fill*/
    var strSVG = "";
    strSVG += "<defs>";
    strSVG += "  <linearGradient gradientUnits = 'userSpaceOnUse' id='gradLinear"+index+"' x1='0%' y1='0%' x2='100%' y2='0%'>";
    strSVG += "  <stop offset='0%' style='stop-color:white;stop-opacity:0.5' />";
    strSVG += "  <stop offset='100%' style='stop-color:"+getColor(index)+";stop-opacity:0.5' />";
    strSVG += "  <\/radialGradient>";
    strSVG += "<\/defs>";
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strSVG);
  }/*End appendGradFill()*/
  
  function createLegands(index){
    /*Creating series legend*/
    var strSVG = "";
    strSVG ="<g id='series_legend_"+index+"' style='cursor:pointer;'>";
    strSVG +="<rect id='legend_color_"+index+"' x='"+PAGE_DATA.marginLeft+"' y='"+(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+130)+"' width='10' height='10' fill='"+getColor(index)+"' stroke='none' stroke-width='1' opacity='1'></rect>";
    strSVG +="<text id='legend_txt_"+index+"' font-size='12' x='"+(PAGE_DATA.marginLeft+20)+"' y='"+(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+140)+"' fill='#717171' font-family='Verdana' >"+PAGE_OPTIONS.dataSet.series[index].name+"</text>";
    strSVG +="</g>";
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #legendContainer").insertAdjacentHTML("beforeend",strSVG);
  }

  function describeBezireArc(point1,point2,point3)
  {
    //var mid1 = getMid(point1,point2);
    //var mid11 = getMid(mid1,point2);
    var mid2 = getMid(point2,point3);
    //var mid21 = getMid(point2,mid2);

    var c = [
      "C",
      point2.x,
      point2.y,
      point2.x,
      point2.y,
      mid2.x,
      mid2.y
    ];

   
    return c;
  }/*End describeBezireArc()*/

  function createGrid()
  {
    PAGE_DATA.gridBoxWidth = (PAGE_DATA.svgCenter.x*2)-PAGE_DATA.marginLeft-PAGE_DATA.marginRight;
    PAGE_DATA.gridBoxHeight = (PAGE_DATA.svgCenter.y*2)-PAGE_DATA.marginTop-PAGE_DATA.marginBottom;
    PAGE_DATA.gridHeight = (((PAGE_DATA.svgCenter.y*2)-PAGE_DATA.marginTop-PAGE_DATA.marginBottom)/(PAGE_CONST.hGridCount-1));
    
    var strGrid = "";
    strGrid += "<g id='hGrid'>";
    for(var gridCount = 0;gridCount<PAGE_CONST.hGridCount;gridCount++)
    {
      var d = ["M", PAGE_DATA.marginLeft, PAGE_DATA.marginTop+(gridCount*PAGE_DATA.gridHeight),"L", PAGE_DATA.marginLeft+PAGE_DATA.gridBoxWidth, PAGE_DATA.marginTop+(gridCount*PAGE_DATA.gridHeight)];
      strGrid +="<path fill='none' d='"+d.join(" ")+"' stroke='#D8D8D8' stroke-width='1' opacity='1'></path>";
    }
    strGrid +="<path id='hLine' fill='none' stroke='#D8D8D8' stroke-width='1' opacity='1'></path>";
    strGrid +="<path id='vLine' fill='none' stroke='#D8D8D8' stroke-width='1' opacity='1'></path>";
    strGrid +="<rect id='gridBox' x='"+PAGE_DATA.marginLeft+"' y='"+PAGE_DATA.marginTop+"' width='"+PAGE_DATA.gridBoxWidth+"' height='"+PAGE_DATA.gridBoxHeight+"' fill='none' stroke='#D8D8D8' stroke-width='1' opacity='1'></rect>";
    strGrid += "</g>";
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strGrid);

  }/*End createGrid()*/

  function createVerticalLabel()
  {
    var vTextLabel = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextLabel");
    if(vTextLabel)
      vTextLabel.parentNode.removeChild(vTextLabel);
    /*var vTextSubtitle = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextSubTitle");
    if(vTextSubtitle)
      vTextSubtitle.parentNode.removeChild(vTextSubtitle);*/
    var interval = PAGE_DATA.maxima/(PAGE_CONST.hGridCount-1);
    var strText = "<g id='vTextLabel'><text fill='#717171'>";
    for(var gridCount = PAGE_CONST.hGridCount-1,i=0;gridCount>=0;gridCount--)
    {
      strText +="<tspan x='"+(PAGE_DATA.marginLeft-30)+"' y='"+(PAGE_DATA.marginTop+(gridCount*PAGE_DATA.gridHeight)+5)+"' font-size='15' >"+(i++*interval).toFixed(1)+"<\/tspan>";
    }
    strText += "</text></g>";
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strText);
  }/*End createVerticalLabel()*/



  function createHorizontalLabel(categories,scaleX)
  {
    //var categories = PAGE_OPTIONS.dataSet.xAxis.categories;
    var hTextLabel = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #hTextLabel");
    if(hTextLabel)
      hTextLabel.parentNode.removeChild(hTextLabel);
    /*var hTextSubtitle = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #hTextSubTitle");
    if(hTextSubtitle)
      hTextSubtitle.parentNode.removeChild(hTextSubtitle);*/
    var interval = scaleX||(PAGE_DATA.gridBoxWidth/(categories.length));

    console.log(interval);
    var strText = "<g id='hTextLabel'><text fill='#717171'>";
    for(var hText =0;hText<categories.length;hText++)
    {
      strText +="<tspan x='"+(PAGE_DATA.marginLeft+(hText*interval))+"' y='"+(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight+20)+"' font-size='12' >"+categories[hText]+"<\/tspan>";
    }
    strText += "</text>";
    strText += "</g>";
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").insertAdjacentHTML("beforeend",strText);
  }/*End createHorizontalLabel()*/
  
  
  function resetTextPositions()
  {
    var titleBox = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtTitleGrp").getBBox();
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtTitleGrp #txtTitle").setAttribute("x",(PAGE_DATA.svgCenter.x-(titleBox.width/2)));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtTitleGrp #txtTitle").setAttribute("y",(PAGE_DATA.svgCenter.y-200));//.setAttribute("x",(PAGE_DATA.marginLeft+(PAGE_DATA.gridBoxWidth/2)-(titleBox.width/2)));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtTitleGrp #txtSubtitle").setAttribute("x",(PAGE_DATA.svgCenter.x-(titleBox.width/2)));//.setAttribute("x",(PAGE_DATA.marginLeft+(PAGE_DATA.gridBoxWidth/2)-(titleBox.width/2)));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtTitleGrp #txtSubtitle").setAttribute("y",(PAGE_DATA.svgCenter.y-170));
    
    /*Reset vertical text label*/
    var arrVLabels = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextLabel");
    var width = arrVLabels[0].getBBox().width;
    var arrVText = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextLabel tspan");
    for(var i=0;i<arrVText.length;i++)
      arrVText[i].setAttribute("x",(PAGE_DATA.marginLeft-width-10));
    
    /*Reset horzontal text label*/
    var totalHTextWidth = 0;
    var interval = (PAGE_DATA.gridBoxWidth/(PAGE_OPTIONS.dataSet.xAxis.categories.length));
    var arrHText = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart #hTextLabel tspan");
    for(var i=0;i<arrHText.length;i++)
    {
      var txWidth = arrHText[i].getComputedTextLength();
      totalHTextWidth+=(txWidth+10);
      while(txWidth > interval){
        arrHText[i].textContent = arrHText[i].textContent.substring(0,(arrHText[i].textContent.length-1));
        txWidth = (arrHText[i].getComputedTextLength());
      }
    }
    
    if(parseFloat(PAGE_DATA.gridBoxWidth) < parseFloat(totalHTextWidth))
    {
      for(var i=0;i<arrHText.length;i++)
      {
        if(i%2===1){
          arrHText[i].style.visibility="hidden";
        }
      }
    }
    
    /*Set position for vertical text subtitle */
    var txtSubTitle = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextSubTitle").getBBox();
    var inset = 35;
    console.log(txtSubTitle);
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextSubTitle").setAttribute("x",(PAGE_DATA.marginLeft-width-(txtSubTitle.width/2)-inset));
    txtSubTitle = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextSubTitle").getBBox();
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vTextSubTitle").setAttribute("transform","rotate(-90 "+(PAGE_DATA.marginLeft-(txtSubTitle.width/2)-inset)+","+(PAGE_DATA.marginTop+(PAGE_DATA.gridBoxHeight/2)-20)+")");
    
    /*Set position for legend text*/
    var arrLegendText = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart #legendContainer text");
    var arrLegendColor = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart #legendContainer rect");
    width = 0;
    for(var i=0;i<arrLegendText.length;i++)
    {
      arrLegendColor[i].setAttribute("x",(width+PAGE_DATA.marginLeft));
      arrLegendText[i].setAttribute("x",(width+PAGE_DATA.marginLeft+20));
      width+=(arrLegendText[i].getBBox().width+50);
    }
    

  }/*End resetTextPositions()*/
  
  function round(val)
  {
    val = Math.round(val);
    var digitCount = val.toString().length;
    var nextVal = Math.pow(10,digitCount-1);
    var roundVal = Math.ceil(val/nextVal)*nextVal;
    if(val < roundVal/2)
      return roundVal/2;
    else
      return roundVal;
  }/*End round()*/

  function getMid(point1, point2)
  {
    return new Point((point1.x+point2.x)/2,(point1.y+point2.y)/2);
  }/*End getMid()*/

  function bindEvents(dataSet)
  {
    console.log(dataSet);
    for(var index=0;index<PAGE_OPTIONS.dataSet.series.length;index++)
    {
      (function(indx){
        document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #area_"+indx).addEventListener("mousemove", function(e){
          e.stopPropagation();
          
          var mousePointer = cursorPoint(e);
          //var mousePointer = new Point(e.offsetX,e.offsetY);
          
          var nearestPointIndex = getNearestPoint(PAGE_DATA.series[indx],mousePointer);
          var scaleY = (PAGE_DATA.gridBoxHeight/PAGE_DATA.maxima); 

          /*Create vertical line*/
          var vLine = ["M",mousePointer.x,(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight),"L",mousePointer.x,PAGE_DATA.marginTop];
          document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #vLine").setAttribute("d",vLine.join(" "));

          var line1Start = PAGE_DATA.series[indx][nearestPointIndex];
          if(line1Start.x <  mousePointer.x)
            var line1End = PAGE_DATA.series[indx][nearestPointIndex+1];
          else
            var line1End = PAGE_DATA.series[indx][nearestPointIndex-1];
          var line2Start = new Point(mousePointer.x,(PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight));
          var line2End = new Point(mousePointer.x,PAGE_DATA.marginTop);
          //console.log(line1Start);
          //console.log(line1End.x);
          if(typeof line1Start !== "undefined" && typeof line1End !== "undefined" && typeof line2Start !== "undefined" && typeof line2End !== "undefined")
            var toolTipPoint = checkLineIntersection(line1Start.x,line1Start.y,line1End.x,line1End.y,line2Start.x,line2Start.y,line2End.x,line2End.y);
       
          if(toolTipPoint && toolTipPoint.onLine1 === true && toolTipPoint.onLine2 === true)
          {
            var elms = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart .tooTipPoint");
            for(var i=0;i<elms.length;i++)
              elms[i].parentNode.removeChild(elms[i]);

            showToolTip(toolTipPoint,getColor(indx));
            createDot(toolTipPoint,getColor(indx),3,1,"tooTipPoint","toolTipContainer");
            createDot(toolTipPoint,getColor(indx),8,0.2,"tooTipPoint","toolTipContainer");
            var projectedVal = (PAGE_DATA.marginTop+PAGE_DATA.gridBoxHeight-toolTipPoint.y)/scaleY;

            if((toolTipPoint.x > (PAGE_DATA.series[indx][nearestPointIndex].x-5)) && (toolTipPoint.x < (PAGE_DATA.series[indx][nearestPointIndex].x+5)) ){
              document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipXval").textContent = (PAGE_OPTIONS.dataSet.xAxis.title+" "+PAGE_OPTIONS.dataSet.xAxis.categories[nearestPointIndex]);
              document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipYval").textContent = (PAGE_OPTIONS.dataSet.yAxis.title+" "+PAGE_OPTIONS.dataSet.series[indx]["data"][nearestPointIndex]);
            }
            else{
              document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipXval").textContent = ("Projected");
              document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipYval").textContent = (PAGE_OPTIONS.dataSet.yAxis.title+" "+projectedVal.toFixed(2));
            }
          }
        },false);
        
        document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #series_legend_"+indx).addEventListener("click", function(e){
          var arrSeries = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart .series");
          for(var i=0;i<arrSeries.length;i++)
            arrSeries[i].style.visibility = "hidden";
          
          document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #toolTipContainer").style.visibility = "hidden";
          document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #series_"+e.target.id.split("_")[2]).style.visibility = "visible";;
        },false);
        
      })(index);
    }
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideLSel").addEventListener("mousedown", function(e){
      e.stopPropagation();
      document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideLSel").addEventListener("mousemove",bindLeftSliderMove);
    });
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideLSel").addEventListener("mouseup", function(e){
      e.stopPropagation();
      document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideLSel").removeEventListener("mousemove",bindLeftSliderMove);
      resetSliderPos("left",PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowLeftIndex].x);
      reDrawSeries();
    });
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideLSel").addEventListener("mouseleave", function(e){
      e.stopPropagation();
      document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideLSel").removeEventListener("mousemove",bindLeftSliderMove);
    });
    

    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideRSel").addEventListener("mousedown", function(e){
      e.stopPropagation();
      document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideRSel").addEventListener("mousemove",bindRightSliderMove);
    });
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideRSel").addEventListener("mouseup", function(e){
      e.stopPropagation();
      document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideRSel").removeEventListener("mousemove",bindRightSliderMove);
      resetSliderPos("right",PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.windowRightIndex].x);
      reDrawSeries();
    });
    
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideRSel").addEventListener("mouseleave", function(e){
      e.stopPropagation();
      document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #slideRSel").removeEventListener("mousemove",bindRightSliderMove);
    });
    
    function reDrawSeries()
    {
      var dataSet = [];
      var scaleX = PAGE_DATA.gridBoxWidth/PAGE_OPTIONS.dataSet.series[PAGE_DATA.longestSeries].data.slice(PAGE_DATA.windowLeftIndex,(PAGE_DATA.windowRightIndex+1)).length;
      for(var i=0;i<PAGE_OPTIONS.dataSet.series.length;i++)
      {
        var set = {"data":PAGE_OPTIONS.dataSet.series[i].data.slice(PAGE_DATA.windowLeftIndex,(PAGE_DATA.windowRightIndex+1))};
        dataSet.push(set);
      }
      prepareDataSet(dataSet);
      for(var i=0;i<PAGE_OPTIONS.dataSet.series.length;i++)
        createSeries(PAGE_OPTIONS.dataSet.series[i].data.slice(PAGE_DATA.windowLeftIndex,(PAGE_DATA.windowRightIndex+1)),i,scaleX);
      
      createVerticalLabel();
    
      var catList = [];
      for(var i=PAGE_DATA.windowLeftIndex;i<=(PAGE_DATA.windowRightIndex);i++)
        catList.push(PAGE_OPTIONS.dataSet.xAxis.categories[i%PAGE_OPTIONS.dataSet.xAxis.categories.length]);

      createHorizontalLabel(catList,scaleX);
      resetTextPositions();
      bindEvents(dataSet);
    }/*End reDrawSeries()*/
    
    function bindLeftSliderMove(e){
      var mousePointer = cursorPoint(e);
      if(mousePointer.x > (PAGE_DATA.marginLeft+PAGE_DATA.scaleX) && mousePointer.x <((PAGE_DATA.svgCenter.x*2)-PAGE_DATA.marginRight) )
      {
        for(var j=0;j<PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length-1;j++)
        {
          if(mousePointer.x >= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j].x && mousePointer.x <= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j+1].x )
            if(e.movementX <= 0)
              PAGE_DATA.windowLeftIndex = j;
            else
              PAGE_DATA.windowLeftIndex = j+1;  
        }
        resetSliderPos("left",mousePointer.x);
      }
    }/*End bindLeftSliderMove()*/
    
    function bindRightSliderMove(e){
      var mousePointer = cursorPoint(e);
      if(mousePointer.x > (PAGE_DATA.marginLeft+PAGE_DATA.scaleX) && mousePointer.x <((PAGE_DATA.svgCenter.x*2)-PAGE_DATA.marginRight) ){
        for(var j=1;j<PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length;j++)
        {
          if(mousePointer.x >= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j-1].x && mousePointer.x <= PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][j].x )
            if(e.movementX <= 0)
              PAGE_DATA.windowRightIndex = j-1;
            else
              PAGE_DATA.windowRightIndex = j;
        }
        if(mousePointer.x >PAGE_DATA.fullSeries[PAGE_DATA.longestSeries][PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length-1].x ){
          PAGE_DATA.windowRightIndex = PAGE_DATA.fullSeries[PAGE_DATA.longestSeries].length-1;
        }
        resetSliderPos("right",mousePointer.x);
      }
    }/*End bindRightSliderMove()*/

  }/*End bindEvents()*/
  
  function resetSliderPos(type,x)
  {
    var sliderSel = (type === "right")?"slideRSel":"slideLSel";
    var sliderLine = (type === "right")?"sliderRight":"sliderLeft";
   
    var dr = ["M",x,((PAGE_DATA.svgCenter.y*2)-PAGE_DATA.marginBottom+PAGE_DATA.fullChartHeight+60),"L",x,((PAGE_DATA.svgCenter.y*2)-PAGE_DATA.marginBottom+60)];
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #"+sliderSel).setAttribute("cx",x);
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #"+sliderSel).setAttribute("cy",((PAGE_DATA.svgCenter.y*2)-PAGE_DATA.marginBottom+50));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #"+sliderLine).setAttribute("d",dr.join(" "));
    
  }/*End resetSliderPos()*/

  /* Get point in global SVG space*/
  function cursorPoint(evt){
    var svg = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart");
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }/*End cursorPoint()*/
  
  function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
    /* if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point*/
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator === 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    /* if we cast these lines infinitely in both directions, they intersect here:*/
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
    /*
    /* it is worth noting that this should be the same as:
    x = line2StartX + (b * (line2EndX - line2StartX));
    y = line2StartX + (b * (line2EndY - line2StartY));
    */
    /* if line1 is a segment and line2 is infinite, they intersect if:*/
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    /* if line2 is a segment and line1 is infinite, they intersect if:*/
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    /* if line1 and line2 are segments, they intersect if both of the above are true*/
    return result;
  }/*End checkLineIntersection()*/;

  function getNearestPoint(arrPointSet,point)
  {
    var minDist = 9999999,index = 0;
    for(var p=0;p<arrPointSet.length;p++)
    {
      var dist =getDistanceBetween(arrPointSet[p], point);

      if(dist < minDist)
      {
        minDist = dist;
        index = p;
      }
    }
    return index;
  }/*End getNearestPoint()*/

  function showToolTip(cPoint,color)
  {
    var txtToolTipBox = document.querySelectorAll("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp")[0].getBBox();
    var padding = 20;
    var d = [
      "M",
      cPoint.x,
      cPoint.y,
      "L",
      cPoint.x-10,
      cPoint.y-10,
      "L", //bottom-left corner
      cPoint.x-(txtToolTipBox.width/2)-10-padding,
      cPoint.y-10,
      "L",//top-left corner
      cPoint.x-(txtToolTipBox.width/2)-10-padding,
      cPoint.y-txtToolTipBox.height-10-padding,
      "L",//top-right corner
      cPoint.x+(txtToolTipBox.width/2)+10+padding,
      cPoint.y-txtToolTipBox.height-10-padding,
      "L",//bottom-right corner
      cPoint.x+(txtToolTipBox.width/2)+10+padding,
      cPoint.y-10,
      "L",//bottom center
      cPoint.x+10,
      cPoint.y-10,
      "Z"
    ];

    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipXval").setAttribute("x",cPoint.x-(txtToolTipBox.width/2)-10);
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipXval").setAttribute("y",cPoint.y-10-(txtToolTipBox.height));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipYval").setAttribute("x",cPoint.x-(txtToolTipBox.width/2)-10);
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #txtToolTipGrp #toolTipYval").setAttribute("y",cPoint.y-10-(txtToolTipBox.height/2));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #toolTip").setAttribute("d",d.join(" "));
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #toolTip").setAttribute("stroke",color); 

    var toolTip = document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart #toolTipContainer");
    if(toolTip) toolTip.parentNode.removeChild(toolTip);
    toolTip.style.visibility = "visible";
    document.querySelector("#"+PAGE_OPTIONS.targetElem+" #areaChart").appendChild(toolTip);
    
  }/*End showToolTip()*/

  function createDot(center,color,radious,opacity,cls,targetElem)
  {
    var svg;
    if(targetElem)
      svg = document.getElementById(targetElem);
    else
      svg = document.getElementsByTagName('svg')[0]; //Get svg element
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'circle'); //Create a path in SVG's namespace
    newElement.setAttribute("cx",center.x); //Set path's data
    newElement.setAttribute("cy",center.y); //Set path's data
    newElement.setAttribute("r",radious||3); //Set path's data
    newElement.setAttribute("class",cls||"dot"); //Set path's data
    newElement.style.fill = color; //Set stroke colour
    newElement.style.opacity = opacity||1;
    newElement.style.strokeWidth = "1px"; //Set stroke width
    svg.appendChild(newElement);
  }/*End createDot()*/


  function createRect(left,top,width,height,color)
  {
    var svg = document.getElementsByTagName('svg')[0]; //Get svg element
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); //Create a path in SVG's namespace
    newElement.setAttribute("x",left); //Set path's data
    newElement.setAttribute("y",top); //Set path's data
    newElement.setAttribute("width",width); //Set path's data
    newElement.setAttribute("height",height); //Set path's data
    newElement.style.fill = "none"; //Set stroke colour
    newElement.setAttribute("class","bbox"); //Set path's data
    newElement.style.stroke = color;
    newElement.style.strokeWidth = "1px"; //Set stroke width
    svg.appendChild(newElement);
  }/*End createRect()*/

  function getDistanceBetween(point1, point2)
  {
      var dist = Math.sqrt((point1.x-point2.x)*(point1.x-point2.x)+(point1.y-point2.y)*(point1.y-point2.y))||0;
      return dist;
  }/*End getDistanceBetween()*/

  var Point = function(x,y)
  {
    var obj = this;
    this.x = x;
    this.y = y;
    this.toString = function()
    {
      return "x:"+obj.x+", y:"+obj.y;
    };
  };
  
  var _mergeRecursive = function(obj1, obj2) 
  {
    //iterate over all the properties in the object which is being consumed
    for (var p in obj2) {
      // Property in destination object set; update its value.
      if ( obj2.hasOwnProperty(p) && typeof obj1[p] !== "undefined" ) {
        _mergeRecursive(obj1[p], obj2[p]);
      } else {
        //We don't have that level in the heirarchy so add it
        obj1[p] = obj2[p];
      }
    }
  };

  function getColor(index){
    var Colors = {};
    Colors.names = {
      blue1:"#1982C8",
      goldenYellow:"#F3CA19",
      green1:"#31B76D",
      bluelight:"#95CEFF",
      maroon:"#991919",
      rust:"#F56B19",
      babyPink:"#F15C80",
      biscuit:"#F7A35C",
      lime: "#00ff00",
      navy: "#000080",
      olive: "#808000",
      red: "#ff0000",
      orange: "#ffa500",
      pink: "#ffc0cb",
      yellow: "#ffff00",
      brown: "#a52a2a",
      violet: "#800080",
      magenta: "#ff00ff",
      darkmaroon: "#800000",
      gold: "#ffd700"
    };
    var result;
    var count = 0;
    index = index%20;
    for (var prop in Colors.names)
        if (index === count++)
           result = Colors.names[prop];

    return result;
  };
  
  init();
};/*End of drawPieChart3D()*/
  
