// message for IE users
var ieRegex = new RegExp("(MSIE |Trident/|Edge )");
if(ieRegex.test(navigator.userAgent)) {
  d3.select("body")
          .append("xhtml:p")
          .attr('id', 'ie')
          .html("<h1>Sorry</h1>This page doesn't display correctly in the internet Explorer. It works fine in most other browsers!");    
}


var wWidth =document.documentElement.clientWidth,
	  wHeight=document.documentElement.clientHeight-20;
var fixPix = 1200;
var fixWidth = Math.min(fixPix, fixPix*(wWidth/wHeight))
	fixHeight= Math.min(fixPix,fixWidth*(wHeight/wWidth));



var svg = d3.select("body")
   .append("svg:svg")
      .classed("svg-content-responsive", true)
      // aspect acording to window, widthFixed for the viewbox  scaling
      .attr("viewBox", "0 0 " + fixWidth + " " + fixHeight)
      .attr("pointer-events", "all");

var scaleRadius = d3.scale.log()
                    .domain([1,6])
                    .range([100,15]);
var scaleFont = d3.scale.log()
                    .domain([1,6])
                    .range([85,15]);
var scaleLength = d3.scale.log()
                    .domain([1,20])
                    .range([1,0.12]);

var color = d3.scale.category20();


var force = d3.layout.force()
    .gravity(.06)
    .charge(-200)
    .linkStrength(0.3)
    .friction(0.9)
    .on("tick", tick)
    .size([fixWidth, fixHeight]);
 var  link, 
      node,
      nodetext;


queue()
  .defer(d3.csv, "data/nodes1.csv", function(d){
    return {
      index: +d.index,
      id: d.id, // convert "Year" column to Date
      text: d.name,
      group: d.group,
      rank: +d.rank,// convert "Length" column to number
      visible: Boolean(+d.visible >0),
      clicked: Boolean(+d.clicked >0),
      tt: d.tt
    };
  })
  .defer(d3.csv, "data/links2.csv", function(d){
    return {
      source: d.source, // convert "Year" column to Date
      target: d.target,
      value: +d.value
    };
  })

  .await(ready);

