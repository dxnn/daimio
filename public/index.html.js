<!DOCTYPE html> 
<html> 
<head>   
  <title>FigViz</title>
  
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/__jquery.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/__underscore.js"></script>

  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/get.php?file=node_modules/daml&x=1"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/jDaimio.js"></script> 

  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/node_modules/d3/d3.v2.js"></script>
  
  <script src="http://sherpa.local/~dann/euphrates/js/bootstrap.min.js"></script>
  <link href="http://sherpa.local/~dann/euphrates/css/bootstrap.css" rel="stylesheet">
  
  <style type="text/css">
    #grid .background {
      fill: #eee;
    }
    #grid line {
      stroke: #fff;
    }
    #grid text.active {
      fill: red;
    }
  
    #force svg {
      background: #efe;
    }
    #force .link {
      stroke: #999;
      stroke-opacity: .6;
    }

    #hive svg {
      background: #fee;
    }
    #hive .link {
      stroke-width: 1.5px;
    }
    #hive .axis, #hive .node {
      stroke: #000;
      stroke-width: 1.5px;
    }
  </style>
  
</head>
<body id="">
  
  <script type="text/daml" id="preload">
    {// Import any needed commands here //}
    {// (note that you can't access any other script blocks from here...) //}
    
  </script>
    
  <script type="text/daml" id="postload">    
    {begin noun_stuff | variable bind path :@nouns}
      {/ddd do action :bubbler params ({* (:name :foo :children @nouns)})}
      {/@nouns | each template "{value | > {"@values.{value._id}" | run}}"}
      {/@values | > :@nouns}
      {begin hive_hacking | each data @nouns}
        {math random max 2 | > {"@nouns.{key}.x" | run}}
        {math random max 10 | math divide by 10 | > {"@nouns.{key}.y" | run}}
      {end hive_hacking}
    {end noun_stuff}
    
    {begin verb_stuff | variable bind path :@verbs}
      {begin forcer_hacking | each data @verbs}
        {value | > :verb || -1 | > :i}
        {// get the from and to indices //}
        {@nouns | each template "
          {i | add 1 | > :i}
          {value._id | is like verb.from | then "{i | > :@source} "}
          {value._id | is like verb.to | then "{i | > :@target} "}
        "}
        {@source | > {"@verbs.{key}.source" | run}}
        {@target | > {"@verbs.{key}.target" | run}}
      {end forcer_hacking}
      
      {ddd do action :grider params {* (:nodes {@nouns | list rekey} :links {@verbs | list rekey} :charge -800 :distance 50)} options {* (:id :grid)} }
      
      {ddd do action :hiver params {* (:nodes {@nouns | list rekey} :links {@verbs | list rekey} :charge -800 :distance 50)} options {* (:id :hive)} }
      
      {ddd do action :forcer 
              params {* (:nodes {@nouns | list rekey} 
                         :links {@verbs | list rekey} 
                         :charge -800 
                         :distance 150)} 
              options {* (:id :force)} }
    {end verb_stuff}    
    
    {begin noun_fetcher}
      {//{begin blerp} {begin fetch | proc | {* (:DATA @data)}}
        {noun find | > :data.nouns}
      {end fetch}{end blerp} //}

      {network send string "{noun find}" then "{this.#1 | list rekey path :_id | > :@nouns}"}
    {end noun_fetcher}
    
    {begin verb_fetcher}
      {network send string "{verb find}" then "{this.#1 | list rekey path :_id | > :@verbs}"}
    {end verb_fetcher}
    
    
    {// Activate!! //}
    {noun_fetcher}
    {process wait for 500 then "{verb_fetcher}"} {// this really stinks //}
    
    {dom on event :submit id :add_noun_form}
    {dom on event :submit id :add_verb_form}
    
    {dom on event :click id :nounlistlink daml "{dom toggle id :nounlist}"}
    {dom on event :click id :verblistlink daml "{dom toggle id :verblist}"}
    
    {dom on event :click id :verblist filter :a daml "{this.dataset.id | dom log}"}
  </script>

  
  <div class="container">
    <div class="page-header">
      <h1>ThingViz</h1>
    </div>

    <div class="row">
      <div class="span6">

        <form method="post" accept-charset="utf-8" onsubmit="jDaimio.process($('#daml').val(), {}, function(results) {DAML.run('{noun_fetcher}')}); return false;" class="form-vertical">
          <p>Raw DAML (kinda):</p>
          <textarea id="daml" name="daml" rows="1" cols="40"></textarea>    
          <input type="submit" name="submit" value="go">
        </form>


        <!-- NOUNS -->


        <form method="post" accept-charset="utf-8" id="add_noun_form">
          <h2>Add a new noun</h2>

          <label for="name">Name</label>
          <input type="text" name="name" value="" id="name">

          <label for="type">Type</label>
          <select name="type" id="type">
            <option value="instigator">instigator</option>
            <option value="cluster">cluster</option>
            <option value="thing">thing</option>
          </select>

          <label for="data">Data</label>
          <input type="text" name="data" value="" id="data">

          <input type="submit" name="submit" value="add">
          <textarea name="commands" style="display:none">
            {* (:name name :type type :data data) | > :context}
            {network send string "{noun add name POST.name type POST.type data {POST.data | run}}" then "{noun_fetcher}" context context}
          </textarea>    
        </form>

        <h3><a href="#" id="nounlistlink">Noun List</a></h3>
        <ul id="nounlist" style="display:none">
          <script type="text/daml" data-var="@nouns">
            {begin list | merge data @nouns}
              <li>
                {name}, {type}, {data}
              </li>
            {end list}
          </script>
        </ul>
      </div>

      <!-- VERBS -->

      <div class="span6">
        <form method="post" accept-charset="utf-8" id="add_verb_form">
          <h2>Add a new verb</h2>

          <label for="type">Type</label>
          <select name="type" id="type">
            <option>hired</option>
            <option>participated</option>
            <option>organized</option>
            <option>coordinated</option>
            <option>created</option>
            <option>influenced</option>
            <option>originated</option>
            <option>consulted</option>
            <option>cited</option>
            <option>assisted</option>
            <option>mentored</option>
            <option>collaborated</option>
          </select>

          <label for="data">Data</label>
          <input type="text" name="data" value="" id="data">

          <label for="from">From</label>
          <select name="from" id="from_noun_list">
            <script type="text/daml" data-var="@nouns">
              {begin list | merge data @nouns}
                <option value="{_id}">{name}</option>
              {end list}
            </script>
          </select>

          <label for="to">To</label>
          <select name="to" id="to_noun_list">
            <script type="text/daml" data-var="@nouns">
              {begin list | merge data @nouns}
                <option value="{_id}">{name}</option>
              {end list}
            </script>
          </select>

          <label for="strength">Strength</label>
          <input type="text" name="strength" value="">

          <input type="submit" name="submit" value="add">
          <textarea name="commands" style="display:none">
            {* (:type type :from from :to to :strength strength :data data) | > :context}
            {network send string "{verb add type POST.type from POST.from to POST.to strength POST.strength data {POST.data | run}}" then "{verb_fetcher}" context context}
          </textarea>  
        </form>

        <h3><a href="#" id="verblistlink">Verb List</a></h3>
        <ul id="verblist" style="display:none">
          <script type="text/daml" data-var="@verbs">
            {begin list | merge data @verbs}
              <li>
                <p>
                  <a href="#" data-id="{_id}">edit</a>
                  <strong>{@nouns.{from}.name}</strong> -> <strong>{@nouns.{to}.name}</strong>
                  <em>{type}</em> {strength}
                </p>
                {/data}
              </li>
            {end list}
          </script>
        </ul>

      </div>
    </div>
  </div>
  
  <!-- Make these into tabs or something -->
  <div class='gallery' id='grid'> </div>
  <div class='gallery' id='hive'> </div>
  <div class='gallery' id='force'> </div>
  
  <pre style="display:none">
    TODOS:
    -- make {noun add}, find, verb add/find
    -- add D3 support
    -- better add support for nouns/verbs
    -- slicker D3 display, with verbs
    -- proper D3 refresh on add
    -- dataset update
    - edit support: change add commands to 'just' add, and then require the follow-up 'set's... mark things as 'incomplete'? (immutable fields can be in the add command.) then modify the field to do fancy edit stuff. then add a command to do... something.
    - daggr?
    - build CPS interpreter
    - develop content engine
    - connect routes to content
    - allow client-side editing of content
    - real-time stuffs
  </pre>
  
  <script type="text/javascript">
    $(document).ready(function() {
      // preload
      DAML.run($('#preload').text());

      // compile & bind the text/daml templates
      $("script[type*=daml]").each(function() {
        // id it
        var begin, end, block, id, el, pid = $(this).parent()[0].id;
        id = this.id || pid || (DAML.onerror("Can't find a block id for the script tag") && "foo");
      
        if(id == 'preload') return;
      
        // block it
        begin = '{begin ' + id + '}';
        end = '{end ' + id + '}';
        block = begin + this.innerHTML + end;
        DAML.run(block);
      
        // attach it
        el = this.dataset.el || (id == pid) ? pid : false;
        if(el) {
          DAML.run('{dom set_template id :' + el + ' daml ' + id + '}');
          if(this.dataset.var) {
            DAML.run('{variable bind path :' + this.dataset.var + ' daml "{dom refresh id :' + el + '}"}');
          }
        }
      });
      
      DAML.run(DAML.VARS.postload);
    });


    // D3 STUFF!!!


    DAML.ETC.d3.forcer = function(id, width, height, nodes, links, charge, distance) {    
      // defaults
      var width = width || 800,
          height = height || 600,
          id = id || 'chart',
          charge = charge || -800,
          distance = distance || 150,
          color = d3.scale.category20();
      
      d3.select("#" + id + " svg").remove();
      var svg = d3.select('#' + id).append("svg")
          .attr("width", width)
          .attr("height", height);
      
      var force = d3.layout.force()
          .charge(charge)
          .linkDistance(distance)
          .size([width, height]);
      
      force.nodes(nodes)
           .links(links)
           .start();
      
      var link = svg.selectAll("line.link")
          .data(links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function(d) { return Math.sqrt(d.strength*4 || 9); });
      
      // link.exit().remove();
      
      var node = svg.selectAll("g.node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .call(force.drag);

      node.append("circle")
          .attr("r", function(d) { return Math.sqrt(d.data.shoes || 8) * 13; })
          .style("fill", function(d) { return color(d.data.height || 2); });

      node.append("title")
          .text(function(d) { return d.name; });

      node.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", ".3em")
          .text(function(d) { return d.name; });
  
      // node.exit().remove();
  
      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
  
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      });
    };


    // hive graphs

    DAML.ETC.d3.hiver = function(id, width, height, nodes, links, charge, distance) {    
      // defaults
      var width = width || 800,
          height = height || 600,
          id = id || 'chart';
      
      var innerRadius = 40,
          outerRadius = 240;

      var angle = d3.scale.ordinal().domain(d3.range(4)).rangePoints([0, 2 * Math.PI]),
          radius = d3.scale.linear().range([innerRadius, outerRadius]),
          color = d3.scale.category10().domain(d3.range(20));

      d3.select("#" + id + " svg").remove();
      var svg = d3.select('#' + id).append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
          
    // var nodes = [
    //   {x: 0, y: .1},
    //   {x: 0, y: .9},
    //   {x: 1, y: .2},
    //   {x: 1, y: .3},
    //   {x: 2, y: .1},
    //   {x: 2, y: .8}
    // ];
    // 
    // var links = [
    //   {source: nodes[0], target: nodes[2]},
    //   {source: nodes[1], target: nodes[3]},
    //   {source: nodes[2], target: nodes[4]},
    //   {source: nodes[2], target: nodes[5]},
    //   {source: nodes[3], target: nodes[5]},
    //   {source: nodes[4], target: nodes[0]},
    //   {source: nodes[5], target: nodes[1]}
    // ];

      svg.selectAll(".axis")
          .data(d3.range(3))
        .enter().append("line")
          .attr("class", "axis")
          .attr("transform", function(d) { return "rotate(" + degrees(angle(d)) + ")"; })
          .attr("x1", radius.range()[0])
          .attr("x2", radius.range()[1]);

      for(var i=0, l=links.length; i < l; i++) {
        links[i].source = nodes[links[i].source];
        links[i].target = nodes[links[i].target];
      }

      svg.selectAll(".link")
          .data(links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", link()
          .angle(function(d) { return angle(d.x); })
          .radius(function(d) { return radius(d.y); }))
          .style("stroke", function(d) { return color(d.source.x); });

      svg.selectAll(".node")
          .data(nodes)
        .enter().append("circle")
          .attr("class", "node")
          .attr("transform", function(d) { return "rotate(" + degrees(angle(d.x)) + ")"; })
          .attr("cx", function(d) { return radius(d.y); })
          .attr("r", 5)
          .style("fill", function(d) { return color(d.x); });

      function degrees(radians) {
        return radians / Math.PI * 180 - 90;
      }

      function link() {
        var source = function(d) { return d.source; },
            target = function(d) { return d.target; },
            angle = function(d) { return d.angle; },
            startRadius = function(d) { return d.radius; },
            endRadius = startRadius,
            arcOffset = -Math.PI / 2;

        function link(d, i) {
          var s = node(source, this, d, i),
              t = node(target, this, d, i),
              x;
          if (t.a < s.a) x = t, t = s, s = x;
          if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
          var a1 = s.a + (t.a - s.a) / 3,
              a2 = t.a - (t.a - s.a) / 3;
          return "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
              + "L" + Math.cos(s.a) * s.r1 + "," + Math.sin(s.a) * s.r1
              + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
              + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
              + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1
              + "L" + Math.cos(t.a) * t.r0 + "," + Math.sin(t.a) * t.r0
              + "C" + Math.cos(a2) * t.r0 + "," + Math.sin(a2) * t.r0
              + " " + Math.cos(a1) * s.r0 + "," + Math.sin(a1) * s.r0
              + " " + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0;
        }

        function node(method, thiz, d, i) {
          var node = method.call(thiz, d, i),
              a = +(typeof angle === "function" ? angle.call(thiz, node, i) : angle) + arcOffset,
              r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
              r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
          return {r0: r0, r1: r1, a: a};
        }

        link.source = function(_) {
          if (!arguments.length) return source;
          source = _;
          return link;
        };

        link.target = function(_) {
          if (!arguments.length) return target;
          target = _;
          return link;
        };

        link.angle = function(_) {
          if (!arguments.length) return angle;
          angle = _;
          return link;
        };

        link.radius = function(_) {
          if (!arguments.length) return startRadius;
          startRadius = endRadius = _;
          return link;
        };

        link.startRadius = function(_) {
          if (!arguments.length) return startRadius;
          startRadius = _;
          return link;
        };

        link.endRadius = function(_) {
          if (!arguments.length) return endRadius;
          endRadius = _;
          return link;
        };

        return link;
      }
    };
  </script>
</body>
</html>