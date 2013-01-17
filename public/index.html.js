<!DOCTYPE html> 
<html> 
<head> 
  <title>Audio Adventures</title>
  
  <link href='http://sherpa.local/~dann/audio/public/css/main.css' rel='stylesheet' type='text/css'>
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
    {daml alias string "audio reset" as :reset}
    {daml alias string "audio connect" as :connect}
    {daml alias string "audio connect to 0" as :output}
    
    {begin nextstep | daml import into :deck as :next}
      {@current_slide | add 1 | > :@current_slide}
      {network bounce daml {"{@value | > :@current_slide}" | string transform from :@value to @current_slide}}
    {end nextstep}

    {begin nextstep | daml import into :deck as :prev}
      {@current_slide | subtract 1 | > :@current_slide}
      {network bounce daml {"{@value | > :@current_slide}" | string transform from :@value to @current_slide}}
    {end nextstep}

    {/osc 5 | > :lfo | gain 80 | osc | out | play}
    {/lfo | set :frequency to 1}
    {/lfo | set :frequency to 10}
    {/osc 5 | gain 80 | osc | audio mainline | play}
    
  </script>
    
  <script type="text/daml" id="postload">
    {(

      {* (
        :header ""
        :code ""
      )}
      
      {* (
        :header "http://sherpa.local:8008"
      )}
      
      {* (
        :header "A Basic Oscillator"
        :code "
var osc = context.createOscillator()
osc.connect(output)
osc.frequency.value = 440
osc.type = osc.SINE
osc.noteOn(0)
        "
      )}
      
      {* (
        :header "Voltage Controlled Oscillator"
        :code "
var osc = context.createOscillator()
osc.connect(output)
osc.noteOn(0)

var gain = context.createGain();
gain.gain.value = 80.0;
gain.connect(osc.frequency);

var lfo = context.createOscillator()
lfo.frequency.value = 5
lfo.connect(gain)
lfo.noteOn(0)"
      )}

      {* (
        :header "A 30-Second Primer on Sound"
        :bullets (
          "brain"
          "ear"
          "air"
          "speaker"
          "hardware"
          "software"
        )
      )}
      {* (
        :header "Now with Harmonics"
        :code "
var gain1600 = context.createGain();
gain1600.gain.value = 0.5;

var osc1600 = context.createOscillator()
osc1600.frequency.value = 1600
osc1600.connect(gain1600)
osc1600.noteOn(0)

var gain1400 = context.createGain();
gain1400.gain.value = 0.5;
gain1600.connect(gain1400)

var osc1400 = context.createOscillator()
osc1400.frequency.value = 1400
osc1400.connect(gain1400)
osc1400.noteOn(0)

var gain1200 = context.createGain();
gain1200.gain.value = 0.5;
gain1400.connect(gain1200)

var osc1200 = context.createOscillator()
osc1200.frequency.value = 1200
osc1200.connect(gain1200)
osc1200.noteOn(0)

var gain1000 = context.createGain();
gain1000.gain.value = 0.5;
gain1200.connect(gain1000)

var osc1000 = context.createOscillator()
osc1000.frequency.value = 1000
osc1000.connect(gain1000)
osc1000.noteOn(0)

var gain800 = context.createGain();
gain800.gain.value = 0.5;
gain1000.connect(gain800)

var osc800 = context.createOscillator()
osc800.frequency.value = 800
osc800.connect(gain800)
osc800.noteOn(0)

var gain600 = context.createGain();
gain600.gain.value = 0.5;
gain800.connect(gain600)

var osc600 = context.createOscillator()
osc600.frequency.value = 600
osc600.connect(gain600)
osc600.noteOn(0)

var gain400 = context.createGain();
gain400.gain.value = 0.5;
gain600.connect(gain400)

var osc400 = context.createOscillator()
osc400.frequency.value = 400
osc400.connect(gain400)
osc400.noteOn(0)

var gain200 = context.createGain();
gain200.gain.value = 0.5;
gain400.connect(gain200)

var osc200 = context.createOscillator()
osc200.frequency.value = 200
osc200.connect(gain200)
osc200.noteOn(0)

var gain100 = context.createGain();
gain100.gain.value = 0.5;
gain400.connect(gain100)

var osc100 = context.createOscillator()
osc100.frequency.value = 100
osc100.connect(gain100)
osc100.noteOn(0)

gain100.connect(output)
"
      )}
      
      {* (
        :header "Voltage Controlled Oscillator, redux"
        :dform :true
        :code "osc 5 | gain 80 | osc 440 | output"
      )}

      {* (
        :header "Now with Color!"
        :code "
add a processing graph
and an oscillator"
      )}

      {* (
        :header "A 30-second FFT Primer"
        :bullets ("<img src="http://intmstat.com/blog/2012/12/fourier-series2.gif" />" "<img src="http://ars.els-cdn.com/content/image/1-s2.0-S0886335003005248-gr1.gif" />")
      )}

      {* (
        :header "A Synth Example"
        :code "
Add key binding for daml code
Show spectrum and osc
maybe show graph of daml
maybe allow graph editing
"
      )}

      {* (
        :header "Convolution and Impulse Response"
        :bullets (
          "Room mapping"
          "Echo effects"
          "Stored as audio file"
        )
      )}

      {* (
        :header "Positional Audio"
        :bullets (
          "Panner and listener"
          "Beachball"
          "Ping Pong"
          "Pinball"
        )
      )}

      {* (
        :header "3D Mapping"
        :bullets (
          "Inaudible audio"
          "Motion tracking"
          "Slightly terrifying"
        )
      )}

      {* (
        :header "Sing to Code"
        :bullets (
          "Create processing network"
          "Genetic algorithms / machine learning"
          "Parallelizable"
        )
      )}

      {* (
        :header "Penultima"
        :bullets (
          "Voice recognition / synthesis"
          "Visualization networks"
          "Distributed orchestra"
          "Live coding"
          "So much more..."
        )
      )}

      {* (
        :header "A/V Club!"
        :bullets (
          "dann @ twitter"
          "dann @ bentobox dot net"
        )
      )}

    ) | > :@slides}

    {begin slider | variable bind path :@current_slide}
      {@slides.#{@current_slide}.header | > :@header}
      {@slides.#{@current_slide}.bullets | > :@bullets}
      {@slides.#{@current_slide}.dform | > :@dform}
      {@slides.#{@current_slide}.code | > :@code}
    {end slider}
    
    {1 | > :@current_slide}    
  </script>

  <div id="presentation">
    
    <div id="header">
      <script type="text/daml" data-var="@header">
        {@header}
      </script>
    </div>
    
    <div id="bullets">
      <script type="text/daml" data-var="@bullets">
        <ul>
          {begin list | each data @bullets}
            <li>{value}</li>
          {end list}
        </ul>
      </script>
    </div>
    
    <div id="dform">
      <script type="text/daml" data-var="@dform">
        {begin check | if @dform}
          <form action="" method="" id="some_daml">
            <input type="text" name="daml" value="" id="daml" />
            <textarea name="commands" style="display:none">
              {begin verbatim | quote}
                {daml}
              {end verbatim}
            </textarea>
          </form>
        {end check}
      </script>
    </div>
    
    <pre>
      <code id="code"><script type="text/daml" data-var="@code">{@code | quote}</script></code>
    </pre>
    
  </div>

  <script type="text/javascript" src="http://sherpa.local/~dann/katsu/nodely/__underscore.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/katsu/nodely/__jquery.js"></script>
  <script type="text/javascript" src="http://sherpa.local/~dann/audio/get.php?file=node_modules/daml"></script>
  <script src="/socket.io/socket.io.js"></script>
  
  <script type="text/javascript">
    $(document).ready(function() {
      // preload
      DAML.run($('#preload').text())

      // compile & bind the text/daml templates
      $("script[type*=daml]").each(function() {
        // id it
        var begin, end, block, id, el, pid = $(this).parent()[0].id
        id = this.id || pid || (DAML.onerror("Can't find a block id for the script tag") && "foo")
      
        if(id == 'preload') return
      
        // block it
        begin = '{begin ' + id + '} '
        end = ' {end ' + id + '}'
        block = begin + this.innerHTML + end
        DAML.run(block)
      
        // attach it
        el = this.dataset.el || (id == pid) ? pid : false
        if(el) {
          DAML.run('{dom set_template id :' + el + ' daml ' + id + '}')
          if(this.dataset.var) {
            DAML.run('{variable bind path :' + this.dataset.var + ' daml "{dom refresh id :' + el + '}"}')
          }
        }
      })
      
      var keynavon = true
      $(document).delegate("input, textarea", "focus", function(e){ keynavon = false })
      $(document).delegate("input, textarea", "blur", function(e){ keynavon = true })
      $(document).keydown( function(e) {
        if (!keynavon || !DAML.ETC.prime) return true
        
        var keyCode = e.keyCode || e.which, arrow = {left: 37, up: 38, right: 39, down: 40 }
        
        switch (keyCode) {
          case arrow.left:
            e.preventDefault()
            DAML.run('{deck prev}')
          break
          case arrow.right:
            e.preventDefault()
            DAML.run('{deck next}')
          break
        }
      })
      
      
      socket = io.connect('http://sherpa.local:8008');
      socket.on('connect', function () {
        // console.log('connect ok!')
      });
    
      socket.on('bounced', function (data) {
        if(DAML.ETC.prime) return false
        DAML.run(data.daml, data.context)
      });

      socket.on('primer', function (data) {
        if(data.prime == true) {
          DAML.ETC.prime = true
        }
      });

      primeme = function(pwd) {
        socket.emit('primeme', {pwd: pwd})
      }
      
      DAML.run(DAML.VARS.postload)
    })
  </script>
  
</body>
</html>