//Main function 
function ready(error, nodesJson, linksJson) {
    // map of node ids
  var nodeMap = {};
  nodesJson.forEach(function(x) {
    nodeMap[x.id] = x; 
  });

  // reference to nodes in link id
  linksJson = linksJson.map(function(x) {
    return {
      source: nodeMap[x.source],
      target: nodeMap[x.target],
      value: x.value
    };
  });
  // save all connections in an array
  var linkedById = {};

  linksJson.forEach(function (d, i) {
    linkedById[d.source.id + "," + d.target.id] = i;
    linkedById[d.target.id + "," + d.source.id] = i;
  });
  //look up whether a pair are neighbours
  function neighboring(a, b) {
       return linkedById[a.id + "," + b.id];
  }




  var visibleNodes = [nodesJson[0], nodesJson[1]];
  var visibleLinks = [];

  force
    .nodes(visibleNodes)
    .links(visibleLinks)  
  force.nodes()[0].fixed=true;
  force.nodes()[0].x=fixWidth/2;
  force.nodes()[0].y=fixHeight/2;
  force.nodes()[1].fixed=true;
  force.nodes()[1].x=fixWidth*4/5;
  force.nodes()[1].y=fixHeight/2;

  // draw all visible elements
  function update(){
    force
      .nodes(visibleNodes)
      .links(visibleLinks)
      .linkDistance(function(d){
        return (scaleRadius(d.source.rank ) +
                scaleRadius(d.target.rank ) +
                (d.value-1) * 20);
      })      
      .start();

    link = svg.selectAll(".link")
        .data(visibleLinks);
    link.exit().remove();
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node = svg.selectAll(".node")
        .data(force.nodes(), function(d) { return d.id; });
    node.exit().remove();
    node.enter().append("g")
        .attr("class", "node")
        .style("fill", function(d) {
          if (d.group!="quote")  {
            var c = color(d.group);
            var c2 = color(d.group + "Hi");
            return c;
          }
        })
        .call(force.drag)
        .append("circle")
          .attr("id", function(d){return "c"+d.id})
          .attr("r", function(d) { 
            return scaleRadius(d.rank);
          })
          .each(function(d,i){insertTextDivs(this, d.id, d.text, d.rank); });
    //toolm tip circle extra styles
    svg.select("#cquote")
      .style("opacity", 0)
      .attr("stroke-width",0);

    nodetext = svg.selectAll(".nodetext")
      .on("mouseover", mouseover)
      .on("dblclick", dblclick)
      .on("click", mouseclick)
      .on("mouseout", mouseout);
    }
   update();


  // make  neigbours visible 
  function mouseclick(d){
    force.nodes()[0].fixed=true;
    force.nodes()[1].fixed=true;
    d3.selectAll("#quote")
      .style("opacity", 1)
      .html(d.tt)
      .interrupt() // cancel the current transition
      .transition()
      .delay(7000)
      .duration(2000)
      .style("opacity", 0);
    node
      .style("fill", function(n){
          if(n.group!="quote"){
            if (n.id == d.id){
              return color(n.group);
            } else return color(n.group + "Hi")
          } 
        })
      .interrupt()
      .transition()
        .delay(0)
        .duration(2000)
        .style("fill", function(n){
          if(n.group!="quote"){
            return color(n.group);
          }  
        });
    if (d3.event.defaultPrevented) return;
    if (!d.clicked & d.group!="quote") {
      d.clicked=true;
      nodesJson.forEach(function(n){
        if (neighboring(d,n)>-1){
          if(!n.visible){
            n.visible = true;
            visibleNodes.push(n);
          } 
        } 
      });
      visibleLinks = [];
      linksJson.forEach(function(l){
        if (l.target.visible & l.source.visible)
          visibleLinks.push(l);
      });
      update();
    }


  }

  // reset graph
  function dblclick(d){
    if (d3.event.defaultPrevented) return; 
    visibleNodes = [nodesJson[0], nodesJson[1]];
    console.log(visibleNodes);
    visibleLinks = [];
    nodesJson.forEach(function(n){
      n.visible = false;
      n.clicked = false;
    });
    force.nodes()[0].visible=true;
    force.nodes()[1].visible=true;
    update();
  }

  function mouseover(d){
  	svg.select("#c"+d.id).transition()
      .duration(250)
      .attr("r", function(d) {return scaleRadius(d.rank)+5});

  }
  function mouseout(d){
    svg.select("#c"+d.id).transition()
      .duration(250)
      .attr("r", function(d){return scaleRadius(d.rank)});
  }

  function resize() {
    wWidth = window.innerWidth;
    wHeight = window.innerHeight-10;
    fixWidth = Math.min(fixPix, fixPix*(wWidth/wHeight))
    fixHeight= Math.min(fixPix, fixPix*(wHeight/wWidth));
    svg.attr("viewBox", "0 0 " + fixWidth + " " +fixHeight);
    force.size([fixWidth,fixHeight]);
    // allow  node to drift back to center
    force.nodes()[0].fixed=false;
    force.nodes()[1].fixed=false;
    update();
  }
  d3.select(window).on("resize", resize);  


}
// prevent collision  
var padding = 1; // separation between circles
function collide(alpha) {
  var quadtree = d3.geom.quadtree(force.nodes());
   return function(d) {
    var radius = scaleRadius(d.rank),
        nx1 = d.x - radius,
        nx2 = d.x + radius,
        ny1 = d.y - radius,
        ny2 = d.y + radius;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
            rb = radius + scaleRadius(quad.point.rank) + padding;
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

// force layout tick
function tick() {
  link
    .attr("x1", function (d) {
      return d.source.x;
    })
    .attr("y1", function (d) {
      return d.source.y;
    })
    .attr("x2", function (d) {
      return d.target.x;
    })
    .attr("y2", function (d) {
      return d.target.y;
    });
      
  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  node.each(collide(0.1)); 
}

// for finding the longest word
function longerString(champ, contender){
      return (contender.length > champ.length) ? contender: champ;
}
// inserting text as foreignObjects (HTML)  
function insertTextDivs(t, id, text, rank) {
    var width = scaleRadius(rank)*1.95;
    var maxWordLength = text.split(" ").reduce(longerString).length;
    var fsize = Math.round(scaleFont(rank) *scaleLength(maxWordLength));
    var el = d3.select(t);
    var p = d3.select(t.parentNode);
    p.append("foreignObject")
        .attr('x', -width/2)
        .attr('y', -width/2)
        .attr("width", width)
        .attr("height", width)
        .append("xhtml:div")
          .attr('class', 'nodetext')
          .attr('id', id)
          .attr('style', 'min-height: '+ width+'px; font-size:' + fsize + 'px')
          .html(text);    
}
