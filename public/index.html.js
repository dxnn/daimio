<!DOCTYPE html> 
<html> 
<head> 
  <link rel="stylesheet" href="http://sherpa.local/~dann/katsu/nodely/css/styles.css" type="text/css" media="screen" title="no title" charset="utf-8">
  <link rel="stylesheet" href="http://sherpa.local/~dann/katsu/nodely/css/bootstrap.min.css" type="text/css" media="screen" title="no title" charset="utf-8">
  
  <title>FigViz</title>
  
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/__jquery.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/__underscore.js"></script>

  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/get.php?file=node_modules/daml&x=1"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/figviz/public/js/jDaimio.js"></script> 
  
</head>
<body id="">
  
  <form method="post" accept-charset="utf-8" onsubmit="jDaimio.process($('#daml').val(), {}, function(results) {DAML.run('{noun_fetcher}')}); return false;">
    <textarea id="daml" name="daml" rows="8" cols="40"></textarea>    
    <input type="submit" name="submit" value="go">
  </form>
  
  <script type="text/daml" id="preload">
    {// Import any needed commands here //}
  </script>
    
  <script type="text/daml" id="noun_fetcher">
    {begin blerp} {begin fetch | proc | {* (:DATA @data)}}
      {noun find | > :data.nouns}
    {end fetch}{end blerp}
    
    {network send string "{noun find} " then "{this.#1 | > :nouns}" context {* (:mech_id REQ.mech_id)} }
  </script>
  
  
  <p>Noun List</p>
  <ul id="nounlist">
    <script type="text/daml" data-var="nouns">
      {begin list | merge data nouns}
        <li>
          {name}
        </li>
      {end list}
    </script>
  </ul>
  
  
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
    });
  </script>
  
  <pre>
    TODOS:
    -- make {noun add}, find, verb add/find
    - add D3 support
    - build CPS interpreter
    - develop content engine
    - connect routes to content
    - allow client-side editing of content
    - real-time stuffs
  </pre>
  
</body>
</html>