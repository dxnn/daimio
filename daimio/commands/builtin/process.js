// commands for processing Daimio 

D.import_models({
  process: {
    desc: "Commands for processing Daimio in various interesting ways",
    methods: {
      
      sleep: {
        desc: "'Did I fall asleep? Shall I go now?'",
        params: [
          {
            key: 'for',
            desc: 'A number of milliseconds to sleep',
            type: 'number',
            required: true
          },
          {
            key: 'then',
            desc: "Something to do after -- usually populated by the previous pipeline segment",
            type: 'anything',
          },
        ],
        fun: function(_for, then, prior_starter) {
          if(!_for) {
            setImmediate(function() {
              prior_starter(then)
            })
          }
          else {
            setTimeout(function() {
              prior_starter(then)
            }, _for)
          }
          
          return NaN
        },
      },
      
      // THINK: a command that lets you pass a handler, method, and hash o' params, for those fancy occasions.
      
      tap: {
        desc: "Send a message to the _tap port",
        params: [
          {
            key: 'value',
            desc: 'This is returned from the command, and is the default message value',
            type: 'anything',
            required: true
          },
          {
            key: 'send',
            desc: 'The message to send; defaults to value param'
          },
        ],
        fun: function(value, send) {          
          /*
            {$foo | log}            // for when you want to return nothing after
            {$foo | tap}            // for when you want to pass that thing along
            {$foo | log (__ :here)} // pass $foo along, but send (__ :here) to the log

            so... the first case should also return $foo, right? so log and tap are synonyms? 
            or tap is hardcoded, and you can't give it the second param. 
            and then log and tap are still different, because the first case does what it says.
            ok, do that.
            
            no no no. you don't need two commands. just this:
            
            {123 | tap | add 1}
            {123 | tap (__ :asdf) | add 1}
            
            that's it.
            
            longform:
            
            {process tap value 123 | add 1}
            {process tap value 123 send (__ :asdf) | add 1}
            
          */

          // THINK: we should defunc things, or something, probably... maybe like this?
          // actually, we should probably use D.scrub_var or the ilk. we want blocks to stringify, but not lists.
          value = (typeof value === 'function') ? value() : value
          
          // TODO: send a message to a _tap port instead of calling console.log
          console.log(send ? send : value) // THINK: 'send' is "" when unset (why?), so we can't send falsy messages... 

          return value
        },
      },
      
      downport: {
        desc: "Create a downport from this pipeline",
        params: [
          {
            key: 'value',
            desc: 'The value passed into the downport',
            type: 'anything',
          },
          {
            key: 'name',
            desc: 'The name of the port you seek',
            type: 'string',
          },
        ],
        fun: function(value, name, prior_starter, process) {
          // find the correct port, using port.name [this is a runtime value, which is stinky -- it can change]
          // TODO: lock the command-port relationship in at spaceseed creation time
          var port = process.space.ports.filter(function(port) {
                       return (port.name == name && port.station == process.space.station_id) 
                     })[0] 

          if(!port)
            return D.set_error('No corresponding port exists on this station')
          
          // send the value, go async while we wait for the reply
          
          var callback = function(value) {
            prior_starter(value)
          }
          
          port.exit(value, callback, process) // yuck: process is only here for 'exec' ports :(
          
          return NaN
        },
      },
      
      quote: {
        desc: "Return a pure string, possibly containing Daimio",
        params: [
          {
            key: 'value',
            desc: "A string",
            type: "string",
            required: true,
          },
        ],
        fun: function(value) {
          return value // type system handles the escaping
        },
      },
      
      unquote: {
        desc: "Convert a string into a block. This will eventually execute (it's a bit like a delayed run), so use it carefully",
        params: [
          {
            key: 'value',
            desc: "A string",
            type: "string",
            required: true,
          },
        ],
        fun: function(value) {
          return D.Parser.string_to_block_segment(value)
        },
      },
      
      run: {
        desc: "Completely process some Daimio code",
        params: [
          {
            key: 'block',
            desc: "Some Daimio code",
            type: "block",
            required: true,
          },
          {
            key: 'with',
            desc: 'If provided values are imported into the block scope.',
            help: 'The magic key __in becomes the process input. If scalar the value is taken to be __in.',
            type: 'maybe-list'
          },
        ],
        fun: function(block, _with, prior_starter, process) {
          if(Array.isArray(_with)) {
            _with = {'__in': _with[0]}
          } else 
          if(_with === false || !D.is_nice(_with)) {
            _with = Object.keys(process.state)
                          .filter(function(key) {return +key != +key})
                          .reduce(function(acc, key) {acc[key] = process.state[key]; return acc}, {})
          }
          
          return block(function(value) {
            prior_starter(value)
          }, (_with || {}), process)
          
          // return NaN
          
          // var space = D.OuterSpace
          // space.real_execute(value, callback) 
          // TODO: fix me this is stupid it needs the right space
          
          // return D.run(value)
        },
      },
      
    }
  }
});