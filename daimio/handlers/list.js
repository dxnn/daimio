// A list in Daimio is an ordered sequence of items that are optionally keyed.

// concat, each, every, filter, forEach, indexOf,
// insert, join, map, lastIndexOf, order, pop, push,
// reduce, reduceRight, remove, reverse, shift,
// slice, some, sort, splice



// maybe a way to write a sort of "condensed js notation" for when that's compacter 
// ~{_id {$in [122, 123]}}~ 
// {* (:_id {* ("$in" (122 123) )} )}
// but it would only work for constants, not for anything with code


D.import_models({
  list: {
    desc: 'Commands for list manipulation',
    help: 'A list in Daimio is an ordered sequence of items that are optionally keyed. Anything you can do with a classic list or hash you can do with a Daimio list. It is the fundamental data structure in Daimio.',
    methods: {
      
      map: {
        desc: 'Run Daimio for each item, returning a list',
        injects: ['value', 'key'],
        params: [
          {
            key: 'data',
            desc: 'An array of data',
            type: 'list',
            required: true
          },
          {
            key: 'block',
            desc: 'The daimio to run',
            type: 'block',
            required: true
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, block, _with, prior_starter, process) {
          
          // (because you can't write to it, and these *should* be immutable -- plus then they're cheaper!)
          
          
          // THINK: can we do something like {user find | __.username | map :trim}
          // or even {user find | __.username | map "trim | reverse | __.#2 | uppercase"}
          // like, pass the value in as __ and append that to the first pipe chunk?
          // but not {user find | __.username | map "{_this | trim | reverse | __.#2 | uppercase}"} ?
          // because that looks ok to me. we don't want implicit __ on entry: it mucks up params.
          
          // what about 'extract' where you need 'this' and 'parent'? 
          // or here where 'key' would be nice?
          
          // TODO: add path param! easy changes to nested values!
          // TODO: add 'this' param (and 'key'?) to each of these.
          
          /* THINK: an 'into' param, for making a new list with the same top-level keys. [nope]
             note: ruby calls this 'collect'... but in daimio it doesnt matter. it's not needed. duh!
          
          __.^.* takes incoming, goes up the tree, then takes all the children -- ie collects all siblings. need real commands -- this is good sugar, but what if you only want some sibs? like sibs that aren't you?

          THINK: that above bit doesn't allow us to pop shortcuts for greater clarity. move most of the __... style filtering to commands and aliases. also, disable implicit piping to first param when __ is used explicitly, so you can use it e.g. in fancy find commands with five by_* params. no, no, disable it after ||, but let __ through.
          

          
          map examples: 
            {((1 2 3) (4 5 6)) | map "{add}"}
            {profile find | map "{keep (:name :address :phone)}"}
            {profile find ^ keep (:name :address :phone) ^_^ map ^0}

            filtering on keys (show both remove and keep):
            scala: map filterKeys (Set("1", "2") and Set("2", "3"))
            scala: map filterKeys !Set("2", "3")
            clojure: (select-keys m [:a :b])
            clojure: (filter (fn [x] (some #{(key x)} [:a :b])) m)
            python: x = { your_key: old_dict[your_key] for your_key in your_keys }
            ruby: x.slice("one", "two")
            ruby: x.except("three")
            ruby: x.reject {|k,v| k == "three"}
            ruby: x.select { |key,_| wanted_keys.include? key }
            daimio: ???
            
            
            scala: 
              val mustReport = trades filter (uncoveredShort ∨ exceedsDollarMax)
              val european = { 
                val Europe = (_ : Market).exchange.country.region == Region.EU
                trades filter (_.market ∈: Europe)
              }
          */
          
          // for asyncable loops you have to plug this in to the bottom of the newly created stack formed by the template param. otherwise you'll bomb your serial asyncing. could do it only if the template is flagged 'async', but for now just have a single loop structure that takes a template, a dataset and a closure, sticks it into a block and runs it. 
          // also, this is pretty cool that you can do that.
          // also, unify the convention for dislodging async calls (into another timeline)
          // also: merge (and map/each to a lesser extent) creates a variable shadowing issue. so you can definitely shoot yourself in the foot with that. but it also provides an encapsulation var path, so you can avoid it. but it requires some thinking. i suspect this will trip a lot of people up. is there a better way that still allows the pretty syntax? maybe we can at least throw a warning so you can see where it's happening in the graph...
          
          
          // TODO: 'walk' command: pattern:bfs/dfs, apply:downward/upward, template, value ... or just add this to map? its a map walk. map walking. hmmm. someone has probably thought of this before...
          
          // TODO: 'zip' command: takes N arrays of M elements and makes a single array with M elements where the Kth item is an array of the Kth items from all of the initial arrays. e.g. ((1 2 3) (4 5 6)) -> ((1 4) (2 5) (3 6))
          
          var scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}
          
          var processfun = function(item, prior_starter, key) {
            scope["__in"] = item
            scope["value"] = item
            scope["key"] = key
            return block(
                     function(value) {prior_starter(value)}
                   , scope, process)
          }
          
          return D.data_trampoline(data, processfun, D.list_set, prior_starter, D.scrub_list)
        },
      },
      
      reduce: {
        desc: 'Each pair of items is fed into the block',
        injects: ['value', 'total'],
        params: [
          {
            key: 'data',
            desc: 'Some data',
            type: 'list',
            required: true
          },
          {
            key: 'block',
            desc: 'Given _total and _value / __',
            type: 'block',
            required: true
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, block, _with, prior_starter, process) {
          var scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}
                    
          // THINK: this manual fiddling is weird. should we just accept a starting element to get it over with?
          if(!data.length)
            return []
          
          var total = data.shift()
          
          // THINK: I really have no idea what we should do here...
          // if(!data.length)
          //   return block(function(value), prior_starter(value), {'_value': total})
          
          var processfun = function(item, prior_starter) {
            scope["__in"] = item
            scope["value"] = item
            scope["total"] = total
            return block(function(value) {prior_starter(value)}, scope, process)
          }
          
          var joinerfun = function(sometotal, value) {
            if(value === undefined) return total
            
            total = value
            return value // the value becomes the new total
          }
          
          return D.data_trampoline(data, processfun, joinerfun, prior_starter)
        },
      },
      
      each: {
        desc: 'Run Daimio for each item, returning a string',
        params: [
          {
            key: 'data',
            desc: 'An array of data',
            type: 'list',
            required: true
          },
          {
            key: 'block',
            desc: 'The daimio to run',
            type: 'block',
            required: true
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, block, _with, prior_starter, process) {
          var scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}

          var processfun = function(item, prior_starter, key) {
            scope["__in"] = item
            scope["value"] = item
            scope["key"] = key
            return block(
                     function(value) {prior_starter(value)}
                   , scope, process)
          }
          
          return D.data_trampoline(data, processfun, D.string_concat, prior_starter)
          
          // TODO: also push the "row count" into the local context
          // THINK: (but how do we say "give me number 5 from data" when 5 is a var?) -- oh right foo.{"#{rows | mod {foo | count}}"} --- maybe we can make that easier?
          // TODO: allow key, value and count alias names to be overridden
          // TODO: only push these vars into the local context, not vars created in the daimio
          // TODO: merge is just an each couple with a 'with' type statement... and map is similar too. can we use that?
          // TODO: merge should take a 'rowname' param that allows you to access the row's keys via an alias instead of pushing them into the var env.
          

          // okay, but if we're doing {@qids | each daimio "{answer add id value answer @answers.{key}}"}
          // what is the key if qids is an unkeyed list? default to integers? then you *can* access by int, not just position. oy.
          
        },
      },
      
      merge: {
        desc: "Merge data with a template, returning a string",
        params: [
          {
            key: 'data',
            desc: 'An array of data',
            type: 'list',
            required: true
          },
          {
            key: 'block',
            desc: 'The daimio to run',
            type: 'block',
            required: true
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, block, _with, prior_starter, process) {
          var scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}

          var processfun = function(item, prior_starter) {
            for(var key in item)
              scope[key] = item[key]
              // scope['_' + key] = item[key]
            scope["__in"] = item
            return block(
                     function(value) {prior_starter(value)}
                   , scope, process)
          }
          
          return D.data_trampoline(data, processfun, D.string_concat, prior_starter)
        },
      },
      
      from_json: {
        desc: "Convert from a JSON string to a list",
        params: [
          {
            key: 'data',
            desc: 'The string to convert',
            type: 'string'
          }
        ],
        fun: function(data) {
          if(!data) return []
          // THINK: use D.json_parse instead or something?
          // THINK: if JSON doesn't parse it, maybe try something else?
          try {
            return JSON.parse(data)
          } catch(e) {
            return []
          }
        },
      },
      
      to_json: {
        desc: "Convert a list to a JSON string",
        params: [
          {
            key: 'data',
            desc: 'The list to convert',
            type: 'list'
          }
        ],
        fun: function(data) {
          return JSON.stringify(data)
        },
      },
      
      count: {
        desc: "Count the items in a list",
        params: [
          {
            key: 'data',
            desc: 'The list to count',
            type: 'array' // ListOrEmptyList // TODO: ugh derp
          }
        ],
        fun: function(data) {
          return data.length
        },
      },
      
      zip: {
        desc: "Zip a list of lists into tuples of elements of lists of lists",
        params: [
          {
            key: 'data',
            desc: 'The list of lists to zip',
            type: 'array'
          },
          {
            key: 'also',
            desc: 'If present zipped with data list',
            type: 'maybe-list'
          }
        ],
        fun: function(data, also) {
          var values = []
          
          if(!data && !also) return []
          else if(!data) values = also
          else if(also) values = [also, data]
          else values = D.to_array(data)
          
          return values[0].map(function(item, key) {
            return values.map(function(list) {
              return list[key]
            })
          })
        },
      },
      
      keys: {
        desc: 'Returns the keys from a list, or the integer indices if unkeyed',
        params: [
          {
            key: 'data',
            desc: 'A list, probably keyed',
            type: 'list',
            required: true,
          },
        ],
        fun: function(data) {
          return Object.keys(data)
        },
      },
      
      pair: {
        desc: "Create a new list, using the first item as its first key, the second item as that value, and so on.",
        params: [
          {
            key: 'data',
            desc: 'The list to convert',
            type: 'list'
          }
        ],
        fun: function(data) {
          var k, v, hash = {}
          
          if(data.length < 2) {            
            return D.set_error('The data parameter must contain at least two elements') || {}
          }

          while(data.length > 1) 
          {
            k = String(data.shift())
            v = data.shift()
            hash[k] = v
          }

          return hash
        },
      },

      intersect: {
        desc: "Return a list of all items matching the path items",
        help: "Note that this removes any associated keys",
        params: [
          {
            key: 'data',
            desc: 'A list of lists to intersect',
            type: 'list' // should be LoL
          },
          {
            key: 'also',
            desc: 'A single list',
            type: 'maybe-list',
          },
        ],
        fun: function(data, also) {
          var hash = {}
            , result = []
            , values
          
          if(!data && !also) return []
          else if(!data) values = also
          else if(also) values = [also, data]
          else values = D.to_array(data)
          
          var number_of_arrays = values.length
          
          values.forEach(function(list, index) {
            list = D.to_array(list)
            list.forEach(function(value) {
              var key = typeof value == 'object' ? D.stringify(value) : value
              
              // partially from https://gist.github.com/lovasoa/3361645
              if(hash[key] === index - 1) {
                if(index == number_of_arrays - 1) {
                  result.push(value)
                  hash[key] = 0
                } else {
                  hash[key] = index
                }
              } 
              else if(!index) {
                hash[key] = 0
              }
              
            })
          })
          
          return result
        },
      },
      
      peek: {
        desc: "Return a list of all items matching the path items",
        params: [
          {
            key: 'data',
            desc: 'The list to search',
            type: 'list'
          },
          {
            key: 'path',
            desc: 'A list of branch names',
            type: 'list' // Either:List,String
          }
        ],
        fun: function(data, path) {
          
          // THINK: maybe make this 'walk' instead, which with no 'filter' param would just return a list of everything it finds...
          // need to be able to extract arbitrary items, but also prune out unwanted ones... can walk do both?
          
          if(!path.length) 
            return data
          
          return D.peek(data, path)
        },
      },
      
      poke: {
        desc: "Set a subitem",
        params: [
          {
            key: 'data',
            desc: 'The list to search',
            type: 'list'
          },
          {
            key: 'value',
            desc: 'The new value',
            type: 'anything'
          },
          {
            key: 'path',
            desc: 'A list of branch names',
            type: 'list' // list|explode-on-dot
          },
        ],
        fun: function(data, value, path) {
          
          // THINK: maybe make this 'walk' instead, which with no 'filter' param would just return a list of everything it finds...
          D.poke(data, path, value) // mutates in place and returns the mutated portions, not data itself
          return data
         
          // return D.poke(path, data, function(x) {return value})
        },
      },
      
      remove: {
        desc: "Remove elements from an array",
        params: [
          {
            key: 'data',
            desc: 'The list to edit',
            type: 'list',
            required: true
          },
          {
            key: 'by_key',
            desc: 'A key or list of keys',
            type: 'array' // [string]
          },
          {
            key: 'by_value',
            desc: 'A value or list of values',
            type: 'array' // [anything]
          }
        ],
        fun: function(data, by_key, by_value) {
          // THINK: maybe we should allow arbitrary key paths?
          // NOTE: for deeply nested lists in arbitrary order neither this nor filter is nice. If you have to solve that case maybe use JSON.stringify with a custom sorting replace function.
          
          by_value = by_value.map(JSON.stringify) // for matching nested structures
          
          if(by_value.length)
            for(var key in data) 
              if(data.hasOwnProperty(key) && by_value.indexOf(JSON.stringify(data[key])) != -1) 
                by_key.push(key)
          
          if(by_key.length) {
            by_key.sort().reverse()
            for(var i=0, l=by_key.length; i < l; i++) {
              if(Array.isArray(data)) {
                data.splice(by_key[i], 1)
              } else {
                delete data[by_key[i]]
              }
            }
          }
          
          return data
        }
      },
      
      union: {
        desc: 'Union the lists in a list',
        help: 'Given a single param it unions all the lists in the list. Given two params it considers each a single list and unions the two together. So you can use it through pipes but also directly, which is nice. Respects keys if the first list has them, otherwise eats all keys.',
        params: [
          {
            key: 'data',
            desc: 'A list of lists to union',
            type: 'maybe-list'
          },
          {
            key: 'also',
            desc: 'A single list',
            type: 'maybe-list',
          },
        ],
        fun: function(data, also) {
          var hash = {}, used = {}
            , all_arrays = true
            , stack, values
                    
          // TODO: remove this! hack!
          // if(value.length == 1 && value[0] == '') value = false
          
          if(!data && !also) return []
          else if(!data) values = also
          else if(also) values = [also, data]
          else values = D.to_array(data)
          
          // quick check for all arrays
          for(var key in values) {
            if(typeof values[key]!= 'object')
              values[key] = [values[key]]
            if(!Array.isArray(values[key]))
              all_arrays = false
          }
              
          if(all_arrays) return Array.prototype.concat.apply(Array.prototype, (this, values))
          
          // we have to do a fancy union that keeps nested keys intact...
          for(var i=0, l=values.length; i < l; i++) {
            var value = values[i]
            
            // if(typeof value != 'object')
            //   value = [value]
              
            for(var key in value) {
              if(used[key]) continue
              used[key] = 1

              stack = []
              for(var j=0, k=values.length; j < k; j++) { // look through each key's value
                if(typeof values[j][key] != 'undefined') stack.push(values[j][key])
              }

              var temp = stack[stack.length - 1]
              if(typeof temp == 'number' || typeof temp == 'string') { // scalar
                hash[key] = temp
              } else if(D.is_block(temp)) { // block
                hash[key] = temp
              } else { // list
                hash[key] = D.Commands.list.methods.union.fun(stack)
              }
            }
          }

          return hash
        },
      },
      
      rekey: {
        desc: 'Key the data by a different property',
        help: 'Note that like all list commands this returns the modified value, but does not change the input data.',
        params: [
          {
            key: 'data',
            desc: 'A list to rekey',
            type: 'list',
            required: true,
          },
          {
            key: 'by',
            desc: 'A data path, like _id or my.user.group, or a block like "{__.foo | times 2}"',
            type: 'either:block,string',
            fallback: false,
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, by, _with, prior_starter, process) {
          var processfun, finalfun
            , scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}
          
          if(typeof by == 'function') {
            processfun = function(item, prior_starter) {
              scope["__in"] = item
              return by(function(value) {prior_starter(value)}, scope, process)
            }
          }
          else if(by) {
            processfun = function(item, prior_starter) {
              return D.peek(item, by.split('.'))
            }
          } 
          else {
            processfun = function(item, prior_starter) {return 0}
          }
                    
          finalfun = function(keylist) {
            var result = {}
              , datakeys = Object.keys(data)
            
            for(var i=0, length = keylist.length; i < length; i++)
              result[keylist[i] || i] = data[datakeys[i]]

            return result
          }
          
          return D.data_trampoline(data, processfun, D.list_push, prior_starter, finalfun)
        },
      },
      
      group: {
        desc: 'group a list by something',
        params: [
          {
            key: 'data',
            desc: 'The list to reverse',
            type: 'list',
            required: true,
          },
          {
            key: 'by',
            desc: 'A data path, like _id or my.user.group, or a block like "{__.foo | times 2}"',
            type: 'either:block,string',
            required: true,
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, by, _with, prior_starter, process) { 
          var keys = Object.keys(data) 
            , scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}
                  
          // key cases: a simple array, named by 'by', or... nope, that's it.
          
          // THINK: allow the keys to be renamed, or to return an array of arrays instead of a hash of arrays
          // e.g.: key :name would cause all keys to be the name field, a block would be variable... or maybe key is only a block or a falsy value to imply just an array. so maybe-block?
          
          // THINK: this and {list rekey} are an awful lot alike...
          
          if(typeof by == 'function') {
            processfun = function(item, prior_starter) {
              scope["__in"] = item
              return by(function(value) {prior_starter(value)}, scope, process)
            }
          }
          else if(by) {
            processfun = function(item, prior_starter) {
              return D.peek(item, by.split('.'))
            }
          } 
          else {
            processfun = function(item, prior_starter) {return item}
          }
          
          finalfun = function(keylist) {
            var result = {}
              , datakeys = Object.keys(data)
            
            for(var i=0, length = keylist.length; i < length; i++)
              result[keylist[i]] ? result[keylist[i]].push(data[datakeys[i]]) : result[keylist[i]] = [data[datakeys[i]]]

            return result
          }
          
          return D.data_trampoline(data, processfun, D.list_push, prior_starter, finalfun)
        },
      },
      
      
      sort: {
        desc: 'Sort a list by something',
        help: 'Careful using this on keyed lists, as it currently eats keys.',
        params: [
          {
            key: 'data',
            desc: 'The list to sort',
            type: 'list',
            required: true,
          },
          {
            key: 'by',
            desc: 'A data path, like _id or my.user.group, or a block like "{__.foo | times 2}"',
            type: 'either:block,string',
          },
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, by, _with, prior_starter, process) { 
          var keys = Object.keys(data)    
            , processfun, finalfun
            , scope = _with || {}

          if(Array.isArray(_with))
            scope = {'__in': _with[0]}
            
          // TODO: # vs A-Z
          
          if(typeof by == 'function') {
            processfun = function(item, prior_starter) {
              scope["__in"] = item
              return by(function(value) {prior_starter(value)}, scope, process)
            }
          }
          else if(by) {
            processfun = function(item, prior_starter) {
              return D.peek(item, by.split('.'))
            }
          } 
          else {
            processfun = function(item, prior_starter) {return item}
          }
          
          // NOTE: we're creating an temp array of sortable values, sorting that array, then building a new array of the old values in the right order. mostly from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
          
          finalfun = function(valuelist) {
            var tempmap = []
              , result = []
            
            for(var i=0, l=keys.length; i < l; i++) {
              tempmap.push({ index: keys[i] // remember the index within the original array
                           , value: valuelist[i] }) // evaluate the value to sort
            }
            
            // sorting the map containing the reduced values
            tempmap.sort(function(a, b) {
              return a.value > b.value ? 1 : -1
            })

            for(var i=0, length = tempmap.length; i < length; i++) {
              result.push(data[tempmap[i].index])
              // THINK: could this eat supplied variables? maybe deep clone here...
            }

            return result
          }
          
          return D.data_trampoline(data, processfun, D.list_push, prior_starter, finalfun)
          
          // make a new map using our dataTrampoline
          // sort that
          // sort the real thing
          
          // Q: how do we map using dataTrampoline, then do things after??
          
        },
      },
      
      range: {
        desc: 'Returns a range of numbers',
        params: [
          {
            key: 'length',
            desc: 'How many items to return',
            type: 'number',
            required: true,
          },
          {
            key: 'start',
            desc: 'Item to start with, inclusive',
            type: 'number',
            fallback: 1,
          },
          {
            key: 'step',
            desc: 'How many items to skip',
            type: 'number',
            fallback: 1,
          },
        ],
        fun: function(length, start, step) {
          var newlist = []
            , value = (start - step)
          
          if(length < 1) 
            return []
          
          for(var i = 1; i <= length; i++) {
            value += step
            newlist.push(value)
          }
          
          return newlist
        },
      },
      
      reverse: {
        desc: 'Reverse a list',
        help: 'Careful using this on keyed lists, as it currently eats keys.',
        params: [
          {
            key: 'data',
            desc: 'The list to reverse',
            type: 'list',
            required: true,
          },
        ],
        fun: function(data) {
          var newlist = []
            , keys = Object.keys(data)
            
          for(var i = keys.length - 1; i >= 0; i--) {
            newlist.push(data[keys[i]])
          }
          return newlist
        },
      },
      
      
      extend: {
        desc: "Add values to a list",
        help: "To add a single element to a list that is itself a list, wrap it in another list: {list extend data ((1 2)) with ((3 4))} --> ((1 2) (3 4))",
        params: [
          {
            key: 'data',
            desc: 'A list',
            type: 'list'
          },
          {
            key: 'with',
            desc: 'An item or list of items',
            type: 'anything'
          },
        ],
        fun: function(data, _with) {
          // THINK: this is only different from union because... it does a recursive merge over like-keyed values for keyed lists but not for unkeyed lists that is pretty weird so maybe we don't need it?
          
          
          // TODO: make this not change in-place -- all commands should change a copy
          // TODO: use 'data' as the primary parameter for operational data
          /*
            THINK: come up with language that distinguishes between lists, hashes, and *either* --> in Daimio, a list and a hash are the *same* data object, which is just a mutable hash keyed by strings or consecutive integers or non-consecutive integers: we don't really care.
            In JS, the two fundamental data structures (lists and hashes) are optimized differently under the hood. We want to take advantage of that within the Daimio core and handlers, while still respecting the fact that they're the same data structure in Daimio. So every operation that takes a listhash has to handle it as either a list or a hash, whichever it maps to in JS. 
            It's really just a matter of a slight type mismatch between JS and Daimio -- we just need good language to disambiguate. 'list' is nice, because it isn't used in JS proper, but it *really* implies an array and not a hash. 'hash' has the opposite problem.
            The Daimio data structure is also *always* ordered, independent of keys, which is another difference.
            We could call it an 'association list', but: no good abbr., it's a concrete data structure (which we wouldn't use), it's not concise.
            'data'? container. 'stash? (for list-hash). stash is nice. it's a portmanteau. it means 'place to stick things'. it slightly implies array-like behavior, but that's compensated for by also being short for mustache. 
            
            WE'RE GOING TO STICK WITH 'LIST'. An indexed or keyed list is very similar to this data structure. 
            
          */
          
          // THINK: remap shortcuts for server vs client, e.g. 'log' could mean different things different places. This way you can still directly invoke the underlying command if you want that behavior, or use the shortcut for maximum flexibility. 
          
        },
      },
      
      filter: {
        desc: "Select matching items from a list",
        params: [
          {
            key: 'data',
            desc: 'List to extract from',
            type: 'list',
            required: true,
          },
          {
            key: 'block',
            desc: "Sets '__'. Return true to nab it, false to leave it.",
            type: 'block',
            required: true,
          },
        ],
        fun: function(data, block, prior_starter, process) {
          var scope = {}
          
          // THINK: this should probably use 'by' instead of 'block', and filter on truthiness of a path
          
          /* 
            TODO:
            we should add a 'context' param to anything that takes a block, and you can pass in keys and values
            then pipeline vars can be passed down by value without complicated scoping rules, var shadowing,
            cumbersome wiring hacks etc.
            
            also, ensure that space vars can only be created by fixed strings (not at runtime) so we can 
            coordinate concurrency between stations  
            
          */
          
          var processfun = function(item, tramp_prior_starter) {
            var my_tramp_prior_starter = function(bool) {
              tramp_prior_starter(bool ? item : null)
            } 
            
            scope["__in"] = item
            var bool = block(function(value) {my_tramp_prior_starter(value)}, scope, process) 

            if(bool !== bool) 
              return NaN
            
            return bool ? item : null
          }
          
          // removes unNice values from the total
          var joinerfun = function(total, value) {
            total = Array.isArray(total) ? total : []
            if(!D.is_nice(value)) return total
            total.push(value)
            return total
          }
          
          return D.data_trampoline(data, processfun, joinerfun, prior_starter)
        },
      },
      
      first: {
        desc: "Select the first matching item from a list",
        params: [
          {
            key: 'data',
            desc: 'List to extract from',
            type: 'list',
            required: true,
          },
          {
            key: 'block',
            desc: "Sets '__'. Return true to nab it, false to leave it.",
            type: 'block',
            required: true,
          },
        ],
        fun: function(data, block, prior_starter, process) {
          var scope = {}
            , found = false
            , the_item = false
          
          var processfun = function(item, tramp_prior_starter) {
            if(found)
              return null
              
            var my_tramp_prior_starter = function(bool) {
              if(bool) {
                found = true
                the_item = item
              }
              tramp_prior_starter(null)
            } 
            
            scope["__in"] = item
            var bool = block(function(value) {my_tramp_prior_starter(value)}, scope, process) 

            if(bool !== bool) 
              return NaN
            
            if(bool) {
              found = true
              the_item = item
            }
            
            return null
          }
          
          var finalfun = function() {
            return the_item
          }
          
          return D.data_trampoline(data, processfun, D.noop, prior_starter, finalfun)
        },
      },
      
      unique: {
        desc: 'Removes duplicate items',
        params: [
          {
            key: 'data',
            desc: 'A list which will soon be more like a set',
            type: 'list',
            required: true,
          },
        ],
        fun: function(data) {
          var obj = {}
            , isArray = Array.isArray(data)
            , newlist = isArray ? [] : {}
            , keys = Object.keys(data)
            
          for(var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i]
              , value = data[key]
              , valuekey = typeof value == 'object' ? D.stringify(value) : value
            
            if(obj[valuekey])
              continue
            
            if(isArray)
              newlist.push(data[key])
            else
              newlist[key] = data[key]
            
            obj[valuekey] = 1
          }
          
          return newlist
        },
      },
      
      index: {
        desc: 'Given an item value, return its key',
        params: [
          {
            key: 'data',
            desc: 'A list of values',
            type: 'list',
            required: true,
          },
          {
            key: 'value',
            desc: 'A value to find',
            type: 'anything',
            required: true,
          },
        ],
        fun: function(data, value) {
          // TODO: add a 'return' param, so you can ask for "the set of matching keys" or "last key" or etc
          
          value = D.to_array(value).map(JSON.stringify) // for matching nested structures
          
          for(var key in data) 
            if(data.hasOwnProperty(key) && value == JSON.stringify(data[key])) 
              return key
          
          return ""
        },
      },
      
      
      // extract: {
      //   desc: "Select some values from a list. Can reach inside sublists and pull pieces out.",
      //   help: "Without path it runs over the top level. Without daimio it returns items from the path level. Without either it returns the input list.",
      //   params: [
      //     {
      //       key: 'value',
      //       desc: 'List to extract from',
      //       type: 'list',
      //       required: true,
      //     },
      //     {
      //       key: 'block',
      //       desc: "Sets '_this' and '_parent' (and '_parent.parent', and so on). Return true to nab it, false to leave it.",
      //       type: 'block',
      //     },
      //     {
      //       key: 'path',
      //       desc: 'A path for selecting sublists, like employees.office',
      //       type: 'string',
      //       fallback: '',
      //     },
      //   ],
      //   fun: function(value, block, path) {
      //     var result = []
      //     
      //     D.recursive_path_walk(value, path, function(list, parent) {
      //       D.execute('variable', 'set', ['this', list])
      //       D.execute('variable', 'set', ['parent', parent])
      //       if(D.run(block)) result.push(list)
      //     })
      //     
      //     return result
      //   },
      // },
      // 
      // TODO: group, prune
      
    }
  }
})