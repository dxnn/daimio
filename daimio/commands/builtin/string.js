// commands for strings

D.import_models({
  string: {
    desc: "Commands for string manipulation",
    methods: {
      
      // TODO: a method for string->data, like this: http://laktek.com/2012/10/04/extract-values-from-a-string/
      
      join: {
        desc: "Concatenate an array of strings",
        params: [
          {
            key: 'value',
            desc: "An array of values to be joined",
            type: 'array',
            required: true
          },
          {
            key: 'on',
            desc: "String inserted between values",
            type: 'string',
          },
        ],
        fun: function(value, on) {
          var good_string=''
          for(var i=0, l=value.length; i < l; i++) {
            good_string += D.stringify(value[i])
            if(on && i != l - 1) 
              good_string += on
              // good_string += D.stringify(D.defunctionize(on)) // NOTE: defunc runs the blocks before stringify toString()s them, so we need both (even though stringify also defuncs).
          }
          return good_string

          // var good_values = [], values, temp;
          // if(typeof value != 'object') return D.stringify(value);
          // values = D.to_array(value);

          // for(var i=0, l=values.length; i < l; i++) {
            // temp = D.stringify(values[i]);
            // if(temp) good_values.push(temp);
          // }
          // _.each(value, function(val, key) {
          //   if(typeof val == 'object' && !_.isNull(val)) val = JSON.stringify(val);
          //   if(['asdf','foo','string','number'].indexOf(typeof val) != -1) good_values.push(val);
          //   // TODO: the above line scans for nice types. replace asdf and foo with other nice types.
          // });
          // return good_values.join(on);
        },
      },
      
      grep: {
        desc: "Find a string in a haystack",
        params: [
          {
            key: 'value',
            desc: 'A string or array',
            required: true
          },
          {
            key: 'on',
            desc: 'The string or regex to search for',
            type: 'string'
          }
        ],
        fun: function(value, on) {
          var output = []
          
          on = D.string_to_regex(on)
          
          if(typeof value == 'string') value = value.split(/\n/)
          for(var key in value) {
            if(on.test(value[key])) output.push(value[key])
          }
          return output
        },
      },
      
      split: {
        desc: "Break up a string",
        params: [
          {
            key: 'value',
            desc: 'A string to split',
            type: 'string',
            required: true
          },
          {
            key: 'on',
            desc: 'The wedge',
            type: 'string'
          }
        ],
        fun: function(value, on) {
          // TODO: add regexability
          if(value.split) return value.split(on)
        },
      },
      
      quote: {
        desc: "Sometimes a string is just a string",
        params: [
          {
            key: 'value',
            desc: 'A string to escape',
            type: 'string',
            required: true
          }
        ],
        parse: function(value) {
          if(typeof value == 'string') return value
          return null // TODO: parse-time operations don't work, because the parser doesn't have access to models
        },
        fun: function(value) {
          return value // redundant on runtime strings, as they're escaped by default
        },
      },
      
      trim: {
        desc: "Whitespace begone",
        params: [
          {
            key: 'value',
            desc: 'A string to trim',
            type: 'string',
            required: true
          }
        ],
        fun: function(value) {
          return value.trim()
        },
      },
      
      uppercase: {
        desc: "MAKE IT LOUD",
        params: [
          {
            key: 'value',
            desc: 'SOME WORDS TO YELL',
            type: 'string',
            required: true
          }
        ],
        fun: function(value) {
          return value.toUpperCase()
        },
      },
      
      lowercase: {
        desc: "make it quiet",
        params: [
          {
            key: 'value',
            desc: 'some words to whisper',
            type: 'string',
            required: true
          }
        ],
        fun: function(value) {
          return value.toLowerCase()
        },
      },
      
      transform: {
        desc: "Convert a string to something new",
        params: [
          {
            key: 'value',
            desc: 'The base string',
            type: 'string',
            required: true
          },
          {
            key: 'from',
            desc: 'String or regex to match',
            type: 'string'
          },
          {
            key: 'to',
            desc: 'Replacement string or template',
            type: 'either:block,string'
          }
        ],
        fun: function(value, from, to, prior_starter) {
          from = D.string_to_regex(from, true)
          
          if(typeof to != 'function')
            return value.replace(from, to)
          
          var matches = value.match(from)
            // , unmatches = value.split(from)
            , match_starts = !value.search(from)
            , is_global = from.global // global regexes behave differently
          
          if(!matches)
            return value
          
          matches = matches.slice()
          
          if(!is_global)
            matches = [matches[0]]
          
          var processfun = function(item, prior_starter) {
            var scope = {}
            scope["__in"] = item
            return to(function(value) {prior_starter(value)}, scope)
          }
        
          var finalfun = function(processed_matches) {
            var result = ''
              // , string_count
              , index = 0
              , next_index = 0
            
            if(!match_starts) {
              index = value.indexOf(matches[0])
              result += value.slice(0,index)
            }
            
            // if(!match_starts) 
            //   result += unmatches.shift()
            // else if(unmatches[0] == '')
            //   unmatches.shift()
            
            // string_count = result.length
            
            for(var i=0, l=processed_matches.length; i < l; i++) {
              result += D.stringify(processed_matches[i])
              index += matches[i].length
              next_index = value.indexOf(matches[i+1], index)

              if(next_index !== -1)
                result += value.slice(index, next_index)
              else
                result += value.slice(index)

              index = next_index
              
              // result += unmatches[i]
              // string_count += matches[i].length + unmatches[i].length
              if(!is_global) break
            }
            
            // if we've only matched the first N of T possible matches, then glue the rest of the string back on (because matches.length == N but unmatches.length == T always)            
            // if(i < unmatches.length)
            //   result += value.slice(string_count)
            
            return result
          }
          
          return D.data_trampoline(matches, processfun, D.list_push, prior_starter, finalfun)
          
          
          
          // TODO: set the execution context (ie __) by first matching from
          
          // to(function(block_value) {
          //   callback(value.replace(from, block_value))
          // }, value.match(from))
          
          // return NaN
          // 
          // 
          // var to2 = to
          // from = D.string_to_regex(from, true)
          // if(D.is_block(to)) {
          //   to2 = function(string) {
          //     return D.run(to, string)
          //     // D.execute('variable', 'set', ['this', string]);
          //     // return to.toFun()();
          //   }
          // }
          // return value.replace(from, to2)
        },
      },
      
      slice: {
        desc: "Slice a string",
        params: [
          {
            key: 'value',
            desc: 'The base string',
            type: 'string',
            required: true
          },
          {
            key: 'start',
            desc: 'The new string beginning',
            type: 'integer',
            fallback: 0
          },
          {
            key: 'end',
            desc: 'The new string end',
            type: 'integer',
          }
        ],
        fun: function(value, start, end) {
          // THINK: can we use a single slice/concat/etc command for both strings and lists?
          if(!end) return value.slice(start) // THINK: does the end:=0 use case make sense?
          return value.slice(start, end)
        },
      },
      
      truncate: {
        desc: 'Like slice, but tries to snip at word boundaries',
        help: 'Use this to chop a string down to size without losing your mind. Currently only cuts at spaces.',
        params: [
          {
            key: 'value',
            desc: 'The base string',
            type: 'string',
            required: true
          },
          {
            key: 'to',
            desc: 'Maximum length of the new string',
            type: 'integer',
            required: true
          },
          {
            key: 'add',
            desc: 'Something to add if truncation occurs, like an ellipse',
            type: 'string',
          }
        ],
        fun: function(value, to, add) {
          var length = to
          if(value.length <= length) return value
          
          var lastSpace = value.lastIndexOf(' ', length)
          if(lastSpace == -1) lastSpace = length
          
          return value.slice(0, lastSpace) + (add || '')
        },
      },
      
      
    }
  }
})
