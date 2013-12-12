/*

            _            _                    _         _   _          _          _
          /\ \         / /\                 /\ \      /\_\/\_\ _     /\ \       /\ \
         /  \ \____   / /  \                \ \ \    / / / / //\_\   \ \ \     /  \ \
        / /\ \_____\ / / /\ \               /\ \_\  /\ \/ \ \/ / /   /\ \_\   / /\ \ \
       / / /\/___  // / /\ \ \             / /\/_/ /  \____\__/ /   / /\/_/  / / /\ \ \
      / / /   / / // / /  \ \ \           / / /   / /\/________/   / / /    / / /  \ \_\
     / / /   / / // / /___/ /\ \         / / /   / / /\/_// / /   / / /    / / /   / / /
    / / /   / / // / /_____/ /\ \       / / /   / / /    / / /   / / /    / / /   / / /
    \ \ \__/ / // /_________/\ \ \  ___/ / /__ / / /    / / /___/ / /__  / / /___/ / /
     \ \___\/ // / /_       __\ \_\/\__\/_/___\\/_/    / / //\__\/_/___\/ / /____\/ /
      \/_____/ \_\___\     /____/_/\/_________/        \/_/ \/_________/\/_________/



    Hi, welcome to Daimio!

    As you make your way through the code you'll often
    see comments like this one. You should read them,
    because they're helpful and occasionally funny!


    Naming conventions:
    D.import_commands   <--- snake_case for functions and constants
    D.SegmentTypes      <--- CamelCase for built-in objects
    D.SPACESEEDS        <--- ALLCAPS for runtime containers

*/


D = {}                                // this is where the magic happens

D.BLOCKS = {}
D.DIALECTS = {}
D.SPACESEEDS = {}
D.DECORATORS = []

D.DecoratorIndices = {}               // technically these should be all caps,
D.DecoratorIndices.ByType = {}        // but it's just too much yelling really
D.DecoratorIndices.ByBlock = {}
D.DecoratorIndices.ByTypeBlock = {}

D.Aliases = {}                        // aliases are a grey area:
D.AliasMap = {}                       // one day they may be able to grow at runtime

D.Etc = {}
D.Types = {}
D.Parser = {}
D.Fancies = {}
D.Commands = {}
D.Terminators = {}
D.Pathfinders = []                    // one of these things is not like the others
D.SegmentTypes = {}
D.PortFlavours = {}

D.Constants = {}                      // constants fry, constants fry, any time at all
D.Constants.command_open = '{'
D.Constants.command_closed = '}'
D.Constants.list_open = '('           // currently unused
D.Constants.list_closed = ')'         // currently unused
D.Constants.quote = '"'               // currently unused

D.Etc.process_counter = 1             // this is a bit silly
D.Etc.token_counter = 100000          // FIXME: make Rekey work even with overlapping keys

D.Etc.FancyRegex = ""                 // this is also pretty silly
D.Etc.Tglyphs = ""                    // and this one too

D.Etc.OptimizationMap = {}            // technically allcaps here too
D.Etc.use_optimizations = 1           // you can change this in your app


  /*ooo   ooooo oooooooooooo ooooo        ooooooooo.   oooooooooooo ooooooooo.    .oooooo..o
  `888'   `888' `888'     `8 `888'        `888   `Y88. `888'     `8 `888   `Y88. d8P'    `Y8
   888     888   888          888          888   .d88'  888          888   .d88' Y88bo.
   888ooooo888   888oooo8     888          888ooo88P'   888oooo8     888ooo88P'   `"Y8888o.
   888     888   888    "     888          888          888    "     888`88b.         `"Y88b
   888     888   888       o  888       o  888          888       o  888  `88b.  oo     .d8P
  o888o   o888o o888ooooood8 o888ooooood8 o888o        o888ooooood8 o888o  o888o 8""88888*/



D.noop     = function() {}
D.identity = function(x) {return x}
D.concat   = function(a,b) {return a.concat(b)}

D.set_error = function(error) {
  // use this to set simple errors
  return D.on_error('', error)
}

D.on_error = function(command, error) {
  // use this to report errors in low-level daimio processes
  console.log('error: ' + error, command)
  return ""
}

D.make_nice = function(value, otherwise) {
  return D.is_nice(value) ? value : (otherwise || '')
}

D.to_array = function(value) {
  // this converts non-iterable items into a single-element array
  if(D.is_block(value))         return []
  if(Array.isArray(value))      return value
  if(typeof value == 'object')  return D.obj_to_array(value)
  if(value === false)           return []                     // hmmm...
  if(!D.is_nice(value))         return []                     // double hmmm.
                                return [value]
}

D.obj_to_array = function(obj) {
  var arr = []
  for(key in obj)
    arr.push(obj[key])
  return arr
}

D.sort_object_keys = function(obj, sorter) {
  if(typeof obj != 'object')
    return {}

  var newobj = {}
    , keys = Object.keys(obj).sort(sorter)

  for(var i=0, l=keys.length; i < l; i++)
    newobj[keys[i]] = obj[keys[i]]

  return newobj
}

D.blockify = function(value) {
  return D.Types['block'](value)
}

D.stringify = function(value) {
  return D.Types['string'](value)
}

D.execute_then_stringify = function(value, prior_starter, process) {
  if(D.is_block(value)) {
    return D.blockify(value)(prior_starter, {}, process)
  } else {
    return D.stringify(value)
  }
}

D.is_false = function(value) {
  if(!value)
    return true // '', 0, false, NaN, null, undefined

  if(typeof value != 'object')
    return false // THINK: is this always right?

  if(Array.isArray(value))
    return !value.length

  for(var key in value)
    if(value.hasOwnProperty(key))
      return false

  return true
}

D.is_nice = function(value) {
  return !!value || value == false    // not NaN, null, or undefined
}

D.is_segment = function(value) {
  return value instanceof D.Segment
}

D.is_block = function(value) {
  if(!D.is_segment(value))                      // THINK: this prevents block hijacking (by making an object shaped
    return false                                // like a block), but requires us to e.g. convert all incoming 
                                                // JSONified block segments to real segments.
  return value && value.type == 'Block' 
      && value.value && value.value.id          // THINK: why do we need this?
}

D.is_numeric = function(value) {
  return (typeof(value) === 'number' || typeof(value) === 'string') && value !== '' && !isNaN(value)
}

D.to_numeric = function(value) {
  if(value === '0') return 0
  if(typeof value == 'number') return value
  if(typeof value == 'string') return +value ? +value : 0
  return 0
}

D.is_regex = function(str) {
  var regex_regex = /^\/.+?\/(g|i|gi|m|gm|im|gim)?$/
  return regex_regex.test(str)
}

D.regex_escape = function(str) {
  var specials = /[.*+?|()\[\]{}\\$^]/g // .*+?|()[]{}\$^
  return str.replace(specials, "\\$&")
}

D.string_to_regex = function(string, global) {
  if(!D.is_regex(string))
    return RegExp(D.regex_escape(string), (global ? 'g' : ''))

  var flags = string.slice(string.lastIndexOf('/') + 1)
  string = string.slice(1, string.lastIndexOf('/'))

  return RegExp(string, flags)
}


D.clone = function(value) {
  if(value && value.toJSON)
    return D.deep_copy(value)

  try {
    return JSON.parse(JSON.stringify(value))
  } catch (e) {
    return D.deep_copy(value)
  }
}

D.deep_copy = function(value) {
  // deep copy an internal variable (primitives and blocks only)
  if(!value || typeof value != 'object')  return value // number, string, or boolean
  if(D.is_block(value))                   return value // blocks are immutable, so pass-by-ref is ok.
                                          return D.recursive_leaves_copy(value, D.deep_copy)
}

D.recursive_leaves_copy = function(values, fun, seen) {
  // apply a function to every leaf of a tree, but generate a new copy of it as we go
  // THINK: only used by D.deep_copy, which we maybe don't need anymore
  if(!values || typeof values != 'object') return fun(values);

  seen = seen || []; // only YOU can prevent infinite recursion...
  if(seen.indexOf(values) !== -1) return values;
  seen.push(values);

  var new_values = (Array.isArray(values) ? [] : {}); // NOTE: using new_values in the parse phase (rebuilding the object each time we hit this function) causes an order-of-magnitude slowdown. zoiks, indeed.

  for(var key in values) {
    // try { // NOTE: accessing e.g. input.selectionDirection throws an error, which is super-duper lame
      // FIXME: with 'try' this reliably crashes chrome when called in the above instance. ={
      var val = values[key]
      // this is only called from toPrimitive and deep_copy, which both want blocks
      if(D.is_block(val)) {
        new_values[key] = fun(val); // blocks are immutable
      } else if(D.is_segment(val)) {
        new_values[key] = new D.Segment(val.type, val.value, val)
      } else if(typeof val == 'object') {
        new_values[key] = D.recursive_leaves_copy(val, fun, seen);
      } else {
        new_values[key] = fun(val);
      }
    // } catch(e) {D.on_error(e)}
  }

  return new_values;
};


D.extend = function(base, value) {
  // NOTE: this extends by reference, but also returns the new value
  for(var key in value) {
    if(!value.hasOwnProperty(key)) continue
    base[key] = value[key]
  }
  return base
}

D.recursive_extend = function(base, value) {
  // NOTE: this extends by reference, but also returns the new value
  for(var key in value) {
    if(!value.hasOwnProperty(key))    continue

    if(typeof base[key] == 'undefined') {
      base[key] = value[key]
      continue
    }

    if(typeof base[key]  != 'object') continue  // ignore scalars in base
    if(typeof value[key] != 'object') continue  // can't recurse into scalar

    if(Array.isArray(base) && Array.isArray(value)) {
      if(base[key] == value[key])     continue
      base.push(value[key])
      continue // THINK: this bit is pretty specialized for my use case -- can we make it more general?
    }

    D.recursive_extend(base[key], value[key])
  }

  return base
}


D.scrub_var = function(value) {
  // copy and scrub a variable from the outside world
  try {
    return JSON.parse(JSON.stringify(value)); // this style of copying is A) the fastest deep copy on most platforms and B) gets rid of functions, which in this case is good (because we're importing from the outside world) and C) ignores prototypes (also good).
  } catch (e) {
    // D.on_error('Your object has circular references'); // this might get thrown a lot... need lower priority warnings
    value = D.mean_defunctionize(value);
    if(value === null) value = false;
    return value;
  }
};

