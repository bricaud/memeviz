function forcegraph(data_file,svg_in) {
  var width = +svg_in.attr("width"),
      height = +svg_in.attr("height");

  var svg = svg_in.call(d3.zoom().on("zoom", function () {
          svg.attr("transform", d3.event.transform)
        }))
          .append("g").attr("id","forcegraph")

  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var color = d3.scaleOrdinal(d3.schemeAccent);
  var color = d3.scaleSequential(d3.interpolatePiYG);
  //var color = d3.scaleSequential(d3.schemeRdYlBu);
  var color = d3.scaleSequential(d3.interpolateReds);
  //var color = d3.scaleSequential(d3.interpolateRdBu);
  //var color = d3.scaleSequential(d3.interpolateInferno);

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

  //////////////////////////////////////////////////////////////////////:
  var graph = d3.json(data_file, function(error, data) {
    if (error) throw error;
    graph = data;
    write_graph_props(graph);
    update_graph(graph);
  });
  /////////////////////////////////////////////////////////////////////:
  function write_graph_props(graph){
    name = graph.name
    document.getElementById("graph_name").innerHTML = 'Series name: '+name;
    document.getElementById("graph_start_date").innerHTML = 'Start date: '+graph.start_date;
    document.getElementById("graph_end_date").innerHTML = 'End date: '+graph.end_date;
  }

  ////////////////////////////////////////////////////////////////////:
  function update_graph(graph){
    var color_choice = d3.select('input[name="colorchoice"]:checked').node().value;
    console.log(color_choice);

    svg.selectAll("*").remove();


    var link = svg.append("g").attr("class", "links")  
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      //.attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .style("marker-end",  "url(#suit)") // Modified line ;

    // definition of nodes
    var node = svg.selectAll("g").select("node")
                  .data(graph.nodes)
                  .enter().append("g")
                  .attr("class", "node")
                  .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended))
                  .on("click",mouse_click);

      var nodec = node.append("circle")
                    .attr("r", function(d){return 2*Math.sqrt(d.nb_occur)+2;})
                    .style("stroke","black")
                    //.attr("fill", function(d) { return color(d.color_rel); });
                    .attr("fill", function(d) { if (color_choice=='absolute') {
                        return color(d.color);
                      }
                      else {
                        return color(d.color_rel);
                      }
                    });


    nodec.append("title")
        .text(function(d) { return 'Nb occur: ' + d.nb_occur +'\n'+ 'Start time: ' + d.start_time; });

    var text1 = node.append("text")
      .attr("x", 8)
      .attr("y", ".31em")
      .text(function(d) { return d.name;});

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    simulation.alphaTarget(0).restart();

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      nodec
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      text1
          .attr("x", function(d) { return d.x+12; })
          .attr("y", function(d) { return d.y; });
    }

    svg.append("defs").selectAll("marker")
      .data(["suit", "licensing", "resolved"])
    .enter().append("marker")
      .attr("id", function(d) { return d; })
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
      .style("stroke", "#4679BD")
      .style("opacity", "0.6");

  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
      //d.fx = null;
      //d.fy = null;
  }

  function mouse_click(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    if (d3.event.ctrlKey) {  ////////////////////////////////////////////////////////////////////////
      console.log('shift pressed')
      d.fx = null;
      d.fy = null;
    }
    else {
      dashboard_event_call(1,d.name);
    }
  }
}
