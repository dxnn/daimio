<!DOCTYPE html> 
<html> 
<head> 
  <title>Audio Adventures</title>
  
  <style type="text/css" media="screen">
    body {
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0px; top: 0px;
    }

    #presentation {
      position: absolute;
      height: 100%;
      width: 100%;
      left: 0px;
      top: 0px;
      display: block;
      overflow: hidden;
      background: #778;
    }
    
    #header {
      color: #ccc;
      font: 5em 'Yanone Kaffeesatz';
      letter-spacing: 2px;
      position: absolute;
      top: 10%;
      left: 0;
      width: 100%;
      text-align: center;
    }
    
    #bullets {
      color: #ccc;
      font: 5em 'Yanone Kaffeesatz';
      letter-spacing: 2px;
      position: absolute;
      top: 10%;
      left: 0;
      width: 100%;
      text-align: center;
    }
    
    #code {
      color: #ccc;
      font-size: 2em;
      background: #556;
      position: absolute;
      top: 40%;
      left: 40%;
    }
  </style>
  
  <link href='http://fonts.googleapis.com/css?family=Yanone+Kaffeesatz' rel='stylesheet' type='text/css'>
</head>

<body id="">
  
  <script type="text/daml" id="preload">
    {// Import any needed commands here //}
    {// (note that you can't access any other script blocks from here...) //}
    
    {"{this.data.date | less than 1 | then 1}" | > :@the_filter}
    
    {daml alias string "audio add-osc freq" as :osc}
    {daml alias string "audio add-gain value" as :gain}
    {daml alias string "audio set-param name" as :set}
    {daml alias string "audio play" as :play}
    {daml alias string "audio pause" as :pause}
    {daml alias string "audio connect" as :connect}
    {daml alias string "audio connect to 0" as :out}

    {/osc 5 | > :lfo | gain 80 | osc | out | play}
    {/lfo | set :frequency to 1}
    {/lfo | set :frequency to 10}
    {/osc 5 | gain 80 | osc | audio mainline | play}
    
  </script>
    
  <script type="text/daml" id="postload">
    
  </script>

  <div id="presentation">
    
    <div id="header">
      <script type="text/daml" data-var="@header">
        <button class="btn {:active | if {@date_button | eq :april} }" id="april">April</button>
        <button class="btn {:active | if {@date_button | eq :july} }" id="july">July</button>
        <button class="btn {:active | if {@date_button | eq :nov} }" id="nov">November</button>
      </script>
    </div>
    
    <div id="bullets">
      <script type="text/daml" data-var="@bullets">
        <button class="btn {:active | if {@date_button | eq :april} }" id="april">April</button>
        <button class="btn {:active | if {@date_button | eq :july} }" id="july">July</button>
        <button class="btn {:active | if {@date_button | eq :nov} }" id="nov">November</button>
      </script>
    </div>
    
    <pre>
      <code id="code">
        <script type="text/daml" data-var="@code">
  				<button class="btn {:active | if {@date_button | eq :april} }" id="april">April</button>
  				<button class="btn {:active | if {@date_button | eq :july} }" id="july">July</button>
  				<button class="btn {:active | if {@date_button | eq :nov} }" id="nov">November</button>
  			</script>
      </code>
    </pre>
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
      
      DAML.run(DAML.VARS.postload);
    });
  </script>
  
  <script type="text/javascript" src="http://sherpa.local/~dann/katsu/nodely/__underscore.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/katsu/nodely/__jquery.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/audio/get.php?file=node_modules/daml"></script>
  
</body>
</html>