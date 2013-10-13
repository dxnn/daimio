// commands for variables

D.import_models({
  variable: {
    desc: "Commands for spacial variable manipulation",
    vars: {counter: 0, paths: [], bindings: {}, bindhashes: {}, activepaths: {}},
    methods: {
      
      get: {
        desc: "Get a variable's value",
        help: "An alias for {variable get path :foo type :space} would be {$foo}",
        params: [
          {
            key: 'name',
            desc: "A variable name, sans glyph",
            type: 'string',
            required: true,
            falsy: false,
          },
          {
            key: 'type',
            desc: "Type can be pipeline (marked with _) or space (marked with $)",
            type: 'string', // List('space', 'pipeline')
            fallback: 'space',
          },
        ],
        fun: function(name, type, prior_starter, process) {
          var state, value 
          
          if(type == 'space')
            state = process.space.state
          
          else if(type == 'pipeline') {
            state = process.state
            
            // if(name == '_') {
            //   // get the previous *top* segment's key
            //   for(var i=L.length-1; i >= 0; i--) {
            //     if(L[i].top) {
            //       new_key = L[i].key
            //       break
            //     }
            //   }
            // }
          }
          
          else 
            return D.set_error('Invalid variable type')
          
          value = state[name]
          
          if(!D.is_nice(value))
            return false
          
          return D.deep_copy(value) // OPT: this is HUGELY wasteful in cpu and memory, and rarely needed...
          
          
          // var variables, output;
          // // if(this.vars.paths.indexOf(path) != -1) return false;
          // 
          // if(/^(@.+|[A-Z]+)$/.test(path.split('.', 1)[0])) {
          //   // variables = D.Vglobals; // @ and uppercase vars are global (UC vars are read-only)
          // } else {
          //   // if(scope) {
          //   //   variables = _.find(D.Vstack, function(context) {return context.key == scope}); // fixed scope
          //   // } else {
          //     variables = D.VARS; // regular vars
          //   // }
          // }
          // 
          // // this.vars.paths.push(path); // prevents 'poison pipe' infinite recursion, where the function representing {variable get path "__"} is set as the value of {__}. (it happens surprisingly often, indirectly.)
          // 
          // output = D.resolve_path(path, variables);
          // 
          // // this.vars.paths.pop();
          // 
          // return output;
        },

      },
      
      set: {
        desc: "Set a space variable's value",
        params: [
          {
            key: 'path',
            desc: 'A variable path, like :foo or :foo.baz',
            // desc: 'A variable path, like :foo or :foo.{:asdf}.baz',
            type: 'string',
            required: true,
            falsy: false,
          },
          {
            key: 'value',
            desc: 'A new value',
            type: 'anything'
          },
        ],
        fun: function(path, value, prior_starter, process) {
          if(!path)
            return D.set_error('Invalid path')
          
          if(!process)
            return D.set_error('Invalid process')
          
          if(!process.space)
            return D.set_error('Invalid process space')
          
          var state = process.space.state
            , words = path.split('.')
            , value_copy = D.deep_copy(value)
            
          if(words.length == 1) {
            state[path] = value_copy;
          } else {
            // see note at resolve_path re Daimio in paths
            D.recursive_insert(state, words, value_copy);
          }
          
          return value;
          
          
          // // THINK: we deep copy objects on the way in, so we don't A) tweak other variables by reference and B) leak out of Daimio into the base language by accident, but it's kind of slow.

          // TODO: make this WORMy for pipe vars and constants
          // both uppercase and only letters (no # or _ or $ or @)
          
          /*
            Thoughts on vars:
            - CAPS vars are write-once (immutable)
            - go back to block scope
            - use caution with @vars (top scope)
            - once declared, always scoped at that level (simpler, no hiding) [merge destruction?]
            - mirror objects magically bridge the daimio world and the mundane world [top level, global, Firstcap, flagged as magical, handled outside this system so as not to trigger bindings when set from inside]
          */
          
        },
      },
      
    }
  }
});