D.mean_defunctionize = function(values, seen) {
  // this trashes funs and snips circular refs
  if(!D.is_nice(values)) return false;
  if(!values) return values;

  if(typeof values == 'function') return null;
  if(typeof values != 'object') return values;            // number, string, or boolean

  var type = values.constructor.toString().split(' ')[1]
  if(type) {
    var sig = type.slice(0,3)                             // prevents DOM yuckyucks. details here:
    if ( sig == "Nod"                                     // https://github.com/dxnn/daimio/issues/1
      || sig == "HTM"                                     // THINK: can this still leak too much info?
      || sig == "win"
      || sig == "Win"
      || sig == "Mim"
      || sig == "DOM" )
         return null
  }

  seen = seen || [];
  if(seen.indexOf(values) !== -1) return null;            // only YOU can prevent infinite recursion
  seen.push(values);

  var new_values = (Array.isArray(values) ? [] : {});

  for(var key in values) {                                // list or hash: lish
    var new_value, value = values[key];
    new_value = D.mean_defunctionize(value, seen);
    if(new_value === null) continue;
    new_values[key] = new_value;
  }

  return new_values;
};


D.get_block = function(ablock_or_segment) {
  // this is only used in D.Space.prototype.execute
  if(!ablock_or_segment)
    return new D.Block()
  if(ablock_or_segment.segments)
    return ablock_or_segment
  else if(ablock_or_segment.value && ablock_or_segment.value.id && D.BLOCKS[ablock_or_segment.value.id])
    return D.BLOCKS[ablock_or_segment.value.id]
  else
    return new D.Block()
}


D.data_trampoline = function(data, processfun, joinerfun, prior_starter, finalfun) {
  /*
    This *either* returns a value or calls prior_starter and returns NaN.
    It *always* calls finalfun if it is provided.
    Used in small doses it makes your possibly-async command logic much simpler.
  */

  var keys = Object.keys(data)
  , size = keys.length
  , index = -1
  , result = joinerfun()
  , asynced = false
  , value, key

  // if(typeof finalfun != 'function') {
  //   finalfun = function(x) {return x}
  // }

  finalfun = finalfun || D.identity

  // THINK: can we add a simple short-circuit to this? undefined, maybe? for things like 'first' and 'every' it'll help a lot over big data

  var inner = function() {
    while(++index < size) {
      key = keys[index]
      value = processfun(data[key], my_starter, key, result)
      if(value !== value) {
        asynced = true // we'll need to call prior_starter when we finish up
        return NaN // send stack killer up the chain
        // [unleash the NaNobots|NaNites]
      }
      result = joinerfun(result, value, key)
    }

    if(asynced)
      return prior_starter(finalfun(result))

    return finalfun(result)
  }

  var my_starter = function(value) {
    result = joinerfun(result, value, key)
    inner()
  }

  // might need a fun for sorting object properties...

  return inner()
}

D.string_concat = function(total, value) {
  total = D.make_nice(total)
  value = D.make_nice(value)
  return D.stringify(total) + D.stringify(value)
}

D.list_push = function(total, value) {
  if(!Array.isArray(total)) return [] // THINK: is this always ok?
  value = D.make_nice(value)
  total.push(value)
  return total
}

D.list_set = function(total, value, key) {
  if(typeof total != 'object') return {}

  var keys = Object.keys(total)
  if(!key) key = keys.length

  value = D.make_nice(value)

  total[key] = value
  return total
}

D.scrub_list = function(list) {
  var keys = Object.keys(list)

  if(keys.reduce(function(acc, val) {if(acc == val) return acc+1; else return -1}, 0) == -1)
    return list

  return D.to_array(list)
}

D.mungeLR = function(items, fun) {
  // give each item its time in the sun. also, allow other items to be added, removed, reordered or generally mangled
  var L = []
    , R = items
    , item = {}
    , result = []

  if(!items.length) return items

  do {
    item = R.shift() // OPT: shift is slow
    result = fun(L, item, R)
    L = result[0]
    R = result[1]
  } while(R.length)

  return L
}

D.nicify = function(list, state) {
  var result = []
  for(var i=0, l=list.length; i < l; i++)              // the map below is really slow, 
    result.push( D.is_nice(state[list[i]])             // so this is an optimization
               ? state[list[i]]
               : null )                                // THINK: why null?
  
  return result
  // return list.map(function(index) {return D.is_nice(state[index]) ? state[index] : null}) 
}


D.run = function(daimio, ultimate_callback, space) {
  // This is *always* async, so provide a callback.
  if(!daimio) return ""

  daimio = "" + daimio // TODO: ensure this is a string in a nicer fashion...

  if(typeof ultimate_callback != 'function') {
    if(!space)
      space = ultimate_callback
    ultimate_callback = null
  }

  if(!space) {
    space = D.ExecutionSpace
  }

  if(!ultimate_callback) {
    ultimate_callback = function(result) {
      // THINK: what should we do here?
      console.log(result)
    }
  }

  // THINK: can we refactor this into a different type of space.execute? can we convert this whole thing into a temporary channel on the space? with a 'log' type gateway or something?
  var prior_starter = function(value) {
    var result = D.execute_then_stringify(value, ultimate_callback)
    if(result === result)
      ultimate_callback(result)
  }

  var result = space.execute(D.Parser.string_to_block_segment(daimio), null, prior_starter)
  if(result === result)
    prior_starter(result)

  return ""
}


if (typeof exports !== 'undefined') {
  // TODO: make this work!
  // var murmurhash = require('murmurhash3')
  if (typeof module !== 'undefined' && module.exports)
    exports = module.exports = D
  exports.D = D
}



  /*ooo ooo        ooooo ooooooooo.     .oooooo.   ooooooooo.   ooooooooooooo  .oooooo..o
  `888' `88.       .888' `888   `Y88.  d8P'  `Y8b  `888   `Y88. 8'   888   `8 d8P'    `Y8
   888   888b     d'888   888   .d88' 888      888  888   .d88'      888      Y88bo.
   888   8 Y88. .P  888   888ooo88P'  888      888  888ooo88P'       888       `"Y8888o.
   888   8  `888'   888   888         888      888  888`88b.         888           `"Y88b
   888   8    Y     888   888         `88b    d88'  888  `88b.       888      oo     .d8P
  o888o o8o        o888o o888o         `Y8bood8P'  o888o  o888o     o888o     8""88888*/





//    ______  _______ _______  _____   ______ _______ _______  _____   ______ _______
//    |     \ |______ |       |     | |_____/ |_____|    |    |     | |_____/ |______
//    |_____/ |______ |_____  |_____| |    \_ |     |    |    |_____| |    \_ ______|
//


D.add_decorator = function(block_id, type, value, unique) {
  var decorator = { block: block_id
                  , type: type
                  , value: value }
    , existing_decorators

  if(unique) {
    existing_decorators = D.get_decorators(block_id, type)
    if(existing_decorators && existing_decorators.length) {
      return existing_decorators[0]
    }
  }

  if(!D.DecoratorIndices.ByType[type]) {
    D.DecoratorIndices.ByType[type] = []
  }
  if(!D.DecoratorIndices.ByBlock[block_id]) {
    D.DecoratorIndices.ByBlock[block_id] = []
  }
  if(!D.DecoratorIndices.ByTypeBlock[type + '-' + block_id]) {
    D.DecoratorIndices.ByTypeBlock[type + '-' + block_id] = []
  }

  D.DECORATORS.push(decorator)
  D.DecoratorIndices.ByType[type].push(decorator)
  D.DecoratorIndices.ByBlock[block_id].push(decorator)
  D.DecoratorIndices.ByTypeBlock[type + '-' + block_id].push(decorator)

  return decorator
}

D.get_decorators = function(by_block, by_type) {
  var decorators = D.DECORATORS

  if(!by_block) {
    if(by_type) {
      decorators = D.DecoratorIndices.ByType[by_type]
    }
  }
  else {
    if(by_type) {
      decorators = D.DecoratorIndices.ByTypeBlock[by_type + '-' + by_block]
    } else {
      decorators = D.DecoratorIndices.ByBlock[by_block]
    }
  }

  return decorators
}


//     _____   _____   ______ _______ _______
//    |_____] |     | |_____/    |    |______
//    |       |_____| |    \_    |    ______|
//


// A port flavour has a dir [in, out, out/in, in/out (inback outback? up down?)], and dock and add functions


D.track_event = function(type, target, callback) {
  if(!D.Etc.events)
    D.Etc.events = {}

  if(!D.Etc.events[type]) {
    D.Etc.events[type] = {by_class: {}, by_id: {}}

    document.addEventListener(type, function(event) {
      var target = event.target
        , listener
        , parent
        , cname

      // walk the target.parentNode chain up to null, checking each item along the way until you find one
      // OPT: make walking the parent chain optional (use a port param to ask for it)
      while(!listener && target) {
        listener = tracked.by_id[target.id]
        if(listener) break

        cname = target.className
        if(cname) {
          cname = cname.baseVal || cname
          cname.split(/\s+/).forEach(function(name) {
            listener = listener || tracked.by_class[name] // TODO: take all matches instead of just first
          })
        }

        if(listener) break
        target = target.parentNode
      }

      if(listener) {
        event.stopPropagation() // THINK: not sure these are always desired...
        event.preventDefault()  //        maybe use a port param to allow passthru
        var value =
          ( target.attributes['data-value']
            && target.attributes['data-value'].value) // THINK: no empty strings allowed...
          || ( target.value != undefined && target.value )
          || ( target.attributes.value && target.attributes.value.value )
          || target.text
          || D.scrub_var(event)
          || true
        listener(value, event)
      }
    }, false)
  }

  var tracked = D.Etc.events[type]

  if(target[0] == '.') {
    tracked.by_class[target.slice(1)] = callback
  } else {
    tracked.by_id[target] = callback
  }
}

D.send_value_to_js_port = function(space, port_name, value, port_flavour) {
  port_flavour = port_flavour || 'from-js'
  
  for ( var i=0, l=space.ports.length; i < l; i++)
    if( space.ports[i].name == port_name
     && space.ports[i].flavour == port_flavour )
      { space.ports[i].pair.enter(value)
        return true }
  
  return false
}



D.port_standard_exit = function(ship) {
  var self = this
    , outs = this.outs

  // THINK: this makes the interface feel more responsive on big pages, but is it the right thing to do?
  if(this.space)
    // D.setImmediate(this.outs, ship) // OPT
    D.setImmediate(function() { outs.forEach(function(port) { port.enter(ship) }) })
  else
    this.outside_exit(ship) // ORLY? No delay?
}

D.port_standard_pairup = function(port) {
  this.pair = port
  port.pair = this
}

D.port_standard_enter = function(ship, process) {
  if(process && process.state && process.state.secret) { // for exec ports
    process.state.secret.result = ship
    ship = D.clone(process.state.secret)
  }

  if(this.pair)
    return this.pair.exit(ship)

  if(!this.station)
    return D.set_error('Every port must have a pair or a station')

  this.space.dock(ship, this.station) // THINK: always async...?
}


