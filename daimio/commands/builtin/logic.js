// commands for logic

D.import_models({
  logic: {
    desc: "Commands for logical reasoning",
    methods: {
      
      'if': {
        desc: 'Return the "then" param if "value" is true, else "else"',
        params: [
          {
            key: 'value',
            desc: 'True if it has elements or characters (empty strings and empty arrays are false, as is the number zero (but not the string "0"!))',
            required: true
          },
          {
            key: 'then',
            desc: 'Returned if value is true',
          },
          {
            key: 'else',
            desc: 'Returned if value is false'
          },
        ],
        fun: function(value, then, _else, prior_starter, process) {
          return D.is_false(value) ? _else : then
          
          // THINK: consider an 'invert' param so you can alias something like 'unless'. [or stronger aliases?]
          
          // if(!value) return _else;
          // // if(!D.is_nice(value)) return _else;
          // // if(value === 0 || value === '') return _else;
          // if(typeof value == 'object' && _.isEmpty(value)) return _else;
          // 
          // return then;
        },
      },
      
      'is': {
        desc: 'If value is in in or like like, return true',
        params: [
          {
            key: 'value',
            desc: 'Value to compare',
            required: true
          },
          {
            key: 'in',
            desc: 'Array of potential matches',
            type: 'list'
          },
          {
            key: 'like',
            desc: 'A string for exact matches -- wrap with / / for regular expression matching',
            type: 'anything',
            undefined: true
          },
        ],
        fun: function(value, _in, like) {
          if(!D.is_nice(like)) {
            // TODO: indexOf doesn't coerce strings and numbers so {"2" | is in (2)} fails.
            if(D.is_nice(_in)) return _in.indexOf(value) !== -1
            
            if(!Array.isArray(value)) return D.on_error("Requires 'in', 'like', or a value list")
            
            var base = value[0] // test each item
            for(var i=1, l=value.length; i < l; i++) {
              if(!this.methods.is.fun(base, null, value[i])) return false;
            }
            return true;
          }
          
          // THINK: {5 | is a :number}
          
          // TODO: make a new 'logic equal' command, that takes a list or two args. then make 'is like' only for regex?
          
          var is_obj = (typeof value == 'object') + (typeof like == 'object') // XOR
          
          if(is_obj == 1)
            return false 
            
          if(is_obj == 2)
            return JSON.stringify(value) == JSON.stringify(like)
          
          if(!D.is_regex(like))
            return value == like // exact match, ish.
          
          like = D.string_to_regex(like)
          return like.test(value)
        },
      },
      

      'cond': {
        desc: 'Takes a list with odd elements providing conditions and even elements providing actions. Finds the first true test and returns its action',
        params: [
          {
            key: 'value',
            desc: 'A list with alternating tests and expressions',
            type: 'list',
            required: true
          },
        ],
        fun: function(value, prior_starter) {
          for(var i=0, l=value.length; i < l; i = i + 2)
            if(!D.is_false(value[i]))
              return value[i+1]
          
          return false
        },
      },
      
      'switch': {
        desc: 'Given a value, find a matching expression',
        params: [
          {
            key: 'on',
            desc: 'The value to switch on',
            type: 'anything',
            required: true
          },
          {
            key: 'value',
            desc: 'A list of value then expression then value then expression and so on and so forth and etcetera and yada yada',
            type: 'list',
            required: true
          },
        ],
        fun: function(on, value, prior_starter, process) {
          for(var i=0, l=value.length; i < l; i = i + 2) {
            var test = value[i]

            if(test == on) {
              var result = value[i+1]
              return result
            }
          }
          
          // TODO: add 'otherwise' or equivalent 
          return false
        },
      },
      
      and: {
        desc: "If all values are true, return true",
        params: [
          {
            key: 'value',
            desc: 'A set of values to check for falsiness (runs all incoming templates, no short-circuiting)',
            type: 'anything',
            required: true,
          },
          {
            key: 'also',
            desc: 'Some other values (checked first)',
            type: 'anything',
            'undefined': true
          },
        ],
        fun: function(value, also) {
          if(typeof also != 'undefined')
            return !(D.is_false(value) || D.is_false(also))
          
          // value = D.to_array(value)
          
          for(var key in value)
            if(D.is_false(value[key])) return false
          
          // THINK: why not return the last value in the list if everything is truthy?
          return true //value[key]
        },
      },
      
      or: {
        desc: "Accepts a list of values or two separate values; runs all incoming templates, no short-circuiting",
        help: "Note that the 'first' param is considered before the 'value' param, if it is included. This makes the examples easier to read.",
        examples: [
          '{5 | or 10}',
          '{false | or :true}',
          '{(false 1 2 3) | or}',
          '{or (false 1 2 3)}',
          '{(false 0 "") | or :true}',
        ],
        params: [
          {
            key: 'value',
            desc: 'Some values to check for truthiness',
            type: 'anything',
            required: true,
          },
          {
            key: 'also',
            desc: 'Some other values (checked first)',
            type: 'anything',
            'undefined': true,
          },
        ],
        fun: function(value, also) {
          if(also) return also
          
          if(typeof also != 'undefined') return value

          for(var key in value)
            if(!D.is_false(value[key])) return value[key]
          
          return false
        },
      },
      
      not: {
        desc: "Returns the opposite of value",
        params: [
          {
            key: 'value',
            desc: 'A value whose value to reverse value',
            required: true,
          },
        ],
        fun: function(value) {
          return D.is_false(value) ? true : false
          
          // TODO: make this a core Daimio method!
          // if(!value) return true;
          // if(typeof value == 'object' && _.isEmpty(value)) return true;
          // 
          // return false;
        },
      },
      
    }
  }
})