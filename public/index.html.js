<!DOCTYPE html> 
<html> 
<head>   
  <title>FigViz</title>
  
  <script type="text/javascript" src="http://sherpa.local/~dann/thingviz/public/js/__jquery.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/thingviz/public/js/__underscore.js"></script>

  <script type="text/javascript" src="http://sherpa.local/~dann/thingviz/get.php?file=node_modules/daml&x=3"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/thingviz/public/js/jDaimio.js"></script> 

  <script type="text/javascript" src="http://sherpa.local/~dann/thingviz/node_modules/d3/d3.v2.js"></script>
  
  <script src="http://sherpa.local/~dann/thingviz/public/js/bootstrap.min.js"></script>
  <link href="http://sherpa.local/~dann/thingviz/public/css/bootstrap.css" rel="stylesheet">
  
<!--   <script type="text/javascript" src="http://bentodojo.com/thingviz/public/js/__jquery.js"></script>
  <script type="text/javascript" src="http://bentodojo.com/thingviz/public/js/__underscore.js"></script>

  <script type="text/javascript" src="http://bentodojo.com/thingviz/get.php?file=node_modules/daml&x=3"></script>
  <script type="text/javascript" src="http://bentodojo.com/thingviz/public/js/jDaimio.js"></script> 

  <script type="text/javascript" src="http://bentodojo.com/thingviz/node_modules/d3/d3.v2.js"></script>
  
  <script src="http://bentodojo.com/thingviz/public/js/bootstrap.min.js"></script>
  <link href="http://bentodojo.com/thingviz/public/css/bootstrap.css" rel="stylesheet"> -->
  
  <style type="text/css">
    #grid svg {
      font: 12px sans-serif;
    }
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
    #force .node circle{
      stroke: #ddd;
      stroke-width: 1px;
    }

    #hive svg {
      background: #eef;
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
    {begin build_viz}
      {ddd do action :grider params {* (:nodes {@nouns | list rekey} :links {@verbs | list rekey})} options {* (:id :grid)} }
      
      {ddd do action :hiver params {* (:nodes {@nouns | list rekey} :links {@verbs | list rekey})} options {* (:id :hive)} }
      
      {ddd do action :forcer 
              params {* (:nodes {@nouns | list rekey} 
                         :links {@verbs | list rekey} 
                         :charge -800 
                         :distance 150)} 
              options {* (:id :force)} }
    {end build_viz}
      
    {begin forcer_hacking}
      {value | > :verb 
       || -1 | > :i}
      {begin source_hacking | each data @nouns}
        {i 
          | add 1 
          | > :i
          | else "{0 | > {"@nouns.{key}.edgeweight" | run}}"}
        {value._id 
          | eq verb.from 
          | then "{i | > :@source
           || value.edgeweight
            | add verb.value
            | > {"@nouns.{key}.edgeweight" | run}} "}
        {value._id 
          | eq verb.to 
          | then "{i | > :@target
           || value.edgeweight
            | add verb.value
            | > {"@nouns.{key}.edgeweight" | run}} "}
      {end source_hacking}
      {@source | > {"@verbs.{key}.source" | run}}
      {@target | > {"@verbs.{key}.target" | run}}
    {end forcer_hacking}
    
    {begin noun_stuff | variable bind path :@nouns}
      {/ddd do action :bubbler params ({* (:name :foo :children @nouns)})}
      {/@nouns | each template "{value | > {"@values.{value._id}" | run}}"}
      {/@values | > :@nouns}
      {begin hive_hacking | each data @nouns}
        {math random max 2 | > {"@nouns.{key}.x" | run}}
        {math random max 10 | math divide by 10 | > {"@nouns.{key}.y" | run}}
      {end hive_hacking}
      {if @verbs then "{forcer_hacking | each data @verbs}"}
      {@once_through | then "{build_viz}"}
      {:true | > :@once_through}
    {end noun_stuff}
    
    {begin verb_stuff | variable bind path :@verbs}
      {forcer_hacking | each data @verbs}
      {build_viz}
      {dom refresh id :add_verb_form}
    {end verb_stuff}    
    
    {begin noun_fetcher}
      {network send string "{noun find}" then "{this.#1 | sort by :name | list rekey path :_id | > :@nouns}"}
      {//{begin blerp} {begin fetch | proc | {* (:DATA @data)}}{noun find | > :data.nouns}{end fetch}{end blerp} //}
    {end noun_fetcher}
    
    {begin verb_fetcher}
      {network send string "{verb find}" then "{this.#1 | sort by "{@nouns.{this.from}.name}" | list rekey path :_id | > :@verbs}"}
    {end verb_fetcher}
    
    
    {// Activate!! //}
    {noun_fetcher}
    {process wait for 500 then "{verb_fetcher}"} {// this really stinks //}
    
    {dom on event :submit id :add_noun_form}
    {dom on event :submit id :add_verb_form}
    
    {dom on event :click id :nounlistlink daml "{dom toggle id :nounlist}"}
    {dom on event :click id :verblistlink daml "{dom toggle id :verblist}"}
    
    {dom on event :click id :nounlist filter :a daml "{this.dataset.id | > :@selected_noun}"}
    {dom on event :click id :verblist filter :a daml "{this.dataset.id | > :@selected_verb}"}
    
    {dom refresh id :add_noun_form}
    {dom refresh id :add_verb_form}

    {dom on event :click id :grid_button daml "{dom toggle id :grid}"}
    {dom on event :click id :hive_button daml "{dom toggle id :hive}"}
    {dom on event :click id :force_button daml "{dom toggle id :force}"}
    
    {dom on event :click id :add_noun_form filter :#add_a_new_noun daml "{"" | > :@selected_noun}"}
    {dom on event :click id :add_verb_form filter :#add_a_new_verb daml "{"" | > :@selected_verb}"}
    
    {dom on event :click id :force filter ".node" daml "{@nouns.{this.dataset.id} | > :@filter_noun}"}
  </script>

  
  <div class="container">
    <div class="page-header">
      <h1>ThingViz</h1>
    </div>

    <div class="row">
      <div class="span6">

        <!-- <form method="post" accept-charset="utf-8" onsubmit="jDaimio.process($('#daml').val(), {}, function(results) {DAML.run('{noun_fetcher}')}); return false;" class="form-vertical">
          <p>Raw DAML (kinda):</p>
          <textarea id="daml" name="daml" rows="1" cols="40"></textarea>    
          <input type="submit" name="submit" value="go">
        </form> -->


        <!-- NOUNS -->


        <form method="post" accept-charset="utf-8" id="add_noun_form">
          <script type="text/daml" data-var="@selected_noun">
            {@selected_noun | then @nouns.{@selected_noun} else "" | > :noun ||}
            
            {begin editing | if noun}
              <h2>Editing {noun.name}</h2>
              <a href="#" id="add_a_new_noun">Add a new noun instead</a>
            {end editing}
            
            {begin adding | if {not noun}}
              <h2>Add a new noun</h2>
            {end adding}

            <label for="name">Name</label>
            <input type="text" name="name" value="{noun.name}" id="name">

            <label for="type">Type</label>
            {* (:instigator (
                  :individual)
                :cluster (
                  :organization 
                  :community 
                  :company)
                :thing (
                  :exhibition
                  :engagement
                  :workshop
                  :event
                  :game
                  :art
                  :media
                  :publication)
            ) | > :types ||}
            <select name="type" id="type">
              {begin outer | each data types}
                <optgroup label="{key}">
                  {begin inner | each data value}
                    <option {noun.type | eq value | then :selected} value="{value}">{value}</option>
                  {end inner}
                </optgroup>
              {end outer}
            </select>
            
            <label for="story">Story</label>
            <textarea name="story" id="story">{noun.data.story}</textarea>

            {// <label for="data">Data</label>
            <input type="text" name="data" value="{noun.data | list to_daml}" id="data"> //}

            <input type="hidden" name="id" value="{noun._id}" id="id">
            <input type="submit" name="submit" value="{noun | then :Edit else :Add}">
            <textarea name="commands" style="display:none">
              {begin verbatim | quote}
                {* (:id id :name name :type type :story story) | > :context}
                {if id 
                    then "{noun set_name id POST.id value POST.name}
                          {noun set_type id POST.id value POST.type}
                          {noun set_data id POST.id value {* (:story POST.story)}}"
                    else "{noun add name POST.name type POST.type data {* (:story POST.story)}}"
                   | > :actions}
                {network send string actions then "{noun_fetcher}" context context}
                {false | > :@selected_noun}
              {end verbatim}
            </textarea>
          </script>
        </form>

        <h3><a href="#" id="nounlistlink">Noun List</a></h3>
        <ul id="nounlist" style="display:none">
          <script type="text/daml" data-var="@nouns">
            {begin list | merge data @nouns}
              <li>
                <p>
                  <a href="#" data-id="{_id}">edit</a>
                  <strong>{name}</strong>
                  {type}
                  <em>{data.story}</em>
                </p>
                {/data}
              </li>
            {end list}
          </script>
        </ul>
      </div>

      <!-- VERBS -->

      <div class="span6">
        <form method="post" accept-charset="utf-8" id="add_verb_form">
          <script type="text/daml" data-var="@selected_verb">
            {@selected_verb | then @verbs.{@selected_verb} else "" | > :verb ||}
            {begin editing | if verb}
              <h2>Editing {@nouns.{verb.from}.name} -> {@nouns.{verb.to}.name}</h2>
              <a href="#" id="add_a_new_verb">Add a new verb instead</a>
            {end editing}
            {begin adding | if {not verb}}
              <h2>Add a new verb</h2>
            {end adding}

            <label for="type">Type</label>
            {(:instigated
              :hired
              :participated
              :organized
              :coordinated
              :created
              :influenced
              :originated
              :consulted
              :cited
              :assisted
              :mentored
              :collaborated
            ) | > :types ||}
            <select name="type" id="type">
              {begin loop | each data types}
                <option {verb.type | eq value | then :selected} value="{value}">{value}</option>
              {end loop}
            </select>

            {// <label for="data">Data</label>
            <input type="text" name="data" value="{verb.data}" id="data"> //}

            <div style="display:{verb | then :none else :block}">              
              <label for="from">From</label>
              <select name="from" id="from_noun_list">
                {begin from_noun_list | merge data @nouns}
                  <option value="{_id}">{name}</option>
                {end from_noun_list}
              </select>
              {dom set_template id :from_noun_list daml "{from_noun_list | merge data @nouns}"}
              {variable bind path :@nouns daml "{dom refresh id :from_noun_list}"}
            </div>

            <div style="display:{verb | then :none else :block}">              
              <label for="to">To</label>
              <select name="to" id="to_noun_list">
                {begin to_noun_list | merge data @nouns}
                  <option value="{_id}">{name}</option>
                {end to_noun_list}
              </select>
              {dom set_template id :to_noun_list daml "{to_noun_list | merge data @nouns}"}
              {variable bind path :@nouns daml "{dom refresh id :to_noun_list}"}
            </div>
            
            <label for="value">Value (strength of connection)</label>
            <input type="text" name="value" value="{verb.value}">

            <input type="hidden" name="id" value="{verb._id}" id="id">
            <input type="submit" name="submit" value="{verb | then :Edit else :Add}">
            <textarea name="commands" style="display:none">
              {begin verbatim | quote}
                {* (:id id :type type :from from :to to :value value :data data) | > :context}
                {if id 
                  then "{verb set_type id POST.id value POST.type}
                        {/verb set_from id POST.id value POST.name}
                        {/verb set_to id POST.id value POST.name}
                        {verb set_value id POST.id value POST.value}"
                  else "{verb add type POST.type from POST.from to POST.to value POST.value data {POST.data | run}}"
                 | > :actions | dom log | ""}
                {network send string actions then "{verb_fetcher}" context context}
                {false | > :@selected_verb}
              {end verbatim}
            </textarea>
          </script>
        </form>

        <h3><a href="#" id="verblistlink">Verb List</a></h3>
        <ul id="verblist" style="display:none">
          <script type="text/daml" data-var="@verbs">
            {begin list | merge data @verbs}
              <li>
                <p>
                  <a href="#" data-id="{_id}">edit</a>
                  <strong>{@nouns.{from}.name}</strong> <em>type</em> <strong>{@nouns.{to}.name}</strong>
                  ({value})
                </p>
                {/data}
              </li>
            {end list}
          </script>
        </ul>

      </div>
    </div>
  </div>
  
  
  <!-- VIZ! -->
  
  <!-- <select name="grid_order" id="grid_order">
    <option value="name">name</option>
    <option value="group">group</option>
    <option value="count">count</option>
  </select> -->
  
  <div id="filter_noun_div">
    <script type="text/daml" data-var="@filter_noun">
      <p><strong>{@filter_noun.name}</strong></p>
      <p>{@filter_noun.data.story}</p>
      <ul>
        {begin list 
          | merge data {@verbs
            | extract "{@filter_noun._id | is in (this.to this.from) | then 1}"
            | sort by :value
            | list reverse}}
          <li style="color: #{value | divide by 10 | round | math subtract from 9 | > :x}{x}{x};">
            {@nouns.{to}.name} <em>{type}</em> {@nouns.{from}.name} ({value})
          </li>
        {end list}
      </ul>
    </script>
  </div>
  
  <!-- Make these into tabs or something -->
  <div>    
    <button id="grid_button">Grid</button>
    <button id="hive_button">Hive</button>
    <button id="force_button">Force</button>
  </div>
  
  <div class='gallery' id='grid' style="display:none"> </div>
  <div class='gallery' id='hive' style="display:none"> </div>
  <div class='gallery' id='force' style="display:none"> </div>
  
  <pre style="display:none">
    TODOS:
    - edit support: change add commands to 'just' add, and then require the follow-up 'set's... mark things as 'incomplete'? (immutable fields can be in the add command.) then modify the field to do fancy edit stuff. then add a command to do... something.
    - daggr?
    - build CPS interpreter
    - develop content engine
    - connect routes to content
    - allow client-side editing of content
    - real-time stuffs
    - rollbacks and event stuff (and hooks to externals, like ifttt)
    - rooms
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



    // FORCE

    // nodes = {name:foo} [also data.shoes & data.height, for now]
    // links = {source: 1, target: 2}
    DAML.ETC.d3.forcer = function(id, width, height, nodes, links, charge, distance) {    
      // defaults
      var width = width || 800,
          height = height || 600,
          id = id || 'force',
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
          .style("stroke-width", function(d) { return Math.sqrt(d.value*4 || 9); })
          .style("stroke", function(d) { return color(d.type.charCodeAt(7) || 1); });
      
      // link.exit().remove();
      
      var node = svg.selectAll("g.node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("data-id", function(d) {return d._id;})
          .call(force.drag);

      node.append("circle")
          .attr("r", function(d) {return Math.sqrt((d.edgeweight || 1) + 20) * 5; })
          .style("fill", function(d) { return color(d.type.charCodeAt(1) || 1); });

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


    // HIVE

    // nodes = {x:1, y:0.4}
    // links = {source: 1, target: 2}
    DAML.ETC.d3.hiver = function(id, width, height, nodes, links) {    
      // defaults
      var width = width || 800,
          height = height || 600,
          id = id || 'hive';
      
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
    
    
    // GRID
    
    
    // nodes = {name:foo, group:1}
    // links = {source:3, target:0, value:10}
    DAML.ETC.d3.grider = function(id, width, height, nodes, links) {
      // defaults
      var width = width || 720,
          height = height || 720,
          id = id || 'grid';
      
      var margin = {top: 120, right: 0, bottom: 10, left: 120};

      var x = d3.scale.ordinal().rangeBands([0, width]),
          z = d3.scale.linear().domain([0, 4]).clamp(true),
          c = d3.scale.category10().domain(d3.range(10));

      d3.select("#" + id + " svg").remove();
      var svg = d3.select('#' + id).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var matrix = [],
          n = nodes.length;

      // Compute index per node.
      nodes.forEach(function(node, i) {
        node.index = i;
        node.count = 0;
        matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
      });

      // Convert links to matrix; count character occurrences.
      links.forEach(function(link) {
        matrix[link.source][link.target].z += link.value;
        matrix[link.target][link.source].z += link.value;
        matrix[link.source][link.source].z += link.value;
        matrix[link.target][link.target].z += link.value;
        nodes[link.source].count += link.value;
        nodes[link.target].count += link.value;
      });

      // Precompute the orders.
      var orders = {
        name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
        count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
        group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
      };

      // The default sort order.
      x.domain(orders.name);

      svg.append("rect")
          .attr("class", "background")
          .attr("width", width)
          .attr("height", height);

      var row = svg.selectAll(".row")
          .data(matrix)
        .enter().append("g")
          .attr("class", "row")
          .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
          .each(row);

      row.append("line")
          .attr("x2", width);

      row.append("text")
          .attr("x", -6)
          .attr("y", x.rangeBand() / 2)
          .attr("dy", ".32em")
          .attr("text-anchor", "end")
          .text(function(d, i) { return nodes[i].name; });

      var column = svg.selectAll(".column")
          .data(matrix)
        .enter().append("g")
          .attr("class", "column")
          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

      column.append("line")
          .attr("x1", -width);

      column.append("text")
          .attr("x", 6)
          .attr("y", x.rangeBand() / 2)
          .attr("dy", ".32em")
          .attr("text-anchor", "start")
          .text(function(d, i) { return nodes[i].name; });

      function row(row) {
        var cell = d3.select(this).selectAll(".cell")
            .data(row.filter(function(d) { return d.z; }))
          .enter().append("rect")
            .attr("class", "cell")
            .attr("x", function(d) { return x(d.x); })
            .attr("width", x.rangeBand())
            .attr("height", x.rangeBand())
            .style("fill-opacity", function(d) { return z(d.z); })
            .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
      }

      function mouseover(p) {
        d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
        d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
      }

      function mouseout() {
        d3.selectAll("text").classed("active", false);
      }

      d3.select("#order").on("change", function() {
        clearTimeout(timeout);
        order(this.value);
      });

      function order(value) {
        x.domain(orders[value]);

        var t = svg.transition().duration(2500);

        t.selectAll(".row")
            .delay(function(d, i) { return x(i) * 4; })
            .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
          .selectAll(".cell")
            .delay(function(d) { return x(d.x) * 4; })
            .attr("x", function(d) { return x(d.x); });

        t.selectAll(".column")
            .delay(function(d, i) { return x(i) * 4; })
            .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
      }

      // var timeout = setTimeout(function() {
      //   order("group");
      //   d3.select("#order").property("selectedIndex", 2).node().focus();
      // }, 5000);
      
      window.order = order;
    };
    
  </script>
</body>
</html>