D.import_port_flavour = function(flavour, pflav) {
  if(D.PortFlavours[flavour])
    return D.set_error('That port flavour has already been im-port-ed')

  // TODO: just use Port or something as a proto for pflav, then the fall-through is automatic

  if(!pflav)
    return D.set_error('That flavour is not desirable')

  if(typeof pflav.add != 'function')
    pflav.add = D.noop // noop, so we can call w/o checking

  if(typeof pflav.exit != 'function')
    pflav.exit = D.port_standard_exit

  if(typeof pflav.outside_add != 'function')
    pflav.outside_add = D.noop

  if(typeof pflav.outside_exit != 'function')
    pflav.outside_exit = D.noop

  if(typeof pflav.pairup != 'function')
    pflav.pairup = D.port_standard_pairup

  if(typeof pflav.enter != 'function')
    pflav.enter = D.port_standard_enter

  // if([pflav.enter, pflav.add].every(function(v) {return typeof v == 'function'}))
  //   return D.set_error("That port flavour's properties are invalid")

  D.PortFlavours[flavour] = pflav
  return true
}


//    _______ _______ __   _ _______ _____ _______ _______
//    |______ |_____| | \  | |         |   |______ |______
//    |       |     | |  \_| |_____  __|__ |______ ______|
//


D.import_fancy = function(ch, obj) {
  if(typeof ch != 'string') return D.on_error('Fancy character must be a string')
  // ch = ch[0] // only first char matters
  if(!D.Fancies[ch]) {
    // TODO: check obj.eat
    D.Fancies[ch] = obj
  } else {
    D.set_error('Your fancies are more borken')
  }

  D.Etc.FancyRegex = RegExp(Object.keys(D.Fancies)
                                 .sort(function(a, b) {return a.length - b.length})
                                 .map(function(str) {return '^' + D.regex_escape(str) + '\\w'})
                                 .join('|'))
}

D.import_fancy(':', {
  eat: function(token) {
    token.type = 'String'
    token.value = token.value.slice(1)
    return [token] // reuse the existing token to retain the inputs and key and whatnot
  }
})

D.import_fancy('>@', {
  eat: function(token) {

    // TODO: throw a runtime error if it's not a valid port

    token.type = 'PortSend'
    token.value = {to: token.value.slice(2)}

    return [token]
  }
})

D.import_fancy('>$', {
  eat: function(token) {

    // TODO: change path to name, make >$foo set foo, make >$foo.baz.baa -> list poke path (:baz :baa) data $foo value __ | >$foo

    var pieces = D.Parser.split_on(token.value, '.')
      , name = pieces.shift().slice(2)
      , poke_tokens = []

    token.type = 'VariableSet'
    token.value = {type: 'space', name: name}

    if(pieces.length) {
      pieces = pieces.map(function(item) {
        return item[0] != '{'
             ? '"' + item + '"'
             : item
      })

      var path = new D.Token('List', pieces.join(' '))
        , poker = new D.Token('Command', 'list poke data $' + name)

      poker.names = ['path', 'value']
      poker.inputs = [path.key, token.prevkey]

      token.names = ['value']
      token.inputs = [poker.key]

      poke_tokens = [path, poker]
    }

    return poke_tokens.concat(token)
  }
})

D.import_fancy('>', {
  eat: function(token) {

    // TODO: THROW AN ERROR IF IT ALREADY EXISTS IN THE PROCESS
    // NOTE: this doesn't need {list poke} because you can only set it once

    token.type = 'VariableSet'
    token.value = {type: 'pipeline', name: token.value.slice(1)}

    return [token]
  }
})

D.import_fancy('__', {
  eat: function(token) {
    token.type = 'PipeVar'

    // if(token.value == '__') // regular magic pipe
    //   return [token]
    // token.value = '__' // TODO: this probably isn't right
    // token.value = token.value.slice(1)

    var pieces = D.Parser.split_on(token.value, '.')
    token.value = pieces.shift()

    if(token.value != '__' && token.value != '__in') {
      D.set_error('Only __ and __in are allow to start with __')
      return []
    }

    return [token].concat(D.eat_fancy_var_pieces(pieces, token))
  }
})

D.import_fancy('_', {
  eat: function(token) {
    return D.eat_fancy_var(token, 'pipeline')
  }
})

D.import_fancy('$', {
  eat: function(token) {
    return D.eat_fancy_var(token, 'space')
  }
})

D.eat_fancy_var = function(token, type) {
  var pieces = D.Parser.split_on(token.value, '.')
  var name = pieces.shift().slice(1)

  token.type = 'Variable'
  token.value = {type: type, name: name}

  return [token].concat(D.eat_fancy_var_pieces(pieces, token))
}

D.eat_fancy_var_pieces = function(pieces, token) {
  if(!pieces.length)
    return []

  // inline peek filtering
  pieces = pieces.map(function(item) {
    return item[0] != '{'
         ? '"' + item + '"'
         : item
  })

  var path = new D.Token('List', pieces.join(' '))
    , peeker = new D.Token('Command', 'list peek')

  peeker.names = ['data', 'path']
  peeker.inputs = [token.key, path.key]

  return [path, peeker]
}


//    _______ _______  ______ _______ _____ __   _ _______ _______  _____   ______ _______
//       |    |______ |_____/ |  |  |   |   | \  | |_____|    |    |     | |_____/ |______
//       |    |______ |    \_ |  |  | __|__ |  \_| |     |    |    |_____| |    \_ ______|
//

D.import_terminator = function(ch, obj) {
  if(typeof ch != 'string') return D.on_error('Terminator character must be a string')
  // ch = ch[0] // only first char matters
  if(!D.Terminators[ch]) D.Terminators[ch] = []
  D.Terminators[ch].push(obj)
  D.Etc.Tglyphs += ch
}

// TODO: these should do more than just return a fancy parser...

D.terminate = function(ch, verb, params) {
  if(!D.Terminators[ch]) return false
  var fun, terminators = D.Terminators[ch]

  for(var i=0, l=terminators.length; i < l; i++) {
    fun = terminators[i][verb]
    if(typeof fun != 'function') continue
    fun.apply(terminators[i], params)
  }
}

D.import_terminator('|', { // pipe
  eat: function(stream, state) {
    stream.next()
    return 'bracket'
  }
})

// THESE DO NOTHING:

D.import_terminator('^', { // lift
  eat: function(stream, state) {
    stream.next()
    return 'bracket'
  }
})

D.import_terminator('/', { // comment
  eat: function(stream, state) {
    while(stream.peek() === '/') stream.next()
    state.commentLevel++
    state.stack[state.stack.length-1].onTerminate.commentLevel-- // set parent's onTerminate
    // state.stack[state.stack.length-1].onClose.commentLevel-- // set parent's onClose
    return 'comment'
  }
})


//    _______        _____ _______ _______ _______ _______
//    |_____| |        |   |_____| |______ |______ |______
//    |     | |_____ __|__ |     | ______| |______ ______|
//


D.import_models = function(new_models) {
  for(var model_key in new_models) {
    var model = new_models[model_key]
    if(!D.Commands[model_key]) {
      D.Commands[model_key] = model
    }
    else {
      D.extend(D.Commands[model_key]['methods'], model['methods'])
    }
  }
}

D.import_aliases = function(values) {

  // TODO: move this inside Dialects
  // THINK: this only accepts fully-formed handler/method combos, with simple params (no new ablocks). is that ideal?
  D.extend(D.AliasMap, values)

  for(var key in values) {
    var value = values[key]
    value = D.Parser.string_to_tokens('{' + value + '}')
    D.Aliases[key] = value // do some checking or something
  }
}



//    _______ __   __  _____  _______ _______
//       |      \_/   |_____] |______ |______
//       |       |    |       |______ ______|
//


D.import_type = function(key, fun) {
  // Daimio's type system is dynamic, weak, and latent, with implicit user-definable casting via type methods.
  D.Types[key] = fun
  // TODO: add some type checking
};



//     _____  _______ _______ _     _ _______ _____ __   _ ______  _______  ______ _______
//    |_____] |_____|    |    |_____| |______   |   | \  | |     \ |______ |_____/ |______
//    |       |     |    |    |     | |       __|__ |  \_| |_____/ |______ |    \_ ______|
//


D.import_pathfinder = function(name, pf) {
  if(typeof pf.keymatch != 'function')
    pf.keymatch = function(key) {return false} // return false if N/A, 'one' if you're singular, otherwise 'many'

  if(typeof pf.gather != 'function')
    pf.gather = D.identity // returns a list of all matched items

  pf.name = name

  D.Pathfinders.push(pf)
  // find returns a list of matching items, empty for none, null for N/A [or value/null, if amount is one]
}

D.peek = function(base, path) {
  path = D.to_array(path)

  if(!path.length)
    return value

  var todo = [base]
    , many_flag = false

  for(var i=0, l=path.length; i < l; i++) {
    var key = path[i]
      , new_todo = []
      , pf

    // choose our pathfinder
    for(var j=0, k=D.Pathfinders.length; j < k; j++) {
      pf = D.Pathfinders[j]
      var test = pf.keymatch(key)

      if(test == 'many')
        many_flag = true

      if(test)
        break
    }

    if(!pf)
      return D.set_error('No matching pathfinder was found')

    // apply chosen pf to each item in todo
    for(var j=0, k=todo.length; j < k; j++) {
      new_todo = new_todo.concat(pf.gather(todo[j], key))
    }

    // tidy up
    // NOTE: we don't short circuit here on empty todo because we want many_flag to be accurate -- itemless peek should return an empty list if any many_flag PFs are invoked, and false otherwise
    todo = new_todo
  }

  if(many_flag)
    return todo

  return todo.length ? todo[0] : false
}

D.poke = function(base, path, value) {
  // NOTE: this mutates *in place* and returns the mutated portion (mostly to make our 'list' pathfinder simpler)

  path = D.to_array(path)

  // THINK: no path works like push, because that's a reasonable use case for this...
  // if(!path.length) // no path does nothing, for consistency (can't mutate base->value in place)
  //   return base
  if(!path.length)
    path = [base.length]

  if(typeof base != 'object')
    base = [base]

  var todo = [base]

  for(var i=0, l=path.length; i < l; i++) {
    var key = path[i]
      , new_todo = []
      , pf

    // choose our pathfinder
    for(var j=0, k=D.Pathfinders.length; j < k; j++) {
      pf = D.Pathfinders[j]
      var test = pf.keymatch(key)

      if(test == 'many')
        many_flag = true

      if(test)
        break
    }

    if(!pf)
      return D.set_error('No matching pathfinder was found')

    // apply chosen pf to each item in todo
    for(var j=0, k=todo.length; j < k; j++) {
      if(i < l - 1) { // normal: find or create
        new_todo = new_todo.concat(pf.create(todo[j], key))
      }
      else { // last time: set value
        pf.set(todo[j], key, value)
      }
    }

    todo = new_todo
  }

  return base
}



  /*ooooooo.         .o.       ooooooooo.    .oooooo..o oooooooooooo ooooooooo.
  `888   `Y88.      .888.      `888   `Y88. d8P'    `Y8 `888'     `8 `888   `Y88.
   888   .d88'     .8"888.      888   .d88' Y88bo.       888          888   .d88'
   888ooo88P'     .8' `888.     888ooo88P'   `"Y8888o.   888oooo8     888ooo88P'
   888           .88ooo8888.    888`88b.         `"Y88b  888    "     888`88b.
   888          .8'     `888.   888  `88b.  oo     .d8P  888       o  888  `88b.
  o888o        o88o     o8888o o888o  o888o 8""88888P'  o888ooooood8 o888o  o88*/


