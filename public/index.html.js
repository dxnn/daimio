<!DOCTYPE html> 
<html> 
<head> 
  <!-- <link rel="stylesheet" href="http://sherpa.local/~dann/katsu/nodely/css/styles.css" type="text/css" media="screen" title="no title" charset="utf-8">
  <link rel="stylesheet" href="http://sherpa.local/~dann/katsu/nodely/css/bootstrap.min.css" type="text/css" media="screen" title="no title" charset="utf-8"> -->
  
  <title>FigViz</title>
  
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/__jquery.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/__underscore.js"></script>

  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/get.php?file=node_modules/daml&x=1"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/jDaimio.js"></script> 

  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/node_modules/d3/d3.v2.js"></script>
  
  <script src="http://sherpa.local/~dann/euphrates/js/bootstrap.min.js"></script>
  <link href="http://sherpa.local/~dann/euphrates/css/bootstrap.css" rel="stylesheet">
  
  <style type="text/css">
  line.link {
    stroke: #999;
    stroke-opacity: .6;
  }
  </style>
  
</head>
<body id="">
  
  <script type="text/daml" id="preload">
    {// Import any needed commands here //}

    {begin noun_stuff | variable bind path :nouns}
      {/ddd do action :bubbler params ({* (:name :foo :children nouns)})}
      {/nouns | each template "{value | > {"@values.{value._id}" | run}}"}
      {/@values | > :nouns}
    {end noun_stuff}
    
    {begin verb_stuff | variable bind path :verbs}
      {begin hacking | each data verbs}
        {value | > :verb}
        {// get the from and to indices //}
        {nouns | each template "{value._id | is like verb.from | then "{key | add 0 | > :@source} "}{value._id | is like verb.to | then "{key | add 0 | > :@target} "}"}
        {@source | > {"verbs.{key}.source" | run}}
        {@target | > {"verbs.{key}.target" | run}}
      {end hacking}
      {/verbs | each template "{value.from | > {"verbs.{key}.source" | run}}{value.to | > {"verbs.{key}.target" | run}}"}
      {ddd do action :forcer params ({* (:nodes nouns :links verbs)})}
    {end verb_stuff}
    
    {dom on event :submit id :add_noun_form}
    {dom on event :submit id :add_verb_form}
    
    {dom on event :click id :nounlistlink daml "{dom toggle id :nounlist}"}
    {dom on event :click id :verblistlink daml "{dom toggle id :verblist}"}
    
  </script>
    
  <script type="text/daml" id="noun_fetcher">
    {begin blerp} {begin fetch | proc | {* (:DATA @data)}}
      {noun find | > :data.nouns}
    {end fetch}{end blerp}
    
    {network send string "{noun find}" then "{this.#1 | > :nouns}"}
  </script>
  
  <script type="text/daml" id="verb_fetcher">
    {network send string "{verb find}" then "{this.#1 | > :verbs}"}
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
          <script type="text/daml" data-var="nouns">
            {begin list | merge data nouns}
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
            <script type="text/daml" data-var="nouns">
              {begin list | merge data nouns}
                <option value="{_id}">{name}</option>
              {end list}
            </script>
          </select>

          <label for="to">To</label>
          <select name="to" id="to_noun_list">
            <script type="text/daml" data-var="nouns">
              {begin list | merge data nouns}
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
          <script type="text/daml" data-var="verbs">
            {begin list | merge data verbs}
              <li>
                <p><a href="#">edit</a> {type} <em>{strength}</em></p>
                {from}
                {to}
                {data}
              </li>
            {end list}
          </script>
        </ul>

      </div>
    </div>
  </div>
  
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

      DAML.run(DAML.VARS.noun_fetcher);
      setTimeout(function() {DAML.run(DAML.VARS.verb_fetcher)}, 500);
    });
  </script>
  
  <div class='gallery' id='chart'> </div>
  
  <pre>
    TODOS:
    -- make {noun add}, find, verb add/find
    -- add D3 support
    -- better add support for nouns/verbs
    -- slicker D3 display, with verbs
    -- proper D3 refresh on add
    - dataset update
    - edit support
    - daggr?
    - build CPS interpreter
    - develop content engine
    - connect routes to content
    - allow client-side editing of content
    - real-time stuffs
  </pre>
  
  <script>
  
  var width = 960,
      height = 500;
  
  var color = d3.scale.category20();
  
  var force = d3.layout.force()
      .charge(-800)
      .linkDistance(150)
      .size([width, height]);
  
  var svg;

  var set_svg = function() {
    d3.select("svg").remove();
    svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);
  }
  
  var forcer = function(json) {
    set_svg();
    
    force
        .nodes(json.nodes)
        .links(json.links)
        .start();
  
    var link = svg.selectAll("line.link")
        .data(json.links)
      .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.strength*4 || 9); });

    // link.exit().remove();

    var node = svg.selectAll("g.node")
        .data(json.nodes)
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
  
  </script>
  
</body>
</html>