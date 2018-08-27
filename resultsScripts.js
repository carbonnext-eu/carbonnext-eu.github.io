var chart = dc.seriesChart("#results");
var sourceChart = dc.pieChart("#source");
var scenarioChart = dc.rowChart("#scenario");
var routeChart = dc.rowChart("#route");
var costsChart = dc.rowChart("#costs");


d3.csv("results-data.csv").then(function(data) {
  //console.log(data);
  var experiments2 = [], ex2, costNames=["High e- and H2 price", "Low e-price and high H2 price", "High e-price and low H2 price", "Low e- and H2-price"];
  data.forEach(function(ex){
    for(i=1;i<5;i++){
      ex2=JSON.parse(JSON.stringify(ex));
      ex2.costs = ex["costs"+i];
      ex2.costScen = costNames[i-1];
      experiments2.push(ex2);
    }
  });
  //console.log(experiments2);

  var symbolScale         = d3.scaleOrdinal().range(d3.symbols),
    //symbolAccessor      = function(d) { return symbolScale(d.key[0]); },
    ndx                 = crossfilter(experiments2),
    all                 = ndx.groupAll(),
    sourceDimension     = ndx.dimension(function(d) {return d.source;}),
    sourceGroup         = sourceDimension.group().reduceSum(function(d) {return d.costs;}),
    routeDimension      = ndx.dimension(function(d) {return d.syngas;}),
    routeGroup          = routeDimension.group().reduceSum(function(d) {return d.costs;}),
    costsDimension      = ndx.dimension(function(d) {return d.costScen;}),
    costsGroup          = costsDimension.group().reduceSum(function(d) {return d.costs;}),
    scenarioDimension   = ndx.dimension(function(d) {return d.scenario;}),
    scenarioGroup       = scenarioDimension.group().reduceSum(function(d) {return d.diff;}),
    diffDimension       = ndx.dimension(function(d) {return [pathways(d), +d.diff];}),    
    minCostSumGroup     = diffDimension.group().reduce(reduceAddAvg('costs'), reduceRemoveAvg('costs'), reduceInitAvg);

  chart
    .width(768)
    .height(480)
    .ordinalColors(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3",
       "#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"])
    .x(d3.scaleLinear().domain([-100,100]))
    .elasticX(true)
    .elasticY(true)
    .shareTitle(false)
    .chart(subChart)
    .brushOn(false)
    .renderVerticalGridLines(true)
    .renderHorizontalGridLines(true)
    .yAxisLabel("Cost difference to reference [€/kg]")
    .xAxisLabel("GHG difference to reference [kg CO2-eq/kg]")    
    .dimension(diffDimension)
    .group(minCostSumGroup)
    .seriesAccessor(function(d) {return d.key[0];})
    .keyAccessor(function(d) {return +d.key[1];})
    .valueAccessor(function(d) {return +d.value.avg;})
    .legend(dc.legend().x(600).y(200));
    chart.xAxis().ticks(3, "s");
    chart.yAxis().ticks(3, "s");
  chart.render();
  sourceChart
  			.width(300)
        .radius(80)
        .dimension(sourceDimension)
        .group(sourceGroup);
  
  scenarioChart
  			.width(300)
        .dimension(scenarioDimension)
        .group(scenarioGroup)
        .xAxis().ticks(0);
  costsChart
  			.width(300)
        .dimension(costsDimension)
        .group(costsGroup)
        .xAxis().ticks(0);
  routeChart
  			.width(300)
        .dimension(routeDimension)
        .group(routeGroup)
        .xAxis().ticks(0);
  
  dc.renderAll();
  
  var texts = document.getElementsByTagName('text');
  for(var i = 0; i < texts.length; i++) {
    texts[i].innerHTML = texts[i].innerHTML.replace("CO2","CO&#8322;");
  }
});

var subChart = function(c) {
  return dc.scatterPlot(c)
  //    .symbol(symbolAccessor)
      .symbolSize(8)
      .highlightedSize(10)
      .renderTitle(true)
      .title(function(d){
        //console.log(d);
        return [
            d.source,
            '<b>pathway:</b> ' + d.Pathway,
            '<b>GHG scenario:</b> ' + d.scenario,
            '<b>cost scenario:</b> ' + d.costScen,
            '<b>cost increase:</b> ' + d.key[1],
            '<b>GHG increase/decrease:</b> ' + d.key[2],
        ].join('\n');
      })
};
var pathways = function(d) {
  if(d.Pathway == "Propylene") {
    return "Ethylene";
  }
  if(d.Pathway == "Xylene") {
    return "Benzene";
  }
  if(d.Pathway == "FT Gasoline") {
    return "FT Diesel";
  }
  return d.Pathway;
};

function reduceAddAvg(attr) {
  return function(p,v) {
    ++p.count
    p.sum += +v[attr];
    p.avg = p.sum/p.count;
    return p;
  };
}
function reduceRemoveAvg(attr) {
  return function(p,v) {
    --p.count
    p.sum -= +v[attr];
    p.avg = p.count ? p.sum/p.count : 0;
    return p;
  };
}
function reduceInitAvg() {
  return {count:0, sum:0, avg:0};
}
