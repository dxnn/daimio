// commands for fiddling with daimio directly

D.import_models({
  daimio: {
    desc: 'Commands for Daimio manipulation',
    methods: {
      
      // {daimio do handler : method : params {* ()} }
      // {daimio sandbox allow (:verb :noun :story :dom) remove {* (:story (:add :set_noun))} do $foo}
      
      
      'import': {
        desc: 'Import a set of commands into the local Daimio dialect',
        params: [
          {
            key: 'block', // THINK: this should be called 'daimio'... /sigh
            desc: 'A Daimio string',
            type: 'block',
            required: true,
          },
          {
            key: 'into',
            desc: 'A model to import into',
            type: 'string',
            required: true,
            falsy: false,
          },
          {
            key: 'as',
            desc: "The new method's name",
            type: 'string',
            required: true,
            falsy: false,
          },
          {
            key: 'params',
            desc: 'A list of parameters',
            type: 'list',
            fallback: []
          },
        ],
        fun: function(block, into, as, params) {
          // var obj={}, pobj=[], fun
          
          // TODO: throw a warning when importing a template that references non-local variables [a block wrapped in a command can only read params and locally declared vars, and can only produce a single output stream (no external (e.g. global) var writing, e.g.)] -- ie, imported commands have no runtime state side effects (though they may touch the db, eg), and aren't influenced by their environment. they neither influence nor are influenced by their environment. whereas general blocks are like plugable puzzle pieces that accept inputs from their environment and can alter it in various ways (including piping the standard output to other places, but also directly mutating environmental variables).
          
          // THINK: maybe the above applies to closed spaces, not commands. but i dunno.
          
          // TODO: allow hashes as params 
          // for(var i=0, l=params.length; i < l; i++) {
          //   pobj.push({key: params[i], desc: "A param"})
          // }
          
          // funthunker = function() {
          //   D.execute('variable', 'push_context', [])
          //   for(var i=0, l=params.length; i < l; i++) {
          //     D.execute('variable', 'set', [params[i], arguments[i]])
          //   }
          //   var output = template.toFun()
          //   D.execute('variable', 'push_context', [])
          //   return output
          // }

          // obj[into] = {methods: {}}
          // obj[into]['methods'][as] = {"params": pobj, "fun": funthunker}
          
          // D.import_models(obj)
        },
      },
      
      alias: {
        desc: "Create a new alias.",
        params: [
          {
            key: 'string',
            desc: "A string",
            type: "string",
            required: true,
            falsy: false,
          },
          {
            key: 'as',
            desc: "The newer, shorter string",
            type: "string",
            required: true,
          },
        ],
        fun: function(string, as) {
          var obj = {}
          obj[as] = string
          D.import_aliases(obj)
          return ""
        },
      },
      
      quote: {
        desc: "Return a pure string, possibly containing D",
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
        desc: "Completely process some D",
        params: [
          {
            key: 'block',
            desc: "Some D",
            type: "block",
            required: true,
          },
        ],
        fun: function(block, prior_starter, process) {
          return block(function(value) {
            prior_starter(value)
          }, {}, process)
          
          // return NaN
          
          // var space = D.OuterSpace
          // space.REAL_execute(value, callback) 
          // TODO: fix me this is stupid it needs the right space
          
          // return D.run(value)
        },
      },
      
      // parse: {
      //   desc: "Convert a Daimio string's canonical ptree",
      //   params: [
      //     {
      //       key: 'string',
      //       desc: "The stage key",
      //       type: "string",
      //     },
      //   ],
      //   fun: function(string) {
      //     return D.parse(string)
      //   },
      // },
      
    }
  }
})