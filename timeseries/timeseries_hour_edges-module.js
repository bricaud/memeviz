var timeseries = (function(){
  //UI configuration
  var itemSize = 28,
    cellSize = itemSize-1,
    width = 900,
    height = 800,
    margin = {top:50,right:100,bottom:30,left:250};

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
    dateOffset = 0,
    colorCalibration = ['#f6faaa','#FEE08B','#FDAE61','#F46D43','#D53E4F','#9E0142'],
    //colorCalibration = ['#9E0142'],
    dailyValueExtent = {};

  //axises and scales
  var axisWidth = 0 ,
    axisHeight = itemSize*24,
    //xAxisScale = d3.scaleLinear(),
    xAxisScale = d3.scaleTime(),
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

  function datenumber(day,hour,dateOffset){
    return (day-dateOffset)*24 + hour-dateOffset;
  }
  function makedate(d,dateOffset){
    data_date = new Date(d.year,d.month-1,d.day,d.hour);
    datediff = Math.floor(Math.abs(data_date-dateOffset)/(60*60*1000));
    return datediff;
  }

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
      
      dayExtent = d3.extent(data,function(d){
        return d.day;
      });
      

      //dateExtent = d3.extent(data,function(d){
      //  return datenumber(d.day,d.hour);
      //});

      date_extent = d3.extent(data,function(d){
        return new Date(d.year,d.month-1,d.day,d.hour);
      });
      date_hourdiff = (date_extent[1]-date_extent[0])/(60*60*1000);

      idExtent = d3.extent(data,function(d){
        return d.word_id_nb;
      });

      uniquevalues = d3.map(data, function(d) {return d.name;}).keys();
      console.log(uniquevalues);
      //console.log(dateExtent);
      console.log(date_extent);
      console.log(date_extent[0].getHours());

      axisWidth = itemSize*date_hourdiff;
      axisHeight = itemSize*(idExtent[1]-idExtent[0]);

      //size heatmap
      width=axisWidth;
      height=axisHeight;
      console.log(width);

      heatmap = svg
      .attr('width',width+margin.left+margin.right)
      .attr('height',height+margin.top+margin.bottom)
      .append('g')
      .attr('width',width)
      .attr('height',height)
      .attr('transform','translate('+margin.left+','+margin.top+')');
    

      //render axises
      xAxis.scale(xAxisScale.range([0,axisWidth]).domain([date_extent[0],date_extent[1]])).ticks(d3.timeHour.every(1));//.tickFormat(date_extent[1]-date_extent[0],'%I %p');//.ticks(date_extent[1]-date_extent[0]);  
      svg.append('g')
        .attr('transform','translate('+(margin.left+itemSize/2)+','+margin.top+')')
        .attr('class','x axis')
        .call(xAxis)
        .selectAll("text")
        .attr("y", -15)
        .attr("x", 9)
        .attr("dy", ".35em").attr("transform", "rotate(-45)");
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
        .text('Jour du mois: '+date_extent[0].getDate());      

      //render heatmap rects
      dateOffset = date_extent[0];
      rect_group = heatmap.selectAll('g')
        .data(data)
      .enter().append('g');
      

      rect = rect_group.append('rect')
        .attr('width',cellSize)
        .attr('height',cellSize)
        .attr('x',function(d){
          return itemSize*makedate(d,dateOffset);
        })
        .attr('y',function(d){            
          return d.word_id_nb*itemSize;
        })
        .attr('fill','#ffffff');

      rect.append('title')
        .text(function(d){
          return 'Occurence: '+d.occur+
            '\n day: '+d.day+', hour: '+d.hour+', word: '+d.name+ 
            '\n main media: '+d.main_media+ ', with occur: '+d.main_media_occur;
        });
      // Add the number inside the rectangles
      rect_group.append("text").attr('x',function(d){
          return itemSize*makedate(d,dateOffset)+itemSize/10;
        })
        .attr('y',function(d){            
          return d.word_id_nb*itemSize+itemSize/4*3;
        }).text(function(d){return d.occur;});

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
        return makedate(d,dateOffset)*15;
      })
      .duration(500)
      .attrTween('fill',function(d,i,a){
        //choose color dynamicly      
        var colorIndex = d3.scaleQuantize()
          .range([0,1,2,3,4,5])
          .domain((renderByCount?[10,200]:[0,1]));

        return d3.interpolate(a,colorCalibration[colorIndex(d.occur)]);
      });
  }

  return {
    initCalibration : initCalibration,
    show : show
  }
  //extend frame height in `http://bl.ocks.org/`
  //d3.select(self.frameElement).style("height", "800px");  
})();
