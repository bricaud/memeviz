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
    colorScaleDomain=[1,200],
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
      //console.log(uniquevalues);
      //console.log(data);
      //console.log(date_extent);
      //console.log(date_extent[0].getHours());

      houractivity = d3.nest().key(function(d){
                date = new Date(d.year,d.month-1,d.day,d.hour);
                return date.toUTCString();
              })
              .rollup(function(v) {return d3.sum(v,function(d){return d.occur;});})
              .entries(data);
      houractivity2 = d3.entries(houractivity);
      //console.log('time data:')
      //console.log(houractivity2)

      

      axisWidth = itemSize*date_hourdiff;
      axisHeight = itemSize*(idExtent[1]-idExtent[0]);

      //size heatmap
      width=axisWidth;
      height=axisHeight;
      //console.log(width);

      make_activity_chart(houractivity2,itemSize*(date_hourdiff+1));


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

  function init(){
  
    var svg = d3.select('[role="calibration"] [role="example"]').select('svg');
    
    var scalelength = colorCalibration.length*(cellSize+1);

    scalesvg = svg
    .attr('width',scalelength)
    .attr('height',cellSize+20);

    scalesvg.selectAll('rect').data(colorCalibration).enter()
      .append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d,i){
        return i*itemSize;
      })
      .attr('fill',function(d){
        return d;
      });

    scalesvg.append('text')
      .attr("y", 30 )
      .attr("x",10)
      .attr("dy", "1em")
      .style("text-anchor", "middle").text(colorScaleDomain[0]);

    scalesvg.append('text')
      .attr("y", 30 )
      .attr("x",scalelength-15)
      .attr("dy", "1em")
      .style("text-anchor", "middle").text(colorScaleDomain[1]);

    //bind click event
    d3.selectAll('[role="calibration"] [name="displayType"]').on('click',function(){
      renderColor();
    });
  }

  function cleansvg() {
    svg = d3.select('[role="heatmap"]');
    svg.selectAll("*").remove();

    heatmap = svg
    .attr('width',width)
    .attr('height',height)
    .append('g')
    .attr('width',width-margin.left-margin.right)
    .attr('height',height-margin.top-margin.bottom)
    .attr('transform','translate('+margin.left+','+margin.top+')');

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
        if (renderByCount){     
          var colorIndex = d3.scaleQuantize()
            .range([0,1,2,3,4,5])
            .domain(colorScaleDomain);
          coloring = d3.interpolate(a,colorCalibration[colorIndex(d.occur)]);
        }
        else {
          var mediacolor = d3.scaleOrdinal().domain(['Twitter','Blog','Comment','Dailymotion','Facebook',
                                        'Forum','Gplus','Instagram','Media','Website','Youtube','Avis'])
                                .range(['steelblue','green','brown','lightblue','blue','pink','lightred',
                                  'yellow','orange','lightgreen','red','grey']);
          coloring = d3.interpolate(a,mediacolor(d.main_media));
        }
        return coloring;
      });
  }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function make_activity_chart(timedata,plot_width){
    var figure = d3.select(".globalActivity"),
    margin = {top: 50, right: 20, bottom: 30, left: 250},
    //width = +figure.attr("width") - margin.left - margin.right,
    width = plot_width,
    height = +figure.attr("height") - margin.top - margin.bottom;

    
    ordered_list_of_dates = timedata.map(function(d) {return new Date(d.value.key);}).sort(function(a,b){
        return a-b;
      });
    //console.log(ordered_list_of_dates)
    date_to_process = ordered_list_of_dates[0];
    date_day = date_to_process.getDate();
    //date_month = date_to_process.getMonth();
    giveMonth = d3.timeFormat("%B");
    date_month = giveMonth(date_to_process);

    figure.selectAll("*").remove();
    figure.attr("width",plot_width + margin.left + margin.right);
    //xAxis.scale(xAxisScale.range([0,axisWidth]).domain([date_extent[0],date_extent[1]])).ticks(d3.timeHour.every(1));

    var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.01).paddingOuter(0),
      y = d3.scaleLinear().rangeRound([height, 0]);

    var g = figure.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //console.log(d3.extent(timedata,function(d) {return new Date(d.value.key.split('$').join(''));}))
    //console.log(d3.extent(timedata,function(d) {return new Date(d.key.replace(/['"]+/g, ''));}))
    //console.log([0, d3.max(timedata, function(d) { return d.value.value; })])

    //x.domain(d3.extent(timedata,function(d) {return new Date(d.value.key.split('$').join(''));}));
    x.domain(ordered_list_of_dates);
    y.domain([0, d3.max(timedata, function(d) { return d.value.value; })]);
    bar_length = x.bandwidth();
    //console.log(timedata)

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%_I %p")))//  ("%H:00")))//
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -15)
        .attr("dy", ".45em").attr("transform", "rotate(-90)");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(2));

    g.append("text")
        .attr("y", -height-margin.top/2 )
        .attr("x",width/2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text('Jour: '+date_day+" "+date_month);        

    //g.append("text").attr("x",50).attr("y",50).text(timedata);

    function return_x_value(d){
      //console.log(d.value.key);
      dadate = new Date(d.value.key);//.split('$').join(''));
      //dadate = new Date(d.key);
      //console.log(x(dadate));
      return x(dadate);
    }
    g2 = g.append("g");
    var bar = g2.selectAll("g")
      .data(timedata)
      .enter().append("g")
      .attr("transform", function(d) { return "translate(" + return_x_value(d) + ",0)"; });
      //.attr("transform", function(d) { return "translate(" + x(new Date(d.key.split('$').join(''))) + ",0)"; });

    bar.append("rect")
      .attr("y", function(d) { return y(d.value.value); }) 
      .attr("height", function(d) { return height - y(d.value.value); }) 
      .attr("width",bar_length)// x.bandwidth())
      .attr("fill",'steelblue'); 

    function return_y (d) { return y(d.value.value) - 10; }
  
    bar.append("g")
//   each text's x coord inherit from each g's transform-translate, after translate, each rect's topLeft corner its origin as (0, 0)
      //.attr("x", x.bandwidth() /2 )
      .attr("y", function(d) { return y(d.value.value) - 10; })
      .attr("dy", "0.35em")
      .append("text").attr("transform", "translate("+bar_length /4 +","+ 10 +")rotate(-45)")
      //.attr("dy", "0.35em")
      .text(function(d) { return d.value.value; });

  /*  g.selectAll(".bar")
      .data(timedata)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return 50; }) //x(d3.keys(d))
        .attr("y", function(d) { return 50; })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height ; });
  */
  }

  return {
    init : init,
    cleansvg : cleansvg,
    show : show
  }
  //extend frame height in `http://bl.ocks.org/`
  //d3.select(self.frameElement).style("height", "800px");  
})();