D.Parser.get_next_thing = function(string, ignore_begin) {
  var first_open, next_open, next_closed

  first_open = next_open = next_closed = string.indexOf(D.Constants.command_open);

  if(first_open == -1) return string  // no Daimio here
  if(first_open > 0) return string.slice(0, first_open)  // trim non-Daimio head

  do {
    next_open = string.indexOf(D.Constants.command_open, next_open + 1)
    next_closed = string.indexOf(D.Constants.command_closed, next_closed) + 1
  } while(next_closed && next_open != -1 && next_closed > next_open)

  // TODO: add a different mode that returns the unfulfilled model / method etc (for autocomplete)
  if(!next_closed) {
    D.on_error("No closing brace for '" + string + "'")
    return string
  }

  if(ignore_begin || string.slice(0,7) != D.Constants.command_open + 'begin ')
    return string.slice(0, next_closed)  // not a block

  var block_name = string.match(/^\{begin (\w+)/)
  if(!block_name) {
    // FIXME: handle this situation better
    D.on_error(string, 'Something weird happened')
    return string
  }
  block_name = block_name[1];

  var end_tag = D.Constants.command_open + 'end ' + block_name + D.Constants.command_closed
    , end_begin = string.indexOf(end_tag)
    , end_end = end_begin + end_tag.length;

  if(!end_begin) {
    // FIXME: handle this situation better
    D.on_error(string, "No end tag for block '" + block_name + "'");
    return string;
  }

  // THINK: we're going to go ahead and deal with the block right here... is this the right place for this?
  // No, no it really isn't

  return string.slice(0, end_end);
}


D.Parser.string_to_block_segment = function(string) {
  var segment = D.Parser.segments_to_block_segment(D.Parser.string_to_segments(string))
    , block_id = segment.value.id

  D.add_decorator(block_id, 'OriginalString', string, true)           // THINK: why is this unique? 
                                                                      // what should we do with different
  return segment                                                      // strings that compile to the same block?
}

D.Parser.segments_to_block_segment = function(segments) {
  var wiring = {}

  // TODO: refactor this into get_wiring or something
  for(var i=0, l=segments.length; i < l; i++) {
    var segment = segments[i]

    if(segment.inputs && segment.inputs.length) {
      wiring[segment.key] = segment.inputs
    }
  }

  var block   = new D.Block(segments, wiring)
    , segment = new D.Segment('Block', {id: block.id})

  return segment
}

D.Parser.pipeline_string_to_tokens = function(string, quoted) {
  var tokens = []
    , P = D.Parser
    , strings = []

  if(typeof string != 'string')
    return string || []

  if(string.slice(0,7) == D.Constants.command_open + 'begin ') { // in a block
    var pipeline = D.Parser.get_next_thing(string, true)
      , block_name = pipeline.match(/^\{begin (\w+)/)[1] // TODO: this could fail
      , end_tag = D.Constants.command_open + 'end ' + block_name + D.Constants.command_closed
      , body = string.slice(pipeline.length, -end_tag.length)
      , segment = D.Parser.string_to_block_segment(body)

    pipeline = '"foo" ' + pipeline.slice(7+block_name.length, -1) // trim '{begin \w+' and trailing '}'
    strings = P.split_on_terminators(pipeline)
    strings[0] = '"' + body + '"'
  }
  else {
    if(string[0] != '{' && string.slice(-1) != '}') {
      D.set_error('That string is not a pipeline')
      return []
    }

    string = string.slice(1, -1)

    strings = P.split_on_terminators(string)
  }

  var new_tokens = P.strings_to_tokens(strings, true)

  // for(var i=0, l=new_tokens.length; i < l; i++) {
  //   if(!new_tokens[i].position)
  //     new_tokens[i].position = i+1
  // }

  if(quoted && new_tokens.length)
    new_tokens[0].prevkey = '__in'

  return new_tokens
}

D.Parser.strings_to_tokens = function(strings) {
  var tokens = []
    , extract_munger = ''
    , munge_munger = ''
    , P = D.Parser

  if(typeof strings == 'string')
    strings = [strings]

  if(!strings.map)
    return []

  tokens = strings
           .map(P.lexify)
           .reduce(D.concat, [])

  extract_munger = function(L, token, R) { // TODO: refactor this
    var type = D.SegmentTypes[token.type]
    if(!type) return [L, R] // no know type
    if(!type.extract_tokens) return [L.concat(token), R]
    return type.extract_tokens(L, token, R) // for terminators etc
  }

  tokens = D.mungeLR(tokens, extract_munger)

  // for(var key in D.SegmentTypes) {
  //   var type = D.SegmentTypes[key]
  // }

      // TODO: this needs to run over each SegmentType for each item... like, if something shoves new stuff on the list, we need to scan all of that R stuff with each item before we move on, rather than scanning each item...
      // TODO: so have mungeLR invoke a FAMILY of functions.
      // USECASE: list inside command inside list inside command... likely borks.

  munge_munger = function(L, token, R) {
    var type = D.SegmentTypes[token.type]
    if(!type) return [L, R] // no know type
    if(!type.munge_tokens) return [L.concat(token), R]
    return type.munge_tokens(L, token, R)
  }

  tokens = D.mungeLR(tokens, munge_munger)

  return tokens
}

D.Parser.string_to_tokens = function(string) {
  var output = []
    , result = false
    , block_inputs = []
    , chunk = D.Parser.get_next_thing(string)

  if(chunk.length == string.length && chunk[0] == D.Constants.command_open) {
    // only one chunk, so make regular pipeline
    return D.Parser.pipeline_string_to_tokens(chunk)
  }
  else {
    // make blockjoin
    do {
      string = string.slice(chunk.length)
      result = []

      if(chunk[0] == D.Constants.command_open) {
        result = D.Parser.pipeline_string_to_tokens(chunk, true)
      } else {
        result = [new D.Token('String', chunk)]
        // output.push(D.Parser.strings_to_tokens(chunk))
      }

      if(result.length) {
        output = output.concat(result)
        block_inputs.push(result[result.length - 1].key)
      }
    } while(chunk = D.Parser.get_next_thing(string))

    var joiner = new D.Token('Blockjoin', '')
    joiner.inputs = block_inputs
    output.push(joiner)
  }

  return output
  // return output.reduce(D.concat, [])
}

D.Parser.tokens_to_segments = function(tokens) {
  var segments = []
    , munger = ''
    , P = D.Parser

  segments = tokens.map(function(token) {return D.SegmentTypes[token.type].token_to_segments(token)})
                   .reduce(D.concat, [])

  // for(var key in D.SegmentTypes) {
  //   var type = D.SegmentTypes[key]
  //
  //   if(!type.munge_segments)
  //     continue
  //
  //   munger = function(L, segment, R) {
  //
  //     if(segment.type != key) return [L.concat(segment), R]
  //     return type.munge_segments(L, segment, R)
  //   }
  //
  //   segments = D.mungeLR(segments, munger)
  // }

  munger = function(L, segment, R) {
    var type = D.SegmentTypes[segment.type]
    if(!type) return [L, R] // no know type
    if(!type.munge_segments) return [L.concat(segment), R]
    return type.munge_segments(L, segment, R)
  }

  segments = D.mungeLR(segments, munger)

  return segments
}

D.Parser.string_to_segments = function(string) {
  return D.Parser.tokens_to_segments(D.Parser.string_to_tokens(string))
}


D.Parser.lexify = function(string) {
  /// NOTE: this always returns an ARRAY of tokens!

  var P = D.Parser
    , types = Object.keys(D.SegmentTypes)
    , lexers = types.map(function(type) {return D.SegmentTypes[type].try_lex})

  if(string.trim)
    string = string.trim() // THINK: is there a better place for this?

  for(var i=0, l=lexers.length; i < l; i++) {
    if(typeof string != 'string')
      return Array.isArray(string) ? string : [string]

    string = lexers[i](string)
  }

  return Array.isArray(string) ? string : [string]
}

D.Parser.split_on = function(string, regex, label) {
  if(typeof string != 'string')
    return string

  if(!(regex instanceof RegExp))
    regex = RegExp('[' + D.regex_escape(regex) + ']')

  var output = []
    , inside = []
    , special = /["{()}]/
    , match_break = 0
    , char_matches = false
    , we_are_matching = false

  for(var index=0, l=string.length; index < l; index++) {

    /*
      we need to not match when
      - inside quotes
      - unmatched parens
      - unmatched braces
    */

    var this_char = string[index]
      , am_inside = inside.length

    if(this_char == '"' && inside.length == 1 && inside[0] == '"')
      inside = []

    if(this_char == '"' && !am_inside)
      inside = ['"']

    if(this_char == '{')
      inside.push('{')

    if(this_char == '(')
      inside.push('(')

    if(this_char == '}' || this_char == ')')
      inside.pop() // NOTE: this means unpaired braces or parens in quotes are explicitly not allowed...

    char_matches = regex.test(this_char)

    // if(!!am_inside == !!inside.length) // not transitioning
    //   continue
    //   output.push(string.slice(match_break, index + 1))
    //   match_break = index + 1
    // }
    //
    // if(!am_inside && inside.length) {
    //   output.push(string.slice(match_break, index))
    //   match_break = index
    // }
    //
    // if(special.test(this_char))
    //   continue
    //

    if(am_inside && inside.length)
      continue

    if(we_are_matching === char_matches)
      continue

    if(we_are_matching) { // stop matching
      if(label)
        output.push(new D.Token(label, string.slice(match_break, index)))

      match_break = index
      we_are_matching = false
    }

    else { // start matching
      if(index)
        output.push(string.slice(match_break, index))

      match_break = index
      we_are_matching = true
    }
  }

  // if(match_break < index) {
  //   var lastbit = string.slice(match_break, index)
  //   if(lastbit.length) {
  //     output.push(lastbit)
  //   }
  // }

  if(match_break < index) {
    var lastbit = string.slice(match_break, index)
    if(regex.test(lastbit[0])) { // at this point lastbit is homogenous
      if(label)
        output.push(new D.Token(label, string.slice(match_break, index)))
    } else {
      output.push(lastbit)
    }
  }
  return output
}

D.Parser.split_on_terminators = function(string) {
  // TODO: make Tglyphs work with multi-char Terminators
  return D.Parser.split_on(string, D.Etc.Tglyphs, 'Terminator')
}

D.Parser.split_on_space = function(string) {
  return D.Parser.split_on(string, /[\s\u00a0]/)
}


// D.Parser.rekey = function(L, segment, R) {
//   if(!segment) return [L, R]
// 
//   var old_key = segment.key
//   var new_key = L.length
// 
//   // TODO: holymuckymuck, is this ever ugly and slow. clean me!
//   for(var i=0, l=R.length; i < l; i++) {
//     var future_segment = R[i]
//     var index
// 
//     if(future_segment.inputs) {
//       while(true) {
//         index = future_segment.inputs.indexOf(old_key)
//         if(index == -1) break
//         future_segment.inputs[index] = new_key
//       }
//     }
// 
//     if( future_segment.value
//      && future_segment.value.name
//      && future_segment.value.name == old_key)
//         future_segment.value.name = new_key
//   }
// 
//   segment.key = new_key
//   return [L.concat(segment), R]
// }




    /*ooooo.   oooooooooo.     oooo oooooooooooo   .oooooo.   ooooooooooooo  .oooooo..o
   d8P'  `Y8b  `888'   `Y8b    `888 `888'     `8  d8P'  `Y8b  8'   888   `8 d8P'    `Y8
  888      888  888     888     888  888         888               888      Y88bo.
  888      888  888oooo888'     888  888oooo8    888               888       `"Y8888o.
  888      888  888    `88b     888  888    "    888               888           `"Y88b
  `88b    d88'  888    .88P     888  888       o `88b    ooo       888      oo     .d8P
   `Y8bood8P'  o888bood8P'  .o. 88P o888ooooood8  `Y8bood8P'      o888o     8""88888P'
                            `Y88*/


//     ______          _____  _______ _     _
//     |_____] |      |     | |       |____/
//     |_____] |_____ |_____| |_____  |    \_
//

D.Block = function(segments, wiring) {

  /*
    head is an array of Segment objects, which look like {
      type: ""
      value: ...
      params: {}
      ins: {}
      outs: []
    }
    required:
    type is Number, String, List, Command, Alias, Block
      --> during processing, various transformer types are available (currently Terminator and Fancy)
    value is {Handler: "", Method: ""} for Command, raw value otherwise
    optional:
    params is an 1D key/value for Command or Alias with "!" as implicit key and NULL for referenced values
    ins' keys are param keys, values are previous outs
    outs are labels for partial products

    Block is a block reference -- typically hash id
    Transformers are processed prior to ABlockiness (currently terminators and fancy)
    Aliases are converted to Commands prior to PBlockiness (and Command values are then enhanced with method pointer)
  */


  // // soooooo... this assumes head is a bunch of segments OR body is a bunch of strings or ABlocks. right. gotcha.
  //
  // if(head) {
  //   // ensure it's an array of Segments, I suppose...
  //   this.head = head
  // }
  //
  // if(body) {
  //   // TODO: filter out extracted blocks
  //
  //   // ensure it's an array of strings and ABlocks, then take the string or block's id
  //   if(body.some && !body.some(function(item) {return (typeof item != 'string') && !item.id}).length) {
  //     this.body = body.filter(function(item) { return !item.adjunct })
  //                     .map(function(item) { return (typeof item == 'string') ? item : {'block': item.id} })
  //      // THINK: this 'block' bit is a bod block ref. should we use segments here instead?
  //   }
  // }
  //
  // if(!this.head && !this.body) // THINK: when does this happen? what should we return?
  //   this.body = []

  if(!Array.isArray(segments))
    segments = []

  // TODO: ensure all segments are segments

  if(!wiring || (typeof wiring != 'object'))
    wiring = {}

  var pair = D.wash_keys(segments, wiring)                    // OPT: this happens for each optimizer
  segments = pair.segments                                    // but it's only needed once at the end
  wiring   = pair.wiring

  this.segments = segments
  this.wiring = wiring

  var json = JSON.stringify(this)
    , hash = murmurhash(json)

  if(!D.BLOCKS[hash])                                         // THINK: take this out and put it elsewhere? 
    D.BLOCKS[hash] = this                                     // or... how is block access limited? or... huh.

  this.id = hash
}

D.wash_keys = function(segments, wiring) {
  var new_wiring = {}
  var temp_wiring = {}
  var new_segments = []
  var reverse_wiring = {}
  
  for(var key in wiring) {
    var wire = wiring[key]
    for(var i=0, l=wire.length; i < l; i++)
      reverse_wiring[wire[i]] = reverse_wiring[wire[i]] 
                              ? reverse_wiring[wire[i]].concat(key) 
                              : [key]
  }
  
  for(var j=0, k=segments.length; j < k; j++) {
    var segment = segments[j]
    var index = new_segments.length
    var my_key = segment.key || j
    var my_wires = reverse_wiring[my_key] || []
    var input_index = -1
    
    if( !my_wires.length                                 // toss anything that isn't linked to the final segment
     && j != k-1                                         // except the final segment itself, obviously
     && segment.type != 'VariableSet'                    // 'Put' segtypes are purely side effects
     && segment.type != 'PortSend'                       // TODO: change these to 'PutSpaceVar' and 'PutPort'
     &&  ( segment.type != 'Command'                     
        && segment.value.Method != 'run'                 // two commands are also side-effect based...
        && segment.value.Method != 'sleep' ))            // FIXME: find a nice way to deal with that
           continue
    
    for(var i=0, l=my_wires.length; i < l; i++) {
      if(!temp_wiring[my_wires[i]])
        temp_wiring[my_wires[i]] = []
      while((input_index = wiring[my_wires[i]].indexOf(my_key, input_index+1)) != -1)
        temp_wiring[my_wires[i]][input_index] = index
    }
    
    if(temp_wiring[my_key])
      new_wiring[index] = temp_wiring[my_key]
    
    // am i missing any keys?
    if(wiring[my_key]) {
      for(var x=0, z=wiring[my_key].length; x < z; x++) {
        if(!new_wiring[index])
          new_wiring[index] = []
        if(new_wiring[index][x] === undefined)
          new_wiring[index][x] = wiring[my_key][x]
      }
    }
    
    // put the value.name in the wiring
    // then build an old_key_new_key map
    // and switch this at that point
    // but also if it's in the wiring who cares?
    // oh but we need this for final pipevars
    // because otherwise who's going to speak for them?
    
    //     if( future_segment.value
    //      && future_segment.value.name
    //      && future_segment.value.name == old_key)
    //         future_segment.value.name = new_key
    
    
    // 'run' is used purely for side effects sometimes like {"{2 | >$foo}" | run | $foo}
    // so we can't get rid of it just because it's not linked to the output.
    // also, things that are linked to >@ have the same problem.
    // also, any command that has a downport.
    // sucky sucky suck suck stupid stupid
    // also 'wait'
    
    
    new_segments.push(new D.Segment(segment.type, segment.value, null))
  }
  
  return {segments: new_segments, wiring: new_wiring}
}



//    _______  _____  _     _ _______ __   _
//       |    |     | |____/  |______ | \  |
//       |    |_____| |    \_ |______ |  \_|
//

D.Token = function(type, value) {
  this.key = D.Etc.token_counter++
  this.type = type
  this.value = value
}


//    _______ _______  ______ _______ _______ __   _ _______
//    |______ |______ |  ____ |  |  | |______ | \  |    |
//    ______| |______ |_____| |  |  | |______ |  \_|    |
//

D.Segment = function(type, value, token) {
  this.type = type || 'String'
  this.value = D.make_nice(value)

  if(token === null)
    return this

  if(!token)
    token = {}

  this.prevkey = token.prevkey || false
  this.names = token.names || []
  this.inputs = token.inputs || []
  this.key = token.key || false

  // THINK: how do we allow storage / performance optimizations in the segment structure -- like, how do we fill in the params ahead of time?

  // TODO: refactor the above... oy. pseudosegments vs real segments, default values, etc...

  /*
    Segments also have
    params -- commands have these (it's a hash of segments)
    paramlist -- params post-dialecticalization
    method -- post-d, for Command segments

    Segment types:
      paramable: String, Number, Block, Input, Null (for alias dangling params)
      paramfree: List, Command, Alias
      temporary: Fing, Begin, Fancy, Pipeline

    ABlock segments (and beyond) have their keys changed to pipeline position and Input segments remapped
  */
}

D.Segment.prototype.toJSON = function() {
  var type = D.SegmentTypes[this.type]

  // THINK: unfortunately this is triggered by ABlock() before murmurhashing, which probably will screw something up someday.

  if(type && type.toJSON) {
    return type.toJSON(this)
  } else {
    return JSON.stringify(this.value)
  }
}


//    ______  _____ _______        _______ _______ _______
//    |     \   |   |_____| |      |______ |          |
//    |_____/ __|__ |     | |_____ |______ |_____     |
//

D.Dialect = function(commands, aliases) {

  /*
    A Space is an execution context for Blocks.
    Each Space has a fixed Block that handles incoming messages by
    - dispatching based on message parameters
    - executing the message as code
    - feeding the message through the fixed Block as data
    Spaces may send messages to each other through channels via the space gateway.
    Each Space has a private variable context for mutable space variables.
    Each Space is responsible for its own Processes, but we're using a setTimeout to queue messages
      (to avoid blowing the stack and to keep things ordered correctly)



    Frozen space data:
      state: {}
      dialect:
        commands: {}
        aliases: {}
      ports:
        name:
        flavour: name [contains: dir, add, dock]
        settings: flavour data
        outs: [port_index]
        typehint:
        space: id
        station: index?
      stations:
        block: id
        name: ?

    Instances of ports have the flavour in prototype, and have more outs added by parent space.

    D.SPACESEEDS is for abstract spaces, ie the spacial data that is imported/exported.
    D.OuterSpace refers to the outermost space [but we should make this an array to allow multiple independent "bubbles" to operate... maybe].
    An individual space is only referenced from its parent space... or maybe there's a weakmap cache somewhere or something.
  */

  this.commands = commands ? D.deep_copy(commands) : D.Commands
  this.aliases = aliases ? D.clone(aliases) : D.Aliases
  // this.parent = parent
}

D.Dialect.prototype.get_handler = function(handler) {
  if(  handler
    && this.commands
    && this.commands[handler]
    && this.commands[handler]
  ) {
    return this.commands[handler]
  }

  return false
}

D.Dialect.prototype.get_method = function(handler, method) {
  if(  handler
    && method
    && this.commands
    && this.commands[handler]
    && this.commands[handler].methods
    && this.commands[handler].methods[method]
  ) {
    return this.commands[handler].methods[method]
  }

  return false
}


//     _____   _____   ______ _______
//    |_____] |     | |_____/    |
//    |       |_____| |    \_    |
//

D.Port = function(port_template, space) {
  var flavour = port_template.flavour
    , settings = port_template.settings
    , station = port_template.station
    , name = port_template.name
    , typehint = port_template.typehint

  var pflav = D.PortFlavours[flavour]

  if(!pflav)
    return D.set_error('Port flavour "' + flavour + '" could not be identified')

  // if(D.PORTS[name])
  //   return D.set_error('That port has already been added')

  if(!name)
    name = 'port-' + Math.random()

  // if(!space)
  //   return D.set_error('Every port must have a space')

  var port = Object.create(pflav)

  port.outs = []
  port.name = name
  port.space = space
  port.flavour = flavour
  port.station = station || undefined
  port.typehint = typehint
  port.settings = D.make_nice(settings, {})

  port.pair = false

  if(port.space)
    port.add()
  else
    port.outside_add()

  if(port.space && !port.space.parent && !port.station && !port.subspace) {
    var outside_template = D.clone(port_template)
    delete outside_template['space']
    var outside_port = new D.Port(outside_template)
    outside_port.pairup(port)
  }

  return port
}



   /*ooooo..o ooooooooo.         .o.         .oooooo.   oooooooooooo
  d8P'    `Y8 `888   `Y88.      .888.       d8P'  `Y8b  `888'     `8
  Y88bo.       888   .d88'     .8"888.     888           888
   `"Y8888o.   888ooo88P'     .8' `888.    888           888oooo8
       `"Y88b  888           .88ooo8888.   888           888    "
  oo     .d8P  888          .8'     `888.  `88b    ooo   888       o
  8""88888P'  o888o        o88o     o8888o  `Y8bood8P'  o888oooooo*/


D.Space = function(seed_id, parent) {
  // D.SPACESEEDS[seed_id] contains id, dialect, state, ports, stations, subspaces, routes
  // TODO: validate parent
  // THINK: validate seed_id?

  var seed = D.SPACESEEDS[seed_id]
    , self = this

  if(!seed)
    return D.set_error('Invalid spaceseed')

  this.seed = seed
  this.state = {}
  this.parent = parent || false // false is outer

  // add all the ports at once
  this.ports = seed.ports.map(function(port, index) {return new D.Port(port, self)})

  // add outs to ports
  seed.routes.forEach(function(route) {self.ports[route[0]-1].outs.push(self.ports[route[1]-1])})

  // add all my children
  this.subspaces = seed.subspaces.map(function(seed_id) {return new D.Space(seed_id, self)})

  // pair my subspace ports
  this.subspaces.forEach(function(subspace, subspace_index) {
    var port_name_to_port = {}

    for(var key in seed.ports) {
      var port = seed.ports[key]
      if(port.space != subspace_index+1) // 1-indexed
        continue
      port_name_to_port[port.name] = self.ports[key]
    }

    subspace.ports
      .filter(function(port) {return port.space === subspace         // THINK: when is it not?
                                  && !port.station                   // keep out stations
                                  && !port.pair                      // keep out subsubspaces
                                  && port_name_to_port[port.name]})  // just in case we've missed something
      .forEach(function(port) {port_name_to_port[port.name].pairup(port)})
  })

  // revise dialect
  this.dialect = D.DIALECTS.top // TODO: this probably isn't right, but the timing gets weird otherwise

// NOTE: DON'T DELETE THIS YET -- decide what you're doing with dialects first.
//  if(this.parent) {
//    var parent_dialect = this.parent.dialect ? this.parent.dialect : D.DIALECTS.top
//    this.dialect = new D.Dialect(parent_dialect.commands, parent_dialect.aliases)
//    // if(seed.dialect.commands && seed.dialect.commands.minus) {
//    //   var minus = seed.dialect.commands.minus
//    if(seed.dialect.commands && seed.dialect.minus) {
//      var minus = seed.dialect.minus
//      for(var key in minus) {
//        var value = minus[key]
//
//        if(value === true) {
//          delete this.dialect.commands[key]
//          continue
//        }
//
//        value.forEach(function(method) {
//          try {
//            delete this.dialect.commands[key].methods[method]
//          } catch(e) {}
//        })
//      }
//    }
//  }

  // yoiks
  this.only_one_process = true
  this.processes = []
  this.queue = []
}

D.Space.prototype.get_state = function(param) {
  return (typeof this.state[param] != 'undefined') ? this.state[param] : this.seed.state[param]
}

D.Space.prototype.dock = function(ship, station_id) {
  var block_id = this.seed.stations[station_id - 1]
    , block = D.BLOCKS[block_id]
    , output_port = this.ports.filter(function(port) {return port.station == station_id && port.name == '_out'})[0]
    , prior_starter = function(value) {output_port.exit(value)} // THINK: we're jumping straight to exit here. need to do the same for any implicit station output ports...
    , scope = {"__in": ship} // TODO: find something better...
    , value = this.execute(block, scope, prior_starter, station_id)

  if(value === value)
    prior_starter(value)

  // this.station_id = false // THINK: if we go async in here it toasts the station_id...
  // THINK: do we need to send back NaN? there's probably no callstack here to speak of...
}

D.Space.prototype.please_change_your_seed_to = function(seed_id) {
  var old_seed = this.seed
    , new_seed = D.SPACESEEDS[seed_id]

  if(!new_seed)
    return D.set_error('You done messed up')

  if(JSON.stringify(old_seed) == JSON.stringify(new_seed))
    console.log('Identical seeds')

  // we're going to assume that if a subspace has changed, we'll receive a tell_my_parent request instead of a please_change_your_seed_to request. so if we're here and subspaces are different its because we need to add/remove subspaces.

  if(JSON.stringify(old_seed.subspaces) != JSON.stringify(new_seed.subspaces))
    console.log('subspaces differ')

  if(JSON.stringify(old_seed.stations) != JSON.stringify(new_seed.stations))
    console.log('stations differ')
  // station mod -> no change, but add/remove needs change... how do we tell?

  if(JSON.stringify(old_seed.routes) != JSON.stringify(new_seed.routes))
    console.log('routes differ')

  if(JSON.stringify(old_seed.ports) != JSON.stringify(new_seed.ports))
    console.log('ports differ')



  // so we just...
  // - make a new space.
  // - re-pair my ports.
  // uh but timers... and unfinished processes... and state...
  // let's assume we're making the smallest change we can, in a single space.
  // we can copy the state of the old space...
  // but can we copy over the processes?
  // this is a bad way of doing it.

  if(JSON.stringify(old_seed.dialect) != JSON.stringify(new_seed.dialect))  // dialect don't exist yet
    console.log('dialects differ')

  if(JSON.stringify(old_seed.state) != JSON.stringify(new_seed.state))      // seed state is just a fallthrough
    console.log('state differs')


  this.seed = new_seed
  this.tell_my_parent(new_seed)
}

D.Space.prototype.change_seed = function(seed_id) {
  // this points the space to a new seed, while maintain as much of its live state as it can
  // [usually used when modifying just one thing about the space -- don't try to do more than one]
  // space properties: state, ports, subspaces. everything else is in the seed.

  // did a subspace change? pass the word along.

  // did a port change?
    // new port: add it
    // missing port: remove it
    // one port different: transform it (somehow...) <- this is the only tricky bit, maybe

  // did my routes change? do nothing. ----> or maybe have the ports update their routes?

  // did some state change? do nothing. [live state overrides old state, and falls through otherwise]

  // did a station change? do nothing. // TODO: once you start caching processed stations by dialect, clear that cache

  // did the dialect change? do nothing. // TODO: once you start caching processed stations by dialect, clear that cache
}


// D.Space.prototype.hi_i_have_a_new_template_please_update_yourself = function(child, old_template) {
//   // this tells the parent that i have a new template so it needs to update itself and its own template
//
//   // switch all my ports from old space id to new space id
//   // make a new template based on the port mods
//   // tell my parent
//   if(!this.parent)
//     return false
// }

// D.Space.prototype.add_port = function(port) {
//   var port = new D.Port(this, port.flavour, port.settings, this.stations[port.station], port.name, port.typehint)
//   this.ports.push(port)
//
//   return this.export_and_update()
// }

// D.Space.prototype.remove_port = function(port) {
//
//   // TODO: remove the port's routes
//   return this.export_and_update()
// }
//
// D.Space.prototype.add_route = function(from_port, to_port) {
//   // TODO: check ports
//   from_port.outs.slice
//
//   return this.export_and_update()
// }
//
// D.Space.prototype.remove_route = function(from_port, to_port) {
//
//   return this.export_and_update()
// }
//
// D.Space.prototype.add_station = function(block) {
//   // TODO: check block for blockiness or get from ABLOCKS
//   // TODO: add standard station ports (in / out / error)
//
//   this.stations.push(block)
//   return this.export_and_update()
// }
//
// D.Space.prototype.remove_station = function(station) {
//   var index = this.stations.indexOf(station)
//
//   if(index == -1)
//     return D.set_error('No such station found')
//
//   // TODO: remove the station's ports
//
//   this.stations.splice(index, 1) // THINK: this won't work concurrently -- is that ok?
//   return this.export_and_update()
// }
//
// D.Space.prototype.add_space = function(space) {
//
//   return this.export_and_update()
// }
//
// D.Space.prototype.remove_space = function(index) {
//
//   return this.export_and_update()
// }
//
// D.Space.prototype.export_and_update = function(index) {
//   // yurm
//   if(this.loading)
//     return false // we're loading, no need to change
//
//
// }


// D.Space.prototype.deliver = function(message, prior_starter) {
//   // execute the block, with the message loaded in as __
//   var scope = {"__in": message} // TODO: find something better...
//   this.execute(this.block, scope, prior_starter)
// }

// TODO: move this all into a Process, instead of doing it here.
// THINK: there's no protection in here again executing multiple processes concurrently in the same space -- which is bad. find a way to bake that in. [except for those cases of desired in-pipeline parallelism, of course]
D.Space.prototype.execute = function(ablock_or_segment, scope, prior_starter, station_id) {
  var self = this
    , block = D.get_block(ablock_or_segment)

  // if(!when_done) {
  //   when_done = function(result) {
  //     // THINK: what should we do here?
  //     D.set_error("No when_done callback sent to space.execute for result: " + D.stringify(result))
  //   }
  // }

  if(this.processes.length && this.only_one_process) {
    // NOTE: we kind of need this -- it keeps all the process requests in order (using JS's event loop) and clears our closet of skeletal callstacks
    var thunk = function() {
      var result = self.real_execute(block, scope, prior_starter, station_id)
      if(result === result)
        prior_starter(result) // we're asynced, but the process didn't know it
    }

    D.setImmediate(thunk)
    // setTimeout(thunk, 0)

    // this.queue.push(function() {
    //   self.real_execute(block, scope, prior_starter, when_done)
    // })
    return NaN
  }

  return self.real_execute(block, scope, prior_starter, station_id)
}

D.Space.prototype.real_execute = function(block, scope, prior_starter, station_id) {
  var self = this
    , process
    , result
    , block = D.try_optimize(block)

  // var new_when_done = function(value) {
  //   self.cleanup(self.pid, self.last_value)
  //   if(when_done)
  //     when_done(value)
  // }

  if(!prior_starter) {
    prior_starter = function() {}
  }

  // override the prior_starter here -- THIS function is the prior starter now. (basically, remember to cleanup after yourself.)

  var my_starter = function(value) {
    self.cleanup(process)
    prior_starter(value)
  }

  process = new D.Process(this, block, scope, my_starter, station_id)
  this.processes.push(process)

  try {
    result = process.run()
    self.cleanup(process)
  } catch(e) {
    D.set_error(e.message)
    self.cleanup(process)
  }

  return result
}

D.Space.prototype.cleanup = function(process) {
  if(!process.asynced) {
    this.scrub_process(process.pid)
    // this.run_listeners(process.last_value, listeners) // THINK: is process.last_value right?
  }

  // this.run_queue()
}

D.Space.prototype.scrub_process = function(pid) {
  // OPT: store a ref or something make this faster
  for(var i=0, l=this.processes.length; i < l; i++) {
    if(this.processes[i].pid == pid) {
      var proc = this.processes[i]
      this.processes.splice(i, 1)
      break
    }
  }
}



D.try_optimize = function(block) {
  if(!D.Etc.use_optimizations) return block

  var map = D.Etc.OptimizationMap                      // THINK: a weakmap might work well here
  var block_id = block.id
  
  if(map[block_id])
    return map[block_id]
  
  for(var i=0, l=D.Optimizers.length; i < l; i++)
    block = D.Optimizers[i].fun(block)

  if(block.id != block_id) {                           // Some post-op cleanup to remove unused segments
                                                       // and subsequently rewire everything
    
    
  }
  
  map[block_id] = block
  return block
}



D.Optimizers = []
D.import_optimizer = function(name, priority, fun) {
  if( priority <= 0                                    // priority is between 0 and 1 *exclusive*
   || priority >= 1 )                                  // this means you can always fit something
      priority  = 0.5                                  // at start or end, up to float precision.
  
  var opt = { fun: fun                                 // fun takes a block as an argument and 
            , name: name                               // returns a block (same or different)
            , priority: priority }

  D.Optimizers.push(opt)
  D.Optimizers.sort(function(a, b) { return a.priority > b.priority })
}



  /*ooooooo.   ooooooooo.     .oooooo.     .oooooo.   oooooooooooo  .oooooo..o  .oooooo..o
  `888   `Y88. `888   `Y88.  d8P'  `Y8b   d8P'  `Y8b  `888'     `8 d8P'    `Y8 d8P'    `Y8
   888   .d88'  888   .d88' 888      888 888           888         Y88bo.      Y88bo.
   888ooo88P'   888ooo88P'  888      888 888           888oooo8     `"Y8888o.   `"Y8888o.
   888          888`88b.    888      888 888           888    "         `"Y88b      `"Y88b
   888          888  `88b.  `88b    d88' `88b    ooo   888       o oo     .d8P oo     .d8P
  o888o        o888o  o888o  `Y8bood8P'   `Y8bood8P'  o888ooooood8 8""88888P'  8""88888*/


D.Process = function(space, block, scope, prior_starter, station_id) {

  /*
      A Process executes a single Block from start to finish, executing each segment in turn and handling the wiring.
      Returns the last value from the Block's pipeline, or passes that value to prior_starter() and returns NaN if any segments go async.
      Each Process is used only once, for that one Block execution, and then goes away.
      A Process may launch sub-processes, depending on the segments in the Block.
  */

  this.pid = D.Etc.process_counter++
  this.starttime = Date.now()
  this.current = 0
  this.space = space
  this.block = block
  // this.when_done = when_done
  this.prior_starter = prior_starter
  this.asynced = false
  this.station_id = station_id

  var self = this
  this.my_starter = function(value) {
    self.last_value = value
    self.state[self.current] = value // TODO: fix this it isn't general
    self.current++
    self.run()
  }

  // if(scope) {
  //   scope.forEach(function(item, key) {
  //     self.state[key] = item
  //   })
  // }

  // this.state = space.state // for overriding?
  this.state = scope || {} // process-level vars, like wiring, should be local to the process



  // HACKHACKHACK
  // if(space.secret && !scope.secret) {
  //   this.state.secret = space.secret
  // }


  if(this.state['__in'] === undefined)
    this.state['__in'] = "" // ha ha jk oh wait we need this
}

D.Process.prototype.done = function() {
  // console.log(this)
  // console.trace()
  // console.log(this.block.segments)
  // console.log(this.block.wiring)

  // if(this.when_done)
  //   this.when_done(this.last_value)

  var output = this.last_value // default output

  if(this.block.wiring['*out']) {
    var outs = this.block.wiring['*out']
    if(outs.length == 1) {
      output = this.state[outs[0]]
    }
    else {
      output = []
      for(var i=0, l=outs.length; i < l; i++) {
        output.push(this.state[outs[i]]) // THINK: sometimes array sometimes not is always weird
      }
    }
  }

  output = D.make_nice(output)   // THINK: should probably do this for each possible output in the array form

  if(this.asynced) {
    this.asynced = false // ORLY??
    if(this.prior_starter)
      this.prior_starter(output)
    return undefined
  }

  return output
}

D.Process.prototype.run = function() {
  var value = ""
    , segs  = this.block.segments

  while(segs[this.current]) {
    value = this.next() // TODO: this is not a trampoline
    if(value !== value) {
      this.asynced = true
      return NaN // NaN is the "I took the callback route" signal...
    }
    this.last_value = value
    this.state[this.current] = value // TODO: fix this it isn't general
    this.current++
  }

  return this.done()
}

D.Process.prototype.next = function() {
  var segment = this.block.segments[this.current]
    , wiring = this.block.wiring

  if(!segment || !segment.type) {
    return "" // THINK: what?
    // return this.done()
  }

  var inputs = []
    , type = D.SegmentTypes[segment.type]
    , key  = segment.key || this.current

  if(wiring[key]) {
    inputs = D.nicify(wiring[key], this.state)
  }

  return type.execute(segment, inputs, this.space.dialect, this.my_starter, this)
}



   /*ooooo..o                                                                             .o8
  d8P'    `Y8                                                                            "888
  Y88bo.      oo.ooooo.   .oooo.    .ooooo.   .ooooo.   .oooo.o  .ooooo.   .ooooo.   .oooo888   .oooo.o
   `"Y8888o.   888' `88b `P  )88b  d88' `"Y8 d88' `88b d88(  "8 d88' `88b d88' `88b d88' `888  d88(  "8
       `"Y88b  888   888  .oP"888  888       888ooo888 `"Y88b.  888ooo888 888ooo888 888   888  `"Y88b.
  oo     .d8P  888   888 d8(  888  888   .o8 888    .o o.  )88b 888    .o 888    .o 888   888  o.  )88b
  8""88888P'   888bod8P' `Y888""8o `Y8bod8P' `Y8bod8P' 8""888P' `Y8bod8P' `Y8bod8P' `Y8bod88P" 8""888P'
               888
              o88*/


/*

  EVERYTHING BELOW HERE IS CRAZYPANTS

*/


/*
  Adding a new SPACESEED is complicated.
  - does it have an id?
    - remove if != hash(json)
  - do the parts check out?
    - if dialect, stations, subspaces, ports, routes or state are invalid, err
  - order all the parts
  - hash, add, and return id
*/

D.spaceseed_add = function(seed) {
  var good_props = {dialect: 1, stations: 1, subspaces: 1, ports: 1, routes: 1, state: 1}
    , item

  for(var key in seed)
    if(!good_props[key])
      delete seed[key] // ensure no errant properties, including id

  // TODO: check dialect [id -> D.DIALECTS]
  // TODO: check stations [array of id -> D.BLOCKS]
  // TODO: check subspaces [array of id -> D.SPACESEEDS]
  // TODO: check ports [array of port things]
  // TODO: check routes [array of port indices]
  // TODO: check state [a jsonifiable object] [badseeds]

  seed = D.clone(seed) // keep the ref popo off our tails
  seed = D.sort_object_keys(seed)
  seed.state = D.sort_object_keys(seed.state)


  var sorted_stations = D.clone(seed.stations).sort(function(a,b) {return a - b})
    , station_index_to_ports = {}
    , new_stations = []
    , last_offset = {}

  if(JSON.stringify(seed.stations) != JSON.stringify(sorted_stations)) {

    seed.ports.forEach(function(port) {
      var item = station_index_to_ports[port.station]
      item ? item.push(port) : station_index_to_ports[port.station] = [port]
    })

    seed.stations.forEach(function(station, index) {
      var old_index = index + 1
        , new_index = sorted_stations.indexOf(station, last_offset[station]) + 1

      if(station_index_to_ports[old_index]) {
        station_index_to_ports[old_index].forEach(function(port) {
          port.station = new_index
        })
      }

      last_offset[station] = new_index
    })

    seed.stations = sorted_stations
  }


  var sorted_subspaces = D.clone(seed.subspaces).sort(function(a,b) {return a - b})
    , space_index_to_ports = {}
    , new_subspaces = []
    , last_offset = {}

  if(JSON.stringify(seed.subspaces) != JSON.stringify(sorted_subspaces)) {

    seed.ports.forEach(function(port) {
      var item = space_index_to_ports[port.space]
      item ? item.push(port) : space_index_to_ports[port.space] = [port]
    })

    seed.subspaces.forEach(function(subspace, index) {
      var old_index = index + 1
        , new_index = sorted_subspaces.indexOf(subspace, last_offset[subspace]) + 1

      if(space_index_to_ports[old_index]) {
        space_index_to_ports[old_index].forEach(function(port) {
          port.space = new_index
        })
      }

      last_offset[subspace] = new_index
    })

    seed.subspaces = sorted_subspaces
  }


  // oh dear


  var port_sort = function(portA, portB) {
    if(portA.space != portB.space)
      return portA.space > portB.space

    if(portA.station && portA.station != portB.station)
      return portA.station > portB.station

    if(portA.subspace && portA.subspace != portB.subspace)
      return portA.subspace > portB.subspace

    return portA.name > portB.name
  }

  // ensure the right properties, in sort order
  var good_port_props = ['space', 'station', 'name', 'flavour', 'typehint', 'settings']
  var ports = seed.ports.map(function(port) {
    var newport = {}
    for(var key in good_port_props)
      newport[good_port_props[key]] = port[good_port_props[key]]
    return newport
  })
  var sorted_string_ports = ports.map(JSON.stringify).sort()
  var route_clone = D.clone(seed.routes)

  if(JSON.stringify(seed.ports) != JSON.stringify(sorted_string_ports)) {
    // go through each item, find its match and modify all containing routes

    var port_index_to_routes = {}

    route_clone.forEach(function(route, index) {
      route.index = index

      item = port_index_to_routes[route[0]]
      item ? item.push(route) : port_index_to_routes[route[0]] = [route]

      item = port_index_to_routes[route[1]]
      item ? item.push(route) : port_index_to_routes[route[1]] = [route]
    })

    ports.forEach(function(port, index) {
      var port = ports[index]
        , old_index = index + 1 // +1 for offset array indices
        , new_index = sorted_string_ports.indexOf(JSON.stringify(port)) + 1

      if(port_index_to_routes[old_index]) {
        port_index_to_routes[old_index].forEach(function(route) {
          if(route[0] == old_index)
            seed.routes[route.index][0] = new_index
          if(route[1] == old_index)
            seed.routes[route.index][1] = new_index
        })
      }
    })

  }
  seed.ports = sorted_string_ports.map(JSON.parse)

  // these we can just sort. phew!
  seed.routes.sort(function(routeA, routeB) {
    if(routeA[0] != routeB[0])
      return routeA[0] > routeB[0]

    return routeA[1] > routeB[1]
  })

  seed.id = D.spaceseed_hash(seed)
  D.SPACESEEDS[seed.id] = seed // THINK: collision resolution?

  return seed.id
}

D.spaceseed_hash = function(seed) {
  return murmurhash(JSON.stringify(seed))
}


D.make_some_space = function(stringlike, templates) {
  try {
    return D.make_spaceseeds(D.seedlikes_from_string(stringlike, templates))
  }
  catch (e) {
    D.set_error("Sorry, but that space has some problems: " + e.message)
    return {}
  }
}

D.seedlikes_from_string = function(stringlike, templates) {
  var seedlikes = {}
    , seed_offset = -1
    , prop_offset = -1
    , seed_name = ''
    , this_seed = {}
    , continuation = ''
    , action = ''
    , action_name = ''
    , templates = templates || {}

  // THINK: if we use parser combinators, can we uncombinate in reverse to get back our string?
  // first break it apart by lines and organize into seedlikes

  stringlike+="\n" // catches unfinished continuations

  // prescan to fix split lines
  // "aaaaaaandy\naaaaasdf\n\aaakj32".replace(RegExp('\na{' + n + ',}', 'gm'), ' ')
  // THINK: the above would work instead of relying on the ordering complexity below... but we'd need to get prop_offset *before* starting the forEach, so multiple passes. which might not be that bad. though we'd also miss out on saving the multiline blocks, but maybe that doesn't matter?

  stringlike.split("\n").forEach(function(line) {
    var this_offset = line.length - line.replace(/^\s+/,'').length
      , name='', value=''

    line = line.replace(/^\s+|\s+$/g, '')
    if(!line)
      return

    if(line[0] == '/')
      return

    if(seed_offset < 0)
      seed_offset = this_offset

    if(this_offset != seed_offset) {
      if(prop_offset < 0) {
        prop_offset = this_offset
      }

      if(this_offset > prop_offset && line.indexOf('->') == -1) {
        continuation += " " +line
        return
      }
    }

    if(action) {
      continuation = continuation.replace(/^\s+|\s+$/g, '')

      if(action == 'dialect') {
        try {this_seed.dialect = JSON.parse(continuation)} catch(e) {}
      }

      if(action == 'port') {
        value = continuation ? continuation.split(/\s+/) : [action_name]
        this_seed.ports[action_name] = value //.map(function(item) {return item.replace(/^\s+|\s+$/g, '')})
      }

      if(action == 'state') {
        try {this_seed.state[action_name] = JSON.parse(continuation)} catch(e) {}
      }

      if(action == 'station') {
        if(!continuation && templates[action_name])
          continuation = templates[action_name]
        this_seed.stations[action_name] = {value: continuation}
      }

      continuation = ''
      action = ''
    }

    if(this_offset == seed_offset) {
      if(seed_name) {
        if(seedlikes[seed_name]) {
          D.recursive_extend(seedlikes[seed_name], this_seed)
        } else {
          seedlikes[seed_name] = this_seed
        }
      }

      seed_name = line
      this_seed = {ports:{}, state:{}, routes:[], dialect:{}, stations:{}, subspaces:{}}

      return
    }

    continuation = line

    if(line[0] == '{') {
      action = 'dialect'
      return
    }

    name = line.split(' ', 1)[0]
    continuation = line.slice(name.length).replace(/^\s+|\s+$/g, '')

    if(name[0] == '@' && line.indexOf('->') == -1) {
      action_name = name.slice(1)
      action = 'port'
      return
    }

    if(name[0] == '$') {
      action_name = name.slice(1)
      action = 'state'
      return
    }

    if(continuation[0] == '{' || line.indexOf('->') == -1) {
      action_name = name
      action = 'station'
      return
    }

    continuation = ''
    action = ''

    if(/->/.test(line)) {
      // THINK: should this use continuations also?

      var route = []
      line.split('->').forEach(function(part, index) {
        part = part.replace(/^\s+|\s+$/g, '')

        if(part[0] == '{') {
          var fakename = 'station-' + Math.random().toString().slice(2)
          this_seed.stations[fakename] = {value: part}
          part = fakename
        }

        if(part[0] == '@') {
          route.push(part.slice(1)) // direction doesn't matter for ports
        }
        else if(part.indexOf('.') >= 0) { // subspace, or station?
          var split = part.split('.', 2)
            , name = split[0]
            , port = split[1]

          // THINK: this implies you can't have like-named stations and spaces
          if(this_seed.stations[name]) {
            this_seed.stations[name].extraports = this_seed.stations[name].extraports
                                                ? this_seed.stations[name].extraports.concat([port])
                                                : [port]
          } else {
            this_seed.subspaces[name] = name // TODO: foo.in, foo-1.in, foo-2.in, etc
          }
          route.push(part) // THINK: for a station port this is always 'out' (or down)
        }
        else { // station dir matters
          if(!route.length)
            route.push(part + '.out')
          else {
            route.push(part + '.in')
            // TODO: ensure pushed route isn't null,null
            if(!route[0] || !route[1]) {
              D.set_error('Port not found in line: ' + line)
              route = []
            }
            else {
              this_seed.routes.push(route)
              route = [part + '.out']
            }
          }
        }

        // TODO: lists should create complete N-partite graphs: (@in1 @in2) -> (s1 s2) -> (@out1 @out2)

        if(route.length == 2) {
          // TODO: ensure pushed route isn't null,null
          if(!route[0] || !route[1])
            D.set_error('Port not found in line: ' + line)
          else
            this_seed.routes.push(route)

          route = []
        }
      })

      return
    }
  })

  if(JSON.stringify(this_seed) != JSON.stringify({ports:{}, state:{}, routes:[], dialect:{}, stations:{}, subspaces:{}})) {
    if(seedlikes[seed_name]) {
      D.recursive_extend(seedlikes[seed_name], this_seed)
    } else {
      seedlikes[seed_name] = this_seed
    }
  }
    // seedlikes[seed_name] = this_seed

  return seedlikes
}

D.make_spaceseeds = function(seedlikes) {
  var seedmap = {}
    , newseeds = {}

  for(var seedkey in seedlikes) {
    var seed = seedlikes[seedkey]
      , ports = seed.ports || {}
      , state = seed.state || {}
      , routes = seed.routes || []
      , dialect = seed.dialect || {}
      , stations = seed.stations || {}
      , subspaces = seed.subspaces || {}
      , newseed = {}

    newseed.state = state // TODO: check state
    newseed.dialect = dialect // TODO: check dialect

    var port_key_to_index = {}
    newseed.ports = []
    for(var key in ports) {
      newseed.ports.push({flavour: ports[key][0], settings: {thing: (ports[key][1] || key), all: ports[key].concat(key)}, name: key }) // TODO: oh dear this should not be
      port_key_to_index[key] = newseed.ports.length // note 1-indexed
    }

    var station_key_to_index = {}
    newseed.stations = []
    for(var key in stations) {
      newseed.stations.push(D.Parser.string_to_block_segment(stations[key].value).value.id) // block id
      var index = newseed.stations.length // note 1-indexed
      station_key_to_index[key] = index
      // add my ports
      port_key_to_index[key + '.in'] = newseed.ports.push({flavour: 'in', name: '_in', station: index})
      port_key_to_index[key + '.out'] = newseed.ports.push({flavour: 'out', name: '_out', station: index})
      port_key_to_index[key + '.err'] = newseed.ports.push({flavour: 'err', name: '_error', station: index})
      // any extras?
      if(stations[key].extraports) {
        var extras = stations[key].extraports
        for(var i=0, l=extras.length; i < l; i++) {
          port_key_to_index[key + '.' + extras[i]] = newseed.ports.push({flavour: 'out', name: extras[i], station: index})
        }
      }
    }

    var subspace_key_to_index = {}
    newseed.subspaces = []
    for(var key in subspaces) {
      var spacekey = subspaces[key]
      newseed.subspaces.push(seedmap[spacekey]) // space id // TODO: error if not in seedmap

      var index = newseed.subspaces.length // note 1-indexed
      subspace_key_to_index[key] = index

      // add subspace ports
      for(var portkey in seedlikes[spacekey].ports) {
        var subport = newseeds[spacekey].ports.filter(function(port) {return port.name == portkey})[0]
        newseed.ports.push({space: index, flavour: subport.flavour, name: subport.name, settings: subport.settings}) // oy vey
        port_key_to_index[key + '.' + portkey] = newseed.ports.length // note 1-indexed
      }
    }

    newseed.routes =
      routes.map(function(route) {
        var one = port_key_to_index[route[0]]
          , two = port_key_to_index[route[1]]

        if(!one)
          D.set_error('Invalid route: ' + route[0])
        if(!two)
          D.set_error('Invalid route: ' + route[1])

        if(!one || !two)
          return []

        return [one, two]
        // newseed.routes.push([port_key_to_index[route[0]], port_key_to_index[route[1]]])
      })

    newseed.routes = newseed.routes
                            .filter(function(route) {
                              return route.length
                            })

    newseeds[seedkey] = newseed
    seedmap[seedkey] = D.spaceseed_add(newseed)
  }

  // console.log(seedmap)

  return seedmap['outer'] || seedmap[seedkey]
}


// TODO: tab detection




// FIRE IT UP


D.DIALECTS.top = new D.Dialect() // no params means "use whatever i've imported"

D.ExecutionSpace =
  new D.Space(
    D.spaceseed_add(
      {dialect: {commands:{}, aliases:{}}, stations: [], subspaces: [], ports: [], routes: [], state: {}}))

