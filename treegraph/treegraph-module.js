var treegraph = (function(){
  // Module for the tree graph 


  var _svg = {};
  var _svg_width = 0, 
    _svg_height = 0;

  var figure = {};
  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var color = d3.scaleOrdinal().domain(['Twitter','Blog','Comment','Dailymotion','Facebook',
                                        'Forum','Gplus','Instagram','Media','Website','Youtube','Avis'])
                                .range(['steelblue','green','brown','lightblue','blue','pink','lightred','yellow','orange','lightgreen','red','grey']) 

  var color_shade = d3.scaleSequential(d3.interpolateReds);

  function start(data_file,svg_in){

    _svg_width = +svg_in.attr("width");
    _svg_height = +svg_in.attr("height");
    _svg = svg_in;

    var borderPath = svg_in.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", _svg_height)
            .attr("width", _svg_width)
            .style("stroke", 'black')
            .style("fill", "none")
            .style("stroke-width", 1);

    var svg = svg_in.call(d3.zoom().on("zoom", function () {
          svg.attr("transform", d3.event.transform)
        })).append("g");
    figure = svg.append("g").attr("id","treegraph")
              .attr("transform", "translate(" + (_svg_width / 2 ) + "," + (_svg_height / 2 ) + ")");
              //.attr("transform", "rotate(90)");
    
    // add action on radio button selection
    d3.selectAll('[name="colorform_treegraph"] [name="color_choice_treegraph"]').on('click',function(){
      console.log('color change!');
      update();
    });

    figure.append('text').text('Click on a node of the graph to start')
    //handle_data(data_file);
  }

  function handle_data(data_file){

    var stratify = d3.stratify()
        .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

    var tree = d3.tree()
        .size([360, _svg_width*3/4])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  
      d3.json(data_file, function(error, data) {
      if (error) {
        console.log('Data file not found.')
        console_box.innerHTML = 'Data file not found.';
        throw error;
      }

      //var root = tree(stratify(data));
      //var root = tree(data);
      var root = tree(d3.hierarchy(data));
      draw_graph(root);
      });
  }

  function draw_graph(tree_data){
    var color_choice = d3.select('input[name="color_choice_treegraph"]:checked').node().value;
    root = tree_data;    
    var link = figure.selectAll(".link")
      .data(root.descendants().slice(1))
      .enter().append("path")
        .attr("class", "link")
        .attr("d", function(d) {
          return "M" + project(d.x, d.y)
              + "C" + project(d.x, (d.y + d.parent.y) / 2)
              + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
              + " " + project(d.parent.x, d.parent.y);
        }).style("opacity", function(d) { return Math.sqrt(d.data.occur/100.0);});

    var node = figure.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
        .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", 4.5)
        //.style('fill',function(d){ return color(d.data.main_media)})
        //.style('fill',function(d){ return color_shade(d.data.relative_time/31)})
        .style("fill", function(d) { if (color_choice=='media_color') {
                        return color(d.data.main_media);
                      }
                      else {
                        return color_shade(d.data.relative_time/31);
                      }
                    })
        .on('click',click);

    node.append("text")
        .attr("dy", ".31em")
        //.attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
        //.attr("x", function(d) { return d.x < 180 ? 6 : -6; })
        //.style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; })
        //.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("x", function(d) { return d.x < 180 ? -6 : 6; })
        .style("text-anchor", function(d) { return d.x < 180 ? "end" : "start"; })
        .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
        //.text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); });
        .text(function(d) { return d.data.name+" "+d.data.occur; });
  }

  function project(x, y) {
    var angle = (x - 90) / 180 * Math.PI, radius = y;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  }

  function click (d){
    var SELECTED_COLOR = '#fff';
    d3.selectAll('.selected').style('fill',function(d){ return color(d.data.main_media)});
    d3.selectAll('.selected').classed('selected',false);
    d3.select(this).classed('selected',true);
    d3.selectAll('.selected').style('fill',SELECTED_COLOR);
    console.log(d.data.main_media);
    console_box.innerHTML = d.data.name+", Nb of occurences: "+d.data.occur+
                              ", main media: "+d.data.main_media+", appearance in media: "+d.data.nb_occur_m_media+
                              ", start time: "+d.data.start_time+", relative time in days: "+d.data.relative_time
    
  }

  function update(data_file,svg_in){
    clean_svg();
    handle_data(data_file);
  }

  function clean_svg(){
    figure.selectAll("*").remove();
  }


  return {
    start : start,
    clean_svg : clean_svg,
    update : update
  }
})();