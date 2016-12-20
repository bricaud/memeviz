var timeseries = (function(){
  //UI configuration
  var itemSize = 28,
    cellSize = itemSize-1,
    width = 900,
    height = 800,
    margin = {top:50,right:100,bottom:30,left:150};

 /*
  //formats
  var hourFormat = d3.time.format('%H'),
    dayFormat = d3.time.format('%j'),
    timeFormat = d3.time.format('%Y-%m-%dT%X'),
    monthDayFormat = d3.time.format('%m.%d');
*/
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
    xAxisScale = d3.scaleLinear(),
    xAxis = d3.axisTop()
      //.ticks(d3.time.days,3)
      //.tickFormat(monthDayFormat),
    yAxisScale = d3.scaleLinear()
      .range([0,axisHeight])
      .domain([0,10]),
    yAxis = d3.axisLeft()
      //.ticks(5)
      //.tickFormat(d3.format('s'))
      .scale(yAxisScale);

  var svg = {};
  var heatmap = {};

  var rect = null;

  function show(filename){

    d3.json(filename,function(err,data){

    /*  data.forEach(function(valueObj){
        valueObj['date'] = timeFormat.parse(valueObj['timestamp']);
        var day = valueObj['day'] = monthDayFormat(valueObj['date']);

        var dayData = dailyValueExtent[day] = (dailyValueExtent[day] || [1000,-1]);
        var pmValue = valueObj['value']['PM2.5'];
        dayData[0] = d3.min([dayData[0],pmValue]);
        dayData[1] = d3.max([dayData[1],pmValue]);
      });
  */

      dateExtent = d3.extent(data,function(d){
        return d.day;
      });

      idExtent = d3.extent(data,function(d){
        return d.word_id_nb;
      });

      uniquevalues = d3.map(data, function(d) {return d.name;}).keys();
      console.log(uniquevalues);
      console.log(dateExtent);

      axisWidth = itemSize*(dateExtent[1]-dateExtent[0]);
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
      xAxis.scale(xAxisScale.range([0,axisWidth]).domain([dateExtent[0],dateExtent[1]])).ticks(dateExtent[1]-dateExtent[0]);  
      svg.append('g')
        .attr('transform','translate('+(margin.left+itemSize/2)+','+margin.top+')')
        .attr('class','x axis')
        .call(xAxis);
        //.append('text')
        //.text('Length in days')
        //.attr('transform','translate('+axisWidth+',-10)');
      
      //yAxis.scale(yAxisScale.range([0,axisHeight]).domain([idExtent[0],idExtent[1]+1])).ticks(idExtent[1]); 
      yAxis.scale(d3.scalePoint().range([0,axisHeight]).domain(uniquevalues)).ticks(idExtent[1]); 
      svg.append('g')
        .attr('transform','translate('+margin.left+','+(margin.top+itemSize/2)+')')
        .attr('class','y axis')
        .call(yAxis);

      svg.append("text")
        //.attr("transform", "rotate(-90)")
        .attr("y",20)
        .attr("x",margin.left/2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Word");      

      svg.append("text")
        .attr("y", 0 )
        .attr("x",margin.left+width/2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Day of the month");      

      //render heatmap rects
      dayOffset = dateExtent[0];
      rect_group = heatmap.selectAll('g')
        .data(data)
      .enter().append('g');
      

      rect = rect_group.append('rect')
        .attr('width',cellSize)
        .attr('height',cellSize)
        .attr('x',function(d){
          return itemSize*(d.day-dayOffset);
        })
        .attr('y',function(d){            
          return d.word_id_nb*itemSize;
        })
        .attr('fill','#ffffff');

      rect.append('title')
        .text(function(d){
          return 'Occurence: '+d.degree+'\n day: '+d.day+' word: '+d.name;
        });
      // Add the number inside the rectangles
      rect_group.append("text").attr('x',function(d){
          return itemSize*(d.day-dayOffset)+itemSize/10;
        })
        .attr('y',function(d){            
          return d.word_id_nb*itemSize+itemSize/4*3;
        }).text(function(d){return d.degree;});

       /* 
      rect = heatmap.selectAll('rect')
        .data(data)
      .enter().append('rect')
        .attr('width',cellSize)
        .attr('height',cellSize)
        .attr('x',function(d){
          return itemSize*(d.day-dayOffset);
        })
        .attr('y',function(d){            
          return d.word_id_nb*itemSize;
        })
        .attr('fill','#ffffff');

      //rect.filter(function(d){ return d.value>0;})
      rect.append('title')
        .text(function(d){
          return 'Occurence: '+d.degree+'\n day: '+d.day+' word: '+d.name;
        });
      */
      //rect.text(function(d){return d.degree;});

      renderColor();
    });
  }

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

    
    svg = d3.select('[role="heatmap"]');
    svg.selectAll("*").remove();

    heatmap = svg
    .attr('width',width)
    .attr('height',height)
    .append('g')
    .attr('width',width-margin.left-margin.right)
    .attr('height',height-margin.top-margin.bottom)
    .attr('transform','translate('+margin.left+','+margin.top+')');

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
        var colorIndex = d3.scaleQuantize()
          .range([0,1,2,3,4,5])
          .domain((renderByCount?[10,200]:[0,1]));

        return d3.interpolate(a,colorCalibration[colorIndex(d.degree)]);
      });
  }

  return {
    initCalibration : initCalibration,
    show : show
  }
  //extend frame height in `http://bl.ocks.org/`
  //d3.select(self.frameElement).style("height", "800px");  
})();
