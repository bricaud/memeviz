(function(){
  //UI configuration
  var itemSize = 18,
    cellSize = itemSize-1,
    width = 900,
    height = 800,
    margin = {top:20,right:100,bottom:20,left:200};

  //formats
  var hourFormat = d3.time.format('%H'),
    dayFormat = d3.time.format('%j'),
    timeFormat = d3.time.format('%Y-%m-%dT%X'),
    monthDayFormat = d3.time.format('%m.%d');

  //data vars for rendering
  var dateExtent = null,
    data = null,
    dayOffset = 0,
    colorCalibration = ['#f6faaa','#FEE08B','#FDAE61','#F46D43','#D53E4F','#9E0142'],
    //colorCalibration = ['#9E0142'],
    dailyValueExtent = {};

  //axises and scales
  var axisWidth = 0 ,
    axisHeight = itemSize*24,
    xAxisScale = d3.scale.linear(),
    xAxis = d3.svg.axis()
      .orient('top'),
      //.ticks(d3.time.days,3)
      //.tickFormat(monthDayFormat),
    yAxisScale = d3.scale.linear()
      .range([0,axisHeight])
      .domain([0,10]),
    yAxis = d3.svg.axis()
      .orient('left')
      //.ticks(5)
      //.tickFormat(d3.format('s'))
      .scale(yAxisScale);

  initCalibration();

  var svg = d3.select('[role="heatmap"]');
  var heatmap = svg
    .attr('width',width)
    .attr('height',height)
  .append('g')
    .attr('width',width-margin.left-margin.right)
    .attr('height',height-margin.top-margin.bottom)
    .attr('transform','translate('+margin.left+','+margin.top+')');
  var rect = null;

  d3.json('timecomponent1e.json',function(err,data){

  /*  data.forEach(function(valueObj){
      valueObj['date'] = timeFormat.parse(valueObj['timestamp']);
      var day = valueObj['day'] = monthDayFormat(valueObj['date']);

      var dayData = dailyValueExtent[day] = (dailyValueExtent[day] || [1000,-1]);
      var pmValue = valueObj['value']['PM2.5'];
      dayData[0] = d3.min([dayData[0],pmValue]);
      dayData[1] = d3.max([dayData[1],pmValue]);
    });
*/
  console.log(data)
  console.log(data[0])
    dateExtent = d3.extent(data,function(d){
      return d.day;
    });

    idExtent = d3.extent(data,function(d){
      return d.id_nb;
    });

    uniquevalues = d3.map(data, function(d) {return d.name;}).keys();
    console.log(uniquevalues);

    axisWidth = itemSize*(dateExtent[1]-dateExtent[0]+1);
    axisHeight = itemSize*(idExtent[1]-idExtent[0]);

    //size heatmap
    width=axisWidth;
    height=axisHeight;
    heatmap = svg
    .attr('width',width+margin.left+margin.right)
    .attr('height',height+margin.top+margin.bottom)
    .append('g')
    .attr('width',width)
    .attr('height',height)
    .attr('transform','translate('+margin.left+','+margin.top+')');    


    //render axises

    xAxis.scale(xAxisScale.range([0,axisWidth]).domain([dateExtent[0],dateExtent[1]+1]));  
    svg.append('g')
      .attr('transform','translate('+(margin.left+itemSize/2)+','+margin.top+')')
      .attr('class','x axis')
      .call(xAxis)
    .append('text')
      .text('Length in days')
      .attr('transform','translate('+axisWidth+',0)');
    
    //yAxis.scale(yAxisScale.range([0,axisHeight]).domain([idExtent[0],idExtent[1]+1])).ticks(idExtent[1]); 
    yAxis.scale(d3.scale.ordinal().rangePoints([0,axisHeight]).domain(uniquevalues)).ticks(idExtent[1]); 
    svg.append('g')
      .attr('transform','translate('+margin.left+','+(margin.top+itemSize/2)+')')
      .attr('class','y axis')
      .call(yAxis)
    .append('text')
      .text('Word')
      //.attr('transform','translate(-10,'+(axisHeight+50)+')');
      .attr('transform','translate(-50,-20)');

    //render heatmap rects
    dayOffset = dateExtent[0];
    rect = heatmap.selectAll('rect')
      .data(data)
    .enter().append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d){
        return itemSize*(d.day-dayOffset);
      })
      .attr('y',function(d){            
        return d.id_nb*itemSize;
      })
      .attr('fill','#ffffff');

    //rect.filter(function(d){ return d.value>0;})
    rect.append('title')
      .text(function(d){
        return 'Occurence: '+d.occur+'\n'+'day: '+d.day+' name: '+d.name;
      });

    renderColor();
  });

  function initCalibration(){
    d3.select('[role="calibration"] [role="example"]').select('svg')
      .selectAll('rect').data(colorCalibration).enter()
    .append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d,i){
        return i*itemSize;
      })
      .attr('fill',function(d){
        return d;
      });

    //bind click event
    d3.selectAll('[role="calibration"] [name="displayType"]').on('click',function(){
      renderColor();
    });
  }

  function renderColor(){
    var renderByCount = document.getElementsByName('displayType')[0].checked;

    rect.transition()
      .delay(function(d){      
        return (d.day-dayOffset)*15;
      })
      .duration(500)
      .attrTween('fill',function(d,i,a){
        //choose color dynamicly      
        var colorIndex = d3.scale.quantize()
          .range([0,1,2,3,4,5])
          .domain((renderByCount?[0,100]:[0,1]));

        return d3.interpolate(a,colorCalibration[colorIndex(d.occur)]);
      });
  }

  //extend frame height in `http://bl.ocks.org/`
  d3.select(self.frameElement).style("height", "600px");  
})();
