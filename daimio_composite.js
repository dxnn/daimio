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
  return value || value == false                // not NaN, null, or undefined
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

  if(!key) key = Object.keys(total).length
  
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
  for(var i=0, l=list.length; i < l; i++) {
    var item = state[list[i]]    
    result.push( D.is_nice(item) ? item : null )                    // THINK: why null?
  }
  return result
}

D.filter_ports = function(ports, station, name) {
  for(var i=0, l=ports.length; i < l; i++) {
    var port = ports[i]
    if( port.station === station                                    // triple so undefined !== 0
     && port.name    === name ) 
        return port
  }
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
    D.setImmediate(function() { 
      for(var i=0, l=outs.length; i < l; i++) {
        outs[i].enter(ship)
      }
      // outs.forEach(function(port) { port.enter(ship) }) 
    })
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
                              : [key] }
  
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
        && segment.value.method != 'run'                 // two commands are also side-effect based...
        && segment.value.method != 'sleep' ))            // FIXME: find a nice way to deal with that
           continue
    
    for(var i=0, l=my_wires.length; i < l; i++) {
      if(!temp_wiring[my_wires[i]])
        temp_wiring[my_wires[i]] = []
      while((input_index = wiring[my_wires[i]].indexOf(my_key, input_index+1)) != -1)
        temp_wiring[my_wires[i]][input_index] = index }
    
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
  var block    = D.BLOCKS[block_id]
  var out_port = D.filter_ports(this.ports, station_id, '_out')
  
  if(!out_port)
    return D.set_error('That out port is unavailable')
              
  var prior_starter =                                               // THINK: we're jumping straight to exit here. 
        function(value) {out_port.exit(value)}                      // also do it for implicit station output ports...
  var scope = {"__in": ship}                                        // TODO: find something better...
  var value = this.execute(block, scope, prior_starter, station_id)

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

  var result = this.try_execute(process)
  this.cleanup(process)
  return result
}

D.Space.prototype.try_execute = function(process) {
  try {
    return process.run()
  } catch(e) {
    D.set_error(e.message)
  }
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
  D.Optimizers.sort(function(a, b) { return a.priority - b.priority })
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
    self.state[self.current] = value                            // TODO: fix this it isn't general
    self.current++
    self.run()
  }

  this.state = scope || {}                                      // process-level vars, like wiring,
                                                                // should be local to the process
  if(this.state['__in'] === undefined)
    this.state['__in'] = ""                                     // ha ha jk oh wait we need this
}

D.Process.prototype.done = function() {
  var output = this.last_value                                  // default output
                                                                    
  if(this.block.wiring['*out']) {                               // THINK: this isn't currently used anywhere...
    var outs = this.block.wiring['*out']
    if(outs.length == 1) {
      output = this.state[outs[0]]
    }
    else {
      output = []
      for(var i=0, l=outs.length; i < l; i++) {
        output.push(this.state[outs[i]])                        // THINK: sometimes array sometimes not is always weird
      }
    }
  }

  output = D.make_nice(output)                                  // THINK: should probably do this for each 
                                                                // possible output in the array form
  if(this.asynced) {
    this.asynced = false                                        // ORLY??
    if(this.prior_starter)
      this.prior_starter(output)
    return undefined
  }

  return output
}

D.Process.prototype.run = function() {
  var value = ""
  var segs  = this.block.segments
  var wires = this.block.wiring
  var dialect = this.space.dialect
  var current = this.current
  var segment = segs[current]

  while(segment) {
    value = this.next(segment, current, wires, dialect)             // TODO: this is not a trampoline
    if(value !== value) {
      this.current = current
      this.asynced = true
      return NaN                                                    // NaN is the "I took the callback route" signal...
    }
    this.last_value = value
    this.state[current] = value                                     // TODO: fix this it isn't general
    current++
    segment = segs[current]
  }

  return this.done()
}

D.Process.prototype.next = function(segment, current, wires, dialect) {
  var type = D.SegmentTypes[segment.type]
  var key  = segment.key || current
  var wire = wires[key]

  var inputs = wire ? D.nicify(wire, this.state) : []

  return type.execute(segment, inputs, dialect, this.my_starter, this)
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
  
  // TODO: tab detection and elimination

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



// SPACE ELVES

D.get_templates = function(template_attr) {
  template_attr    = template_attr || 'data-daimio-template'
  var template_els = document.querySelectorAll('[' + template_attr + ']')

  return [].reduce.call(template_els, function(acc, template) {
           var name  = template.attributes.getNamedItem(template_attr).value
           acc[name] = template.innerHTML .replace(/ \| &gt;/g, ' | >') // FIXME: this is super dumb
           template.innerHTML = ""
           return acc
         }, {})
}

D.get_seedlikes = function(seedlike_class) {
  seedlike_class   = seedlike_class || 'spaceseeds'
  var seedlike_els = document.getElementsByClassName(seedlike_class)
  
  return [].map.call(seedlike_els, function(node) {
            return node.text
         }).join("\n")
}

D.make_me_a_space_as_fast_as_you_can = function(seedlike_class, template_attr) {
  var templates = D.get_templates(seedlike_class)
  var seedlikes = D.get_seedlikes(template_attr)
  var outerseed = D.make_some_space(seedlikes, templates)
  document.getElementsByTagName('body')[0].style.display = ''         // invisible body prevents fouc
  return new D.Space(outerseed)
}



// FIRE IT UP


D.DIALECTS.top = new D.Dialect() // no params means "use whatever i've imported"

D.ExecutionSpace =
  new D.Space(
    D.spaceseed_add(
      {dialect: {commands:{}, aliases:{}}, stations: [], subspaces: [], ports: [], routes: [], state: {}}))

D.SegmentTypes.Terminator = {
  try_lex: function(string) {
    return string // THINK: hmmmm.... these are made elsewhere. what are we doing??
  }
, extract_tokens: function(L, token, R) {
    // LE COMMENTS
    if(/^\//.test(token.value)) {
      if(/^\/\//.test(token.value)) {
        return [L, []] // double slash comment goes to end of pipe
      }
      R.shift() // a single slash comment just pops the next segment off
    }

    // LE ARROW
    if(/^→/.test(token.value)) {
      var next = R[0]
        , prev = L[L.length - 1]

      if(!next || !prev)
        return [L, R] // if we aren't infix, don't bother

      var new_token = new D.Token('Command', 'channel bind')
      new_token.names = ['from', 'to']
      new_token.inputs = [prev.key, next.key]
      
      return [L, [next, new_token].concat(R.slice(1))]
    }

    // LE PIPE
    if(/^\|/.test(token.value)) {
      var next = R[0]
        , prev = L[L.length - 1]

      /*
        Pipes connect the next and prev segments.
        Double pipes don't change the wiring.
        Double pipe at the end cancels output.
      */


      // TODO: what if 'next' is eg a comment?
      // TODO: double pipe means something different
      // TODO: pipe at beginning / end (double pipe at end is common)

      // set the prevkey
      if(next) {
        if(prev) {
          next.prevkey = prev.key
        } else {
          next.prevkey = '__in' // THINK: really? this only applies to  {| add __} which is weird and stupid
        }
      }

      // bind the segments
      if(/^\|\|/.test(token.value)) { // double pipe
        if(!next) {
          R = [new D.Token('String', "")] // squelch output by returning empty string
        }
      }
      else if(next && prev) {
        // if(next.value.params) {
        //   next.value.params['__pipe__'] = prev.key
        // }
        
        if(next.type == 'Command') {
          next.names = next.names || [] // TODO: fix me this is horrible
          next.inputs = next.inputs || []
          next.names.push('__pipe__')
          next.inputs.push(prev.key)
          // next.params['__pipe__'] = new D.Segment('Input', prev.key)      
          // return [L, R]
        }
        
      }
    }

    return [L, R]
  }
, token_to_segments: function(token) {
    return []
    // this shouldn't happen
  } 
, execute: function(segment) {
    // nor this
  }
}
D.SegmentTypes.Number = {
  try_lex: function(string) {
    return (+string === +string) // NaN !== NaN
        && !/^\s*$/.test(string) // +" " -> 0
         ? new D.Token('Number', string) 
         : string
  }
, token_to_segments: function(token) {
    return [new D.Segment('Number', +token.value, token)]
  } 
, execute: function(segment) {
    return segment.value
  }
}
D.SegmentTypes.String = {
  try_lex: function(string) {
    if(string[0] != '"' || string.slice(-1) != '"')
      return string    

    if(string.indexOf(D.Constants.command_open) != -1)
      return string

    return new D.Token('String', string.slice(1, -1))
  }
, token_to_segments: function(token) {
    return [new D.Segment('String', token.value, token)]
  }
, execute: function(segment) {
    return segment.value
  }
}
D.SegmentTypes.Block = {
  try_lex: function(string) {
    if(string[0] != '"' || string.slice(-1) != '"')
      return string    

    if(string.indexOf(D.Constants.command_open) == -1)
      return string

    return new D.Token('Block', string.slice(1, -1))
  }
, token_to_segments: function(token) {
    var segment = D.Parser.string_to_block_segment(token.value)
    segment.key = token.key
    return [segment]
  }
, toJSON: function(segment) {
    var block_id = segment.value.id
      , decorators = D.get_decorators(block_id, 'OriginalString')
      
    if(decorators) {
      return decorators[0].value
    }
    
    return ""
  }
, execute: function(segment, inputs, dialect, prior_starter) {
    return segment
  }
}
// puts together discrete segments, or something
D.SegmentTypes.Blockjoin = {
  try_lex: function(string) {
    return string
    // these probably never get lexed
  }
, token_to_segments: function(token) {
    return [new D.Segment('Blockjoin', token.value, token)]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var output = ""
      , counter = 0
    
    if(!inputs.length)
      return ""

    var processfun = function(value) {
      return D.execute_then_stringify(value, {}, process)
    }

    return D.data_trampoline(inputs, processfun, D.string_concat, prior_starter)
  }
}
D.SegmentTypes.Pipeline = {
  try_lex: function(string) {
    if(string[0] != D.Constants.command_open || string.slice(-1) != D.Constants.command_closed)
      return string

    return new D.Token('Pipeline', string)
  }
, munge_tokens: function(L, token, R) {
    var new_tokens = D.Parser.string_to_tokens(token.value)
    
    var last_replacement = new_tokens[new_tokens.length - 1]
    
    if(!last_replacement){
      // D.set_error('The previous replacement does not exist')
      return [L, R]
    }
    
    last_replacement.key = token.key
    // last_replacement.prevkey = token.prevkey
    // last_replacement.position = token.position
    // last_replacement.inputs.concat(token.inputs)
    // last_replacement.names.concat(token.names)
    
    // if(new_tokens.length)
    //   new_tokens[0].position = true
    
    return [L, new_tokens.concat(R)] // NOTE: the new tokens are *pre* munged, and shouldn't contain fancy segments 
    
  }
, token_to_segments: function(token) {
    // shouldn't ever get here...
    return []
  }
, execute: function(segment) {
    // shouldn't ever get here
  }
}
D.SegmentTypes.List = {
  try_lex: function(string) {
    if(string[0] != '(' || string.slice(-1) != ')')
      return string

    return new D.Token('List', string.slice(1, -1))
  }
, munge_tokens: function(L, token, R) {
    if(token.done)
      return [L.concat(token), R]
  
    var new_token_sets = D.Parser.split_on_space(token.value)
                                    .map(D.Parser.strings_to_tokens)

    if(!new_token_sets.length)
      return [L.concat(token), R]
      
    token.inputs = token.inputs || []
    token.done = true
    
    // it's important to only take inputs from the last token to prevent double linking of nested lists and pipelines
    for(var i=0, l=new_token_sets.length; i < l; i++) {
      var last_new_token_from_this_set_oy_vey = new_token_sets[i][new_token_sets[i].length - 1]
      if(last_new_token_from_this_set_oy_vey && last_new_token_from_this_set_oy_vey.key)
        token.inputs.push(last_new_token_from_this_set_oy_vey.key)
    }
    
    var new_tokens = new_token_sets.reduce(D.concat, [])

    /* what we need here:
       - all 'top' magic pipes point to previous segment
       - except magic pipes in pipelines
       
       
    */

    for(var i=0, l=new_tokens.length; i < l; i++) {
      if(!new_tokens[i].prevkey)
        new_tokens[i].prevkey = token.prevkey
    }

    return [L, new_tokens.concat(token, R)]
  }
, token_to_segments: function(token) {
    return [new D.Segment('List', [], token)]
  }
, execute: function(segment, inputs) {
    return inputs
  }
}
D.SegmentTypes.Fancy = {
  try_lex: function(string) {
    // var regex = new RegExp('^[' + D.FancyGlyphs + ']') // THINK: would anything else ever start with a fancy glyph?

    if(D.Etc.FancyRegex.test(string)) 
      return new D.Token('Fancy', string)

    return string
  }
, munge_tokens: function(L, token, R) {
    // var glyph = token.value.slice(0,1)
    var glyph = token.value.replace(/^([^a-z0-9.]+).*/i, "$1")
  
    if(!D.Fancies[glyph]) {
      D.set_error('Your fancies are borken:' + glyph + ' ' + token.value)
      return [L, R]
    }

    var new_tokens = D.Fancies[glyph].eat(token)
      , last_replacement = new_tokens[new_tokens.length - 1]
    
    if(last_replacement) {
      var token_key = token.key
        , token_prevkey = token.prevkey
      
      new_tokens.filter(function(token) {return token.key == token_key})
                .forEach(function(token) {token.key = last_replacement.key})
                                          // token.prevkey = last_replacement.prevkey})

      new_tokens = new_tokens.map(function(token) {
        if(token.inputs)
          token.inputs = token.inputs.map(function(input) {return input == token_key ? last_replacement.key : input})
        return token
      })

      last_replacement.key = token_key
      // last_replacement.prevkey = token_prevkey
    }
    
    return [L, new_tokens.concat(R)] 
    // NOTE: the new tokens are *pre* munged, and shouldn't contain fancy segments [erp nope!]
    // THINK: but what about wiring???
  }
, token_to_segments: function(token) {
    // you shouldn't ever get here
  }
, execute: function(segment) {
    // or here
  }
}
D.SegmentTypes.VariableSet = {
  try_lex: function(string) {
    return string // this is never lexed
  }
, munge_tokens: function(L, token, R) {
    if(L.length)
      token.inputs = [L[L.length-1].key]
    return [L.concat(token), R]
  }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, munge_segments: function(L, segment, R) {
    var type = segment.value.type
      , name = segment.value.name
      , my_key = segment.key
      , new_key = segment.inputs[0]
      , key_index

    if(type == 'space')                                 // space vars have to be set at runtime
      return [L.concat(segment), R]

    if(!R.length && !L.length) {                        // final pipeline var sets [e.g. {__ | >foo} ] become __
      segment.type = 'PipeVar'
      segment.prevkey = false
      return [L, [segment].concat(R)]
    }

    R.filter(function(future_segment) {                 // other pipeline vars can be converted into wiring
        return future_segment.type == 'Variable'
            && future_segment.value.name == name })
     .forEach(function(future_segment) {                // TODO: this doesn't catch {2 | >foo | >foo}
       if(future_segment.value.prevkey)
         return D.set_error('Pipeline variables may be set at most once per pipeline')
       future_segment.value.prevkey = new_key
     })

    R.forEach(function(future_segment) {                // future inputs convert to wiring also
      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = new_key
      if(future_segment.prevkey == my_key)              // and prevkey, which keeps __ happy
        future_segment.prevkey = new_key
    })

    return [L, R]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var state = process.space.state
      , name  = segment.value.name

    // state[name] = inputs[0] // OPT: only copy if you have to

    state[name] = D.clone(inputs[0])
    // state[name] = D.deep_copy(inputs[0]) // NOTE: we have to deep copy here because cloning (via JSON) destroys blocks...

    return inputs[0]
  }
}
D.SegmentTypes.PortSend = {
  // THINK: surely there's some other way to do this -- please destroy this segtype
  try_lex: function(string) {
    return string // this is never lexed
  }
, munge_tokens: function(L, token, R) {
    if(L.length)
      token.inputs = [L[L.length-1].key]
    return [L.concat(token), R]
  }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var to  = segment.value.to
    var my_station = process.station_id
    var port = D.filter_ports(process.space.ports, my_station, to)

    // TODO: check not only this station but outer stations as well, so we can send to ports from within inner blocks. but first think about how this affects safety and whatnot

    if(port) {
      if(my_station === undefined) { // HACK
        port.enter(inputs[0], process) // weird hack for exec spaces
      } else {
        port.exit(inputs[0], process)
      }
    }
    else {
      D.set_error('Invalid port "' + to + '" detected')
    }

    return inputs[0]
  }
}
D.SegmentTypes.Variable = {
  try_lex: function(string) {
    return string // this is never lexed
  }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, munge_segments: function(L, segment, R) {
    if(segment.value.type == 'space')             // space vars have to be collected at runtime
      return [L.concat(segment), R]               
                                                  
    var my_key = segment.key                      
      , new_key = segment.value.prevkey           
      , key_index                                 
                                                  
    if(!new_key && !R.length)                     // some pipeline vars have to be collected then too
      return [L.concat(segment), R]               //   -> this handles {_value | add 1}
                                                  
    if(!R.length) {                               //   -> this handles {2 | >foo | "" | _foo}
      segment.inputs = [new_key]                  
      return [L.concat(segment), R]               
    }                                             

    if(!new_key)
      new_key = segment.value.name

    R.forEach(function(future_segment) {          // but others can be converted into wiring
      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = new_key
    })

    return [L, R]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var type = segment.value.type
      , name = segment.value.name
      , value = ''
      , clone = true                // OPT: figure when this can be false and make it that way

    if(type == 'space')
      value = process.space.get_state(name)
    else if(inputs && inputs.length)
      value = inputs[0]
    else if(type == 'pipeline')     // in cases like "{__}" or "{_foo}" pipeline vars serve as placeholders,
      value = process.state[name]   // because we can't push those down to bare wiring. [actually, use __out]

    if(!D.is_nice(value))
      return false

    // return value // OPT: cloning each time is terrible
    return D.clone(value)
    // return D.deep_copy(value) // NOTE: we have to deep copy here because cloning (via JSON) destroys blocks...
  }
}
D.SegmentTypes.PipeVar = {
  try_lex: function(string) {
    return string // these are always created as Fancy tokens
  }
// , munge_tokens: function(L, token, R) {
//     return [L.concat(token), R]

    // if(token.value == '__') {
      // return [L.concat(token), R]
      // if(L.length || R.length)

      // __ is the last token in the pipeline
      // token.type = 'Command'
      // token.value = 'variable get name "__in" type :pipeline' // THINK: this is pretty weird
      // return [L, [token].concat(R)]
    // }

    // ceci n'est pas une pipe magique

    /*

      We have to munge this here instead of during Fancyization because we need L and R to distinguish the following cases (which we aren't doing yet but should).

      CASE 1: {(1 2 3) | >_a | (_a _a _a)}
        --> TODO: compile _a into the wiring

      CASE 2: {* (:a 1 :b 2) | merge block "{_a} x {_b}"}
        --> have to use {var get} to collect the values at runtime instead of compiling them into the wiring,
            because this use reflects the shape of the data rather than an arbitrary intermediate label


    ACTUALLY...
      { 111 | *>a | (*a *a *a) }

      { 111 | __pipe }                          | > these both are shortened to __
      { (1 1 1) | each block "{__in}" }         | > but they mean different things

      so what IS a pipeline var?
      --> the above becomes [{N: 111}, {LIST}], {1: [0,0,0]} for segments,wiring
      - what about the "{__}" case?   does [{PLACEHOLDER}], {0: [__in]} make sense? is this crazy?
        or [{scope: __in}] or something? we can wire it from the scope, but... oh, yeah. placeholder. oy.
        this: {* (:a 1 :b 2) | (__) | map block "{_a}"} is actually pretty viable...
      - but how do we keep them from being mutated?
        ... maybe stringify, then compare the var to the cached stringified version each time... still painful, but slightly less allocating? yuck yuck yuck. if we knew *which* commands mutated this wouldn't be an issue -- can we do that? it's only an issue if the command mutates AND the value is piped to multiple places (and if only one mutates you could in theory do that last). maybe we can do that. put a 'mutates' flag on the param...
      - this is going to be REALLY painful...

    */



//    var name = token.value.slice(1)
//
//    token.type = 'Variable'
//    token.value = {type: 'pipeline', name: name}
//    // token.type = 'Command'
//    // token.value = 'variable get name "' + name + '" type :pipeline'
//
//    return [L.concat(token), R]
//    // return [L, [token].concat(R)]
  // }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, munge_segments: function(L, segment, R) {
    var my_key = segment.key
      , new_key = segment.prevkey || '__in'

    // handles cases like "{__}"
    if(  segment.value == '__in'
      || (!R.length && segment.prevkey == '__in')
      || (!R.length && !segment.prevkey))
        { segment.type = 'Variable'
          segment.value = {type: 'pipeline', name: '__in'}
          return [L.concat(segment), R] }

    R.forEach(function(future_segment) {
      var pipe_index = future_segment.names.indexOf('__pipe__')
        , this_key = new_key
        , key_index

      // this is to handle our strangely done aliases           // THINK: really only for those?
      if(    new_key    != '__in'                               // not 'first'
          && pipe_index != -1                                   // is piped
          && my_key     != future_segment.inputs[pipe_index])   // and not piped to this pipevar (?)
        this_key = future_segment.inputs[pipe_index]            // then keep on piping

      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = this_key

      // handles the weird case of {(1 2 3) | map block "{__ | __}"}
      // and the case of {( 0 1 ) | map block "{__ | then 1 else 0}"}
      if(future_segment.type == 'PipeVar' && future_segment.prevkey == my_key)
        future_segment.prevkey = new_key
    })

    return [L, R]


    // D.replumb(R, new_key, function(future_segment, input) {
    // })


    //   , outputs = R.filter(function(segment) {
    //                         return segment.inputs.indexOf(my_key) != -1
    //                       })
    //
    // if(!segment.prevkey) { // first in our class
    //   // console.log(segment, 'yo!!!')
    //   new_key = '__in'
    // }

    // this is a magic pipe

    /*
      CASES:
        1: {__ | ...}

        2: {2 | __}

        3: {3 | __ | ...}

        4: {__}

        5: {(__)}

        NOPE: 1, 4 and 5 are all the same case -- they access the process input. 2 and 3 are the normal case of passing along the previous segment value.

        NEW RULES!
        2, 3 and 5 always grab the previous segment value
        1 and 4 are process input IF they're in quotes, otherwise psv

    */


    // if(!outputs.length) { // nothing to do
    //   return [L, R]
    // }

    // else {
    //   // get the previous *top* segment's key
    //   for(var i=L.length-1; i >= 0; i--) {
    //     if(L[i].top) {
    //       new_key = L[i].key
    //       break
    //     }
    //   }
    //
    //   if(new_key === segment.value) {
    //     if(L.length) {
    //       new_key = L[L.length-1].key // THINK: first segment doesn't get marked as top, so we grab it here anyway
    //     } else {
    //       new_key = '__in' // nothing prior to __ so we give it __in for Process operating context
    //     }
    //   }
    // }

    // then replace our key with the previous key
//    outputs.forEach(function(future_segment) {
//      var pipe_index = future_segment.names.indexOf('__pipe__')
//        , this_key = new_key
//        , key_index
//
//      if(    new_key    != '__in'    // not 'first'
//          && pipe_index != -1       // is piped
//          && my_key     != future_segment.inputs[pipe_index])  // not piped to pipevar
//      {
//        this_key = future_segment.inputs[pipe_index]            // then keep on piping (mostly for aliases)
//      }
//
//      while((key_index = future_segment.inputs.indexOf(my_key)) != -1) {
//        future_segment.inputs[key_index] = this_key
//        // segment.inputs[key_index] =  new_key
//      }
//
//      // TODO: make this work for multiple connections (can those exist? [yes they can])
//    })

    // OPT: do this in a single pass, dude
  }
, execute: function(segment) {}
}
~function() {
  
  // HELPER FUNS

  function build_paramlist(segment, method, inputs) {
    var piped  = false
    var typefun
    var paramlist = []
      
    for(var index in method.params) {                                   // build paramlist from inputs and typefuns
      var method_param = method.params[index]
      // var param_value = undefined
      var key = method_param.key
      var name_index = segment.value.names.indexOf(key)
      var paramlist_obj = {key: -1}

      if(name_index != -1) {
        paramlist_obj.key = name_index
        // param_value = inputs[name_index]
      }

      if( !piped 
       && ( paramlist_obj.key === -1
         || inputs[paramlist_obj.key] === null ) ) {                    // make map of names to inputs
        name_index = segment.value.names.indexOf('__pipe__')
        piped = true
        if(name_index != -1) {
          paramlist_obj.key = name_index
          // param_value = inputs[name_index]
        }
      
        // ok, so. if the alias has a dangling param, and we snip it, then we map name to a different place.
        // that's not good, because if we run this again we might have that value the next time, 
        // and we'll need to remap the inputs all over again. yuck yuck stupid stupid.
        // 
      
      }

      if(method_param.type && D.Types[method_param.type])               // make map of names to types+wrapper
        paramlist_obj.typefun = D.Types[method_param.type]
      else
        paramlist_obj.typefun = D.Types.anything

      if(paramlist_obj.key == -1) {
        // if(param_value !== undefined) {
          // param_value = typefun(param_value)
        // }
        if(method_param.fallback) {
          paramlist_obj.value = paramlist_obj.typefun(method_param.fallback)
          // param_value = typefun(method_param.fallback)
        }
        else if(method_param.required) {
          if(!segment.errors)
            segment.errors = []
          var error = 'Missing required parameter "' + method_param.key 
                    + '" for command "' + segment.value.handler 
                    + " " + segment.value.method + '"'
          segment.errors.push(error)
          // param_value = typefun(undefined)
          paramlist_obj.value = paramlist_obj.typefun(undefined)
        }
        else if(!method_param.undefined) {
          // param_value = typefun(undefined)
          paramlist_obj.value = paramlist_obj.typefun(undefined)
        }
      }

      // params.push(param_value)
      paramlist.push(paramlist_obj)
    }
    
    return paramlist
  }
  
  function prep_params(paramlist, inputs) {
    var params = []
    for(var i=0, l=paramlist.length; i < l; i++) {
      var pfunk = paramlist[i]
      var pval  = pfunk.key == -1
                ? pfunk.value
                : pfunk.typefun(inputs[pfunk.key])                  // we have to do this part at runtime

      params.push(pval)
    }
    return params
  }
  
  function run_fun(segment, inputs, prior_starter, process) {
    if(segment.errors) {
      segment.errors.forEach(function(error) {D.set_error(error)})
      return ""                                                     // THINK: maybe {} or {noop: true} or something
    }                                                               // so false flows through instead of previous value
    
    var params = prep_params(segment.paramlist, inputs)
    params.push(prior_starter)
    params.push(process)
    return segment.method.fun.apply(
             segment.handler, 
             params)
  }

  // MAIN STUFF

  D.SegmentTypes.Command = {
    try_lex: function(string) {
      if(!/[a-z]/.test(string[0]))                                  // TODO: move all regexs into D.Constants
        return string

      return new D.Token('Command', string)
    }
  , munge_tokens: function(L, token, R) {
      if(token.done)
        return [L.concat(token), R]
      
      var items = D.Parser.split_on_space(token.value)
        , new_tokens = []
      
      token.names = token.names || []
      token.inputs = token.inputs || []
    
      if(items.length == 1) {                                       // {math}
        token.type = 'Alias'
        token.value = {word: items[0]}
        items = []
      }

      else if(items.length == 2) {
        if(/^[a-z]/.test(items[1])) {                               // {math add}
          token.type = 'Command'
          token.value = {handler: items[0], method: items[1]}
        }
        else {                                                      // {add 1}
          token.type = 'Alias'
          token.value = {word: items[0]}
          token.names.push('__alias__')
        
          var value = items[1]
            , some_tokens = D.Parser.strings_to_tokens(value)
            , some_token = some_tokens[some_tokens.length - 1] || {}
        
          token.inputs.push(some_token.key || null)
          new_tokens = new_tokens.concat(some_tokens)
        }

        items = []
      }

      else if(!/^[a-z]/.test(items[1])) {                           // {add 1 to 3}
        token.type = 'Alias'
        token.value = {word: items[0]}
        items[0] = '__alias__'
      }
      else if(!/^[a-z]/.test(items[2])) {                           // {add to 1}
        token.type = 'Alias'
        token.value = {word: items[0]}
        items.shift()                                               // OPT: these shifts are probably slow...
      }
      else {                                                        // {math add value 1}
        token.type = 'Command'
        token.value = { handler: items.shift()
                      , method: items.shift()}                      // collect H & M
      }

      while(items.length) {                                         // collect params
        var word = items.shift()

        if(!/^[a-z]/.test(word) && word != '__alias__') {           // ugh derp
          D.set_error('Invalid parameter name "' + word 
                    + '" for "' + JSON.stringify(token.value) 
                    + '"')
          if(items.length)
            items.shift()
          continue
        }

        if(!items.length) {                                         // THINK: ???
          token.names.push(word)
          token.inputs.push(null)
          continue
        }

        var value = items.shift()
          , some_tokens = D.Parser.strings_to_tokens(value)
          , some_token = some_tokens[some_tokens.length - 1] || {}
        
        token.names.push(word)
        token.inputs.push(some_token.key || null)
        new_tokens = new_tokens.concat(some_tokens)
      }
    
      for(var i=0, l=new_tokens.length; i < l; i++) {
        if(!new_tokens[i].prevkey)
          new_tokens[i].prevkey = token.prevkey
      }
      
      token.done = true

      return [L, new_tokens.concat(token, R)]                       // aliases need to be reconverted even 
    }                                                               // if there's no new tokens
  , token_to_segments: function(token) {
      token.value.names = token.names
      return [new D.Segment(token.type, token.value, token)]        // TODO: suck out any remaining null params here
    }
  , execute: function(segment, inputs, dialect, prior_starter, process) {  
      if(segment.paramlist)
        return run_fun(segment, inputs, prior_starter, process)
    
      segment.handler = dialect.get_handler(segment.value.handler)
      segment.method  = dialect.get_method( segment.value.handler   // THINK: caching the method assumes this segment
                                          , segment.value.method )  // will always be invoked within the same dialect

      if(!segment.method) {
        error = 'You have failed to provide an adequate method: ' 
              + segment.value.handler + ' ' + segment.value.method
        D.set_error(error)
        segment.errors = [error]
        return ""                                                   // THINK: maybe {} or {noop: true} or something
      }                                                             // so false flows through instead of previous value

      // if we have to rerun this, cancel the paramlist. 
      // we'll know we have to rerun it if the 'null' input elements are different.
    
      // we need to think more about the differences between 
      // {9 | range _asdf} and {9 | range $asdf}
      // because if we change that then this problem goes away.
    
      // if(paramlist) {
      //   if(paramlist.length != segment.nulls.length)
      //     paramlist = false
      //   else
      //     for(var i=0, l=paramlist.length; i < l; i++) {
      //       if(paramlist[i] == null != segment.nulls[i])
      //         paramlist = false, break
      //     }
      // }
    
      segment.paramlist = build_paramlist(segment, segment.method, inputs)
      
      return run_fun(segment, inputs, prior_starter, process)
    }
  }
}();
D.SegmentTypes.Alias = {
  try_lex: function(string) {
    return new D.Token('Command', string) // THINK: this is weird...
    // return new D.Token('Alias', string) // NOTE: this has to run last...
  }
, munge_tokens: function(L, token, R) {
    var new_tokens = D.Aliases[token.value.word]

    if(!new_tokens) {
      D.set_error("The alias '" + token.value.word + "' stares at you blankly")
      return [L, R]
    }

    new_tokens =  D.clone(new_tokens)

    // ensure we don't eat pipe in {0 | else "{9}" | add 1} --> 1
    var alias_eats_pipe = D.AliasMap[token.value.word].indexOf('__') != -1

    if(alias_eats_pipe) {
      // get clean keys for pipevars, otherwise multiple 'then' statements bork: {({1 | then :yay} {0 | then :boo})}
      var keymap = {}
      for(var i=0, l=new_tokens.length; i < l; i++) {
        var a_token = new_tokens[i]
          , new_key = D.Etc.token_counter++
          , old_key = a_token.key

        keymap[old_key] = new_key
        a_token.key = new_key

        if(a_token.inputs) {
          for(var i=0, l=a_token.inputs.length; i < l; i++) {
            a_token.inputs[i] = keymap[a_token.inputs[i]] || a_token.inputs[i]
          }
        }
      }
    }

    // fiddle with wiring
    var last_replacement = new_tokens[new_tokens.length - 1]

    if(!last_replacement) {
      // first in line, so no previous wiring... curiously, this works in {(1 2 3) | map block "{add __ to 3}"}
      return [L, R]
    }

    last_replacement.key = token.key
    last_replacement.prevkey = token.prevkey

    for(var i=0, l=new_tokens.length; i < l; i++) {
      if(!new_tokens[i].prevkey || new_tokens[i].prevkey == '__in') // for __ in aliases like 'else'
        new_tokens[i].prevkey = token.prevkey
    }

    if(token.names) {
      // last_replacement.params = last_replacement.params || {}

      for(var i=0, l=token.names.length; i < l; i++) {
        var key = token.names[i]
          , value = token.inputs[i]
          , lr_index = last_replacement.names.indexOf(key)
          , lr_position = lr_index == -1 ? last_replacement.names.length : lr_index
          , lr_null_index = last_replacement.inputs.indexOf(null)

        if(key == '__pipe__' && alias_eats_pipe)
          continue

        if(key == '__pipe__') { // always add the __pipe__
          last_replacement.names[lr_position] = '__pipe__'
          last_replacement.inputs[lr_position] = value
        }
        else if(key == '__alias__') { // find last_replacement's dangling param
          if(lr_null_index != -1) {
            last_replacement.inputs[lr_null_index] = value
          }
        }
        else if(lr_index == -1) { // unoccupied param
          last_replacement.names.push(key)
          last_replacement.inputs.push(value)
        }
      }

    }

    return [L.concat(new_tokens), R] // NOTE: the new tokens are *pre* munged, and shouldn't contain fancy segments
  }
, token_to_segments: function(token) {
    // token.value.names = token.names
    // return [new D.Segment('Alias', token.value, token)]
  }
, execute: function(segment, inputs, dialect) {
    // shouldn't happen
  }
}
D.import_aliases({
  'do':     'list each block',
  'wait':   'process sleep for 0',
  'sleep':  'process sleep for',

  'grep':   'string grep on',
  'join':   'string join value',
  'split':  'string split value',

  '*':      'list pair data',
  'merge':  'list merge',
  'each':   'list each',
  'map':    'list map',
  'reduce': 'list reduce',
  'fold':   'list reduce',
  'sort':   'list sort',
  'group':  'list group',
  'filter': 'list filter',
  'count':  'list count data',
  'union':  'list union data',
  'unique': 'list unique data',
  'range':  'list range length',
  'first':  'list first',
  'zip':    'list zip data',
  'peek':   'list peek path',
  'poke':   'list poke value',

  'eq':     'logic is like',
  'is':     'logic is', // for 'is in'
  'if':     'logic if value',
  'then':   'logic if value __ then',
  'else':   'logic if value __ then __ else',
  'and':    'logic and value',
  'or':     'logic or value',
  'not':    'logic not value',
  'cond':   'logic cond value',
  'switch': 'logic switch value',

  'add':      'math add value',
  'plus':     'math add value',
  'minus':    'math subtract value',
  'subtract': 'math subtract value',
  'multiply': 'math multiply value',
  'times':    'math multiply value',
  'divide':   'math divide', // careful, this one is different
  'round':    'math round',
  'mod':      'math mod by',
  'less':     'math less',
  'min':      'math min value',
  'max':      'math max value',

  'run':      'process run block',
  'quote':    'process quote',
  'unquote':  'process unquote',
  'tap':      'process tap send',
})

// The daggr interface model

D.import_models({
  daggr: {
    desc: "Slices graphs into graphics (simple vector ones, at that)",
    help: "Daggr is a push-only interface: you can't use it as a data-store. You tell it what to render, set_data on items when things change, and move, re-render and remove as needed. Fancy rendering requires building a new type in JS.",
    vars: {},
    methods: {

      ////// ADDING & REMOVING //////

      add_sheet: {
        desc: "Create a new SVG sheet",
        params: [
          {
            key: 'id',
            desc: "The sheet id",
            type: 'string',
            required: true
          },
          {
            key: 'el',
            desc: "Container element's id",
            type: 'string',
            required: true
          },
        ],
        fun: function(id, el) {
          var sheet = Daggr.new_sheet(id, el);
          return sheet.id;
        },
      },

      add: {
        desc: "Add a thing to a sheet",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'type',
            desc: "A type, like node or port or edge",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The node id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional node data",
            type: 'list',
          },
        ],
        fun: function(sheet, type, id, data) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          data = data || {};
          data.id = id;
          
          var thing = sheet.add_thing(type, data);
          return thing ? thing.id : false;
        },
      },
      
      remove: {
        desc: "Remove a thing from its sheet",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.on_error('Invalid thing id');
          
          if(thing.remove()) return sheet.id;
        },
      },

      
      ////// SETTING STUFF //////
          
      find_traits: {
        desc: "Find all the traits",
        params: [
        ],
        fun: function() {
          return Object.keys(Daggr.Traits);
        },
      },
      
      add_type: {
        desc: "Build a new type",
        help: "A type pairs a default template with some composable traits that respond to particular data points (like the 'movable' trait listens for x and y).",
        params: [
          {
            key: 'key',
            desc: 'A unique single-word string identifying this thing type',
            type: 'string',
            required: true,
          },
          {
            key: 'block',
            desc: 'A Daimio template',
            type: 'block',
            required: true,
          },
          {
            key: 'traits',
            desc: 'A set of trait keys',
            type: 'list',
          },
          {
            key: 'data',
            desc: 'A hash of data to feed the traits',
            type: 'list',
          },
        ],
        fun: function(key, template, traits, data) {
          // ok, fun.
        },
      },
      
      append: {
        desc: "Put a thing into some other thing",
        help: "Note that only the first element matching the jquery filter is moved.",
        params: [
          {
            key: 'thing',
            desc: 'A thing id',
            type: 'string',
            required: true,
          },
          {
            key: 'filter',
            desc: 'A jquery filter',
            type: 'string',
            required: true,
          },
        ],
        fun: function(thing, filter) {
          // ok, fun.
        },
      },
      
      
      set_template: {
        desc: "Set a template for a type",
        help: "Types are built-in things for doing stuff",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'type',
            desc: "A type, like node or port or edge",
            type: 'string',
            required: true,
          },
          {
            key: 'daimio',
            desc: "A new daimio template for the template",
            type: 'block',
            required: true,
          },
        ],
        fun: function(sheet, type, daimio) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          if(sheet.set_template(type, daimio)) return sheet.id;
        },
      },
      
      set_data: {
        desc: "Set some data for a thing",
        help: "Things are instantiated types in a sheet with data and stuff",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
          {
            key: 'key',
            desc: "Some new data key",
            type: 'string',
            required: true,
          },
          {
            key: 'value',
            desc: "Some new data value",
            required: true,
          },
        ],
        fun: function(sheet, thing, key, value) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.on_error('Invalid thing id');
          
          // THINK: mirror objects are pretty weird... we either go whole hog and make them part of Daggr, or fiddle around out here in the handler somehow. Could attach a callback to setting things... but really, when will Daggr ever *set* values directly? but it does set them indirectly through moving sub-items. Could have a 'data' object in Daggr items that store x, y, and whatever else you put there through Daimio. That's probably the cleanest way to get the values in and out. Then it's just a matter of triggering calls on Daggr when values change, and triggering calls in Daimio when Daggr changes things... [but how do you differentiate?]
          
          // {value | > :@Daggr.{sheet}.{thing}.key}
          // D.recursive_insert(D.Vglobals, ['@Daggr', sheet.id, thing.id, key.split('.')], value);
          
          return thing.set_data(key, value);
        },
      },
      
      ////// FINDING STUFF //////
      
      // THINK: we don't have find sheet or find things in here, because Daggr isn't really meant for storing things. Instead, you should reference things in Daggr by id, and store them somewhere else (like DAGoba). And, honestly, how hard is it to keep track of your sheets? Not very. 
      
      find_types: {
        desc: "Find all the types",
        params: [
        ],
        fun: function() {
          return Object.keys(Daggr.Types);
        },
      },

      ////// DOING STUFF //////
      
      // THINK: all coords and scales are within the internal coordinate space... is that ok? Maybe we need a convert command, that goes from coord_space x/y to pixel_space x/y. (and vice versa)
      
      pan: {
        desc: "Move around in the sheet",
        help: "Panning can find you gold. Also: dx and dy are additive shifts to the current positioning: dx of 100 will shift the viewbox 100 screen units (*not* svg coord units) to the right.",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'dx',
            desc: "Difference in x",
            type: 'number',
            required: true,
          },
          {
            key: 'dy',
            desc: "Difference in y",
            type: 'number',
            required: true,
          },
        ],
        fun: function(sheet, dx, dy) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          sheet.pan(dx, dy);
          return sheet.id;
        },
      },
      
      scale: {
        desc: "Zoomin or out",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'ratio',
            desc: "How low can you go?",
            type: 'number',
            required: true,
          },
        ],
        fun: function(sheet, ratio) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          sheet.scale(ratio);
          return sheet.id;
        },
      },
      
      //////// DOING THINGS /////////
      
      move: {
        desc: "Move a thing within a sheet",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
          {
            key: 'x',
            desc: "Absolute client coordinate (pageX)",
            type: 'number',
          },
          {
            key: 'y',
            desc: "Absolute client coordinate (pageY)",
            type: 'number',
          },
          {
            key: 'dx',
            desc: "Relative client coordinate",
            type: 'number',
          },
          {
            key: 'dy',
            desc: "Relative client coordinate",
            type: 'number',
          },
        ],
        fun: function(sheet, thing, x, y, dx, dy) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.on_error('Invalid thing id');
          
          // NOTE: thing's x/y are in the svg coord space (so we don't have to change them all with each zoom/pan), so we need to translate the incoming page-based x/y.
          if(x || x === 0) {
            var v = sheet.screen_to_svg_coords(x, y);
            thing.x = v.x;
            thing.y = v.y;            
          } else {
            var v = sheet.screen_to_svg_vector({x: dx, y: dy});
            thing.x += v.x;
            thing.y += v.y;            
          }
          
          if(thing.move()) return thing.id;
        },
      },
      
      render: {
        desc: "Redraw some thing",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.on_error('Invalid thing id');
          
          if(thing.render()) return thing.id;
        },
      },
      
      to_back: {
        desc: "Send it to the back",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.on_error('Invalid thing id');
          
          sheet.to_back(thing.el);
          
          return thing.id;
        },
      },
            
      to_front: {
        desc: "Send it to the front",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.on_error('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.on_error('Invalid thing id');
          
          sheet.to_front(thing.el);
          
          return thing.id;
        },
      },
      
      spewtime: {
        desc: "log time since last call",
        params: [
          
        ],
        fun: function() {
          if(typeof oldtime == 'undefined') oldtime = 0; 
          newtime = new Date().getTime();    
          console.log(newtime - oldtime);
          oldtime = newtime;
        },
      },
      
      
    }
  }
});

if((typeof window !== 'undefined') && window.Daggr) {
  Daggr.onerror = D.on_error;
}
// The dagoba interface model

D.import_models({
  dagoba: {
    desc: "Some dagobay commands",
    vars: {},
    methods: {

      // ADDING THINGS

      add_graph: {
        desc: "Create a new graph",
        params: [
          {
            key: 'id',
            desc: "The graph id",
            type: 'string',
          },
        ],
        fun: function(id) {
          var graph = Dagoba.new_graph(id);
          
          // add graph action bindings
          topics = ['node/add','node/remove','port/add','port/remove','edge/add','edge/remove'];
          for(var i=0, l=topics.length; i < l; i++) {
            D.Etc.dagoba.set_actions(graph, topics[i]);
          }
          
          return graph.id;
        },
      },

      // TODO: allow adding conditions to a graph through this handler (since they're not synced via var bindings like actions are)

      add_node: {
        desc: "Add a node to a graph",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The node id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional node data",
            type: 'list',
          },
        ],
        fun: function(graph, id, data) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          data = data || {};
          data.id = id;
          
          var node = graph.add_node(data);
          return node ? node.id : false;
        },
      },

      add_port: {
        desc: "Add a port to a node",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'node',
            desc: "The node id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The port id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional port data",
            type: 'list',
          },
        ],
        fun: function(graph, node, id, data) {
          // THINK: is there a way to not have to require both graph and node?
          
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          node = graph.nodes[node];
          if(!node) return D.on_error('Invalid node id');
          
          data = data || {};
          data.id = id;
          
          var port = graph.add_port(node, data);
          return port ? port.id : false;
        },
      },

      add_edge: {
        desc: "Add an edge between two ports",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'startport',
            desc: "The starting port id",
            type: 'string',
            required: true,
          },
          {
            key: 'endport',
            desc: "The ending port id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The port id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional port data",
            type: 'list',
          },
        ],
        fun: function(graph, startport, endport, id, data) {
          // THINK: is there a way to not have to require both graph and ports?
          
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          startport = graph.ports[startport];
          if(!startport) return D.on_error('Invalid startport id');
          
          endport = graph.ports[endport];
          if(!endport) return D.on_error('Invalid endport id');
          
          data = data || {};
          data.id = id;
          
          var edge = graph.add_edge(startport, endport, data);
          return edge ? edge.id : false;
        },
      },

      // FINDING THINGS

      find_nodes: {
        desc: "Find a set of nodes",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by_ids',
            desc: "Some node ids",
            type: 'list',
          },
        ],
        fun: function(graph, by_ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var node, nodes = {};
          
          if(!by_ids.length) return D.Etc.dagoba.scrubber(graph.nodes);
          
          for(var i=0, l=by_ids.length; i < l; i++) {
            node = graph.nodes[by_ids[i]];
            if(node) nodes[node.id] = node;
          }

          return D.Etc.dagoba.scrubber(nodes);
        },
      },

      find_ports: {
        desc: "Find a set of ports",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by_ids',
            desc: "Some port ids",
            type: 'list',
          },
        ],
        fun: function(graph, by_ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var port, ports = {};
          
          if(!by_ids.length) return D.Etc.dagoba.scrubber(graph.ports);
          
          for(var i=0, l=by_ids.length; i < l; i++) {
            port = graph.ports[by_ids[i]];
            if(port) ports[port.id] = port;
          }

          return D.Etc.dagoba.scrubber(ports);
        },
      },

      find_edges: {
        desc: "Find a set of edges",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by_ids',
            desc: "Some edge ids",
            type: 'list',
          },
        ],
        fun: function(graph, by_ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var edge, edges = {};
          
          if(!by_ids.length) return D.Etc.dagoba.scrubber(graph.edges);
          
          for(var i=0, l=by_ids.length; i < l; i++) {
            edge = graph.edges[by_ids[i]];
            if(edge) edges[edge.id] = edge;
          }

          return D.Etc.dagoba.scrubber(edges);
        },
      },

      // SORTER

      sort_nodes: {
        desc: "Get a sorted set of nodes",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'by',
            desc: "A sort function id",
            type: 'string',
            fallback: 'natural',
          },
          {
            key: 'options',
            desc: "Some options for the sort function",
            type: 'list',
          },
        ],
        fun: function(graph, by, options) {
          // TODO: allow 'by' to be a block, which is used to sort the nodes (-1, 0, 1 and ... 'x' (for remove)) 
          
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var sorter = Dagoba.sort[by];
          if(!sorter) {
            D.on_error('Invalid sort function id, falling back to natural');
            sorter = Dagoba.sort['natural'];
          }
          
          return D.Etc.dagoba.scrubber(sorter(graph, options));
        },
      },

      // REMOVING THINGS
      
      remove_nodes: {
        desc: "Remove some nodes",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'ids',
            desc: "Node ids",
            type: 'list',
            required: true,
          },
        ],
        fun: function(graph, ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var node;
          
          for(var i=0, l=ids.length; i < l; i++) {
            node = graph.nodes[ids[i]];
            if(node) node.remove();
          }

          return graph.id;
        },
      },
      
      remove_ports: {
        desc: "Remove some ports",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'ids',
            desc: "Port ids",
            type: 'list',
            required: true,
          },
        ],
        fun: function(graph, ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var port;
          
          for(var i=0, l=ids.length; i < l; i++) {
            port = graph.ports[ids[i]];
            if(port) port.remove();
          }

          return graph.id;
        },
      },
      
      remove_edges: {
        desc: "Remove some edges",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'ids',
            desc: "Edge ids",
            type: 'list',
            required: true,
          },
        ],
        fun: function(graph, ids) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          var edge;
          
          for(var i=0, l=ids.length; i < l; i++) {
            edge = graph.edges[ids[i]];
            if(edge) edge.remove();
          }

          return graph.id;
        },
      },
      
      // METADATA
      
      set_data: {
        desc: "Set a piece of data in the thing",
        help: "The path can't start with a restricted key value. Existing references in Daimio variables are unaffected, so you'll need to e.g. {dagoba find_nodes} again.",
        params: [
          {
            key: 'graph',
            desc: "The graph id",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
          {
            key: 'type',
            desc: "Accepts: nodes, paths, or edges",
            type: 'string',
            required: true,
          },
          {
            key: 'path',
            desc: "A dot-delimited variable path",
            type: 'string',
            required: true,
          },
          {
            key: 'value',
            desc: "Some kind of value",
            type: 'anything'
          },
        ],
        fun: function(graph, id, type, path, value) {
          graph = Dagoba.graphs[graph];
          if(!graph) return D.on_error('Invalid graph id');
          
          if(['nodes', 'paths', 'edges'].indexOf(type) == -1) return D.on_error('Invalid type');
          
          var thing = graph[type][id];
          if(!thing) D.on_error('Invalid id');
          
          // TODO: scrub bad paths, like 'startport'
          
          // maybe instead D.recursive_extend(thing, path.split('.'), value);
          // D.recursive_insert(thing, path.split('.'), value);
          
          return graph.id;
        },
      },
      

    }
  }
});

D.Etc.dagoba = {};
D.Etc.dagoba.scrubber = function(things) {
  var ports = {}, edges = {}, clean_things = [], 
      id_keys = ['ports', 'edges', 'startnodes', 'endnodes', 'startnode', 'endnode', 'startports', 'endports', 'startport', 'endport', 'startedges', 'endedges', 'node'],
      bad_keys = ['graph', 'init', 'remove'];
      
  for(var thing_key in things) {
    var clean_thing = {}, thing = things[thing_key];
    
    for(var key in thing) {
      if(id_keys.indexOf(key) != -1) {
        clean_thing[key] = D.Etc.dagoba.extract_ids(thing[key]);
      } 
      else if(bad_keys.indexOf(key) == -1) { // (not) born under a bad key
        if(D.is_block(thing[key])) {
          clean_thing[key] = thing[key];
        } else {
          clean_thing[key] = D.scrub_var(thing[key]);
        }
      }
    }
    
    clean_things.push(clean_thing);
  }
  
  return clean_things;
};

D.Etc.dagoba.extract_ids = function(things) {
  var ids = [];
  if(things.id) return [things.id];
  
  for(var key in things) {
    ids.push(things[key].id);
  }
  
  return ids;
}

D.Etc.dagoba.set_actions = function(graph, topic) {
  graph.add_action(topic, function(topic) {
    return function(thing) {
      // D.execute('variable', 'set', [topic, thing]);
    };
  }('DAGOBA' + topic.replace('/', '_')));
}

// TODO: this won't work on the server
if((typeof window !== 'undefined') && window.Dagoba) {
  Dagoba.onerror = D.on_error;
}
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

          var processfun = function(item, prior_starter, item_key) {
            for(var key in item)
              scope[key] = item[key]
            
            scope["__in"] = item

            if(typeof item == 'object') {
              if(!('key' in item))
                scope.key = item_key
              if(!('value' in item))
                scope.value = item
            }

            return block(
                     function(value) {prior_starter(value)}
                   , scope, process)
          }
          
          return D.data_trampoline(data, processfun, D.string_concat, prior_starter)
        },
      },
      
      // THINK: can we do a 'take' type of thing given a lambda?
      // { "{__ | times 2 | plus 1 | is a :square}" | take 5 over :nats}
      
      'from-json': {
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
      
      'to-json': {
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
            type: 'array'
          }
        ],
        fun: function(data) {
          var key
          var val
          // var hash   = Object.create(null)                       // destroys hasOwnProperty, and the need for it...
          var hash   = {}
          var index  = 0
          var length = data.length
          
          if(length < 2)         
            return D.set_error('The data parameter must contain at least two elements') || {}

          while(index < length) {
            key = data[index++]
            val = data[index++]
            hash[key] = val
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

          by_value = by_value.map(JSON.stringify)       // for matching nested structures
          by_key = by_key.slice()                       // keeps segment.value happy

          if(Array.isArray(data))
            data = data.slice()                         // prevent mutation // TODO: remove this after list upgrades
          else
            data = D.clone(data)                        // OPT: this is entirely silly

          if(by_value.length)
            for(var key in data) 
              if( data.hasOwnProperty(key) 
               && by_value.indexOf(JSON.stringify(data[key])) != -1) 
                  by_key.push(key)

          if(by_key.length) {
            by_key.sort().reverse()
            for(var i=0, l=by_key.length; i < l; i++)
              if(Array.isArray(data))
                data.splice(by_key[i], 1)
              else
                delete data[by_key[i]] }

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
              
          if(all_arrays) return [].concat.apply(Array.prototype, values)
          
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
              var bysplits = by.split('.')
              if(bysplits.length == 1) return item[bysplits[0]]
              return D.peek(item, bysplits)
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
          var scope = _with || {}
          var processfun, finalfun
          
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
              var bysplits = by.split('.')
              if(bysplits.length == 1) return item[bysplits[0]]
              return D.peek(item, bysplits)
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
              var bysplits = by.split('.')
              if(bysplits.length == 1) return item[bysplits[0]]
              return D.peek(item, bysplits)
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
          {
            key: 'with',
            desc: 'Given a hash, values are imported into the block scope.',
            type: 'maybe-list'
          },
        ],
        fun: function(data, block, _with, prior_starter, process) {
          var found = false
          var the_item = false
          var scope = _with || {}
          
          if(Array.isArray(_with))
            scope = {'__in': _with[0]}
          
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
})// commands for logic

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
})// commands for math

// NOTE: we use the fallback type for most of these because they can be either numbers or arrays.

D.import_models({
  math: {
    desc: "Commands for math",
    methods: {
      
      add: {
        desc: "What kind of snake is good at math?",
        help: [
          'The value and to parameters can be numbers or arrays of numbers.',
          '',
          'Both numbers: Add the two numbers.',
          'One array, no second parameter: Sum the numbers in the array.',
          'One array, one number: Add the number to each item in the array.',
          'Both arrays: Add elements of the arrays pairwise by key',
          '',
          'You can use "add" as an alias for this command.',
        ],
        examples: [
          '{add 4 to 7}',
          '{7 | add 4}',
          '{add (1 2 3)}',
          '{(1 2 3) | add 3}',
          '{math add value (1 2 3) to (6 5 4)}',
        ],
        params: [
          {
            key: 'value',
            desc: "Augend: a numeric value or array of them",
            type: 'anything',
            required: true
          },
          {
            key: 'to',
            type: 'anything',
            desc: "Addend: a numeric value or array of the same",
          },
        ],
        fun: function(value, to) {
          return D.Etc.Math.solver(value, to, function(a, b) {return a + b;});
        },
      },

      multiply: {
        desc: "Go fort hand",
        help: [
          'The value and to parameters can be numbers or arrays of numbers.',
          '',
          'Both numbers: Multiply the two numbers.',
          'One array, no second parameter: Multiply the numbers in the array.',
          'One array, one number: Multiply the number to each item in the array.',
          'Both arrays: Multiply elements of the arrays pairwise by key',
          '',
          'You can use "multiply" as an alias for this command.',
        ],
        examples: [
          '{multiply 4 by 7}',
          '{7 | multiply 4}',
          '{multiply (1 2 3)}',
          '{(1 2 3) | multiply 3}',
          '{math multiply value (1 2 3) by (6 5 4)}',
        ],
        params: [
          {
            key: 'value',
            desc: "Factor the first: a numeric value or array of them",
            type: 'anything',
            required: true
          },
          {
            key: 'by',
            desc: "Factor the first: a numeric value or array of such",
            type: 'anything',
          },
        ],
        fun: function(value, by) {
          return D.Etc.Math.solver(value, by, function(a, b) {return a * b;});
        },
      },

      subtract: {
        desc: "Subtract them one from another",
        help: [
          'The value and to parameters can be numbers or arrays of numbers.',
          '',
          'Both numbers: Subtract the two numbers.',
          'One array, no second parameter: Subtract each subsequent item from the first array element.',
          'One array, one number: Subtract the number from each item in the array.',
          'Both arrays: Subtract elements of the second array from the first, pairwise by key',
          '',
          'You can use "subtract" as an alias for this command.',
        ],
        examples: [
          '{subtract 4 from 7}',
          '{7 | subtract 4}',
          '{subtract (100 2 3 4 5)}',
          '{(1 3 5 7) | subtract 3}',
          '{math subtract value (6 5 4) from (1 2 3)}',
        ],
        params: [
          {
            key: 'value',
            desc: "Subtrahend: a numeric value or array of them",
            type: 'anything',
            required: true
          },
          {
            key: 'from',
            desc: "Minuend: a numeric value or array of such",
            type: 'anything',
          },
        ],
        fun: function(value, from) {
          return D.Etc.Math.solver(from, value, function(a, b) {return a - b;});
        },
      },

      divide: {
        desc: "A method for conquering",
        help: [
          'The value and to parameters can be numbers or arrays of numbers.',
          '',
          'Both numbers: Divide the two numbers.',
          'One array, no second parameter: Divide the first number in the array by each other number.',
          'One array, one number: Divide each item in the array by the number.',
          'Both arrays: Divide elements of the arrays pairwise by key',
          '',
          'You can use "divide" as an alias for this command. When ambiguous read it as _divides_ instead of _divide by_ -- the second example will be confusing otherwise.',
        ],
        examples: [
          '{divide value 7 by 4}',
          '{7 | divide by 4}',
          '{divide value (1 2 3)}',
          '{(1 2 3) | divide by 3}',
          '{math divide value (1 2 3) by (6 5 4)}',
        ],
        params: [
          {
            key: 'value',
            desc: "Numerator: a numeric value or array of them",
            type: 'anything',
            required: true
          },
          {
            key: 'by',
            desc: "Denominator: a numeric value or array of such",
            type: 'anything',
          },
        ],
        fun: function(value, by) {
          return D.Etc.Math.solver(value, by, function(a, b) {
            if(!b) 
              return D.set_error('Division by zero is a crime against nature') || 0
            return a / b
          });
        },
      },

      mod: {
        desc: "Mod some stuff by some other stuff",
        help: [
          'Take the modulo of a value with respect to another value.'
        ],
        examples: [
          '{math mod value 7 by 2}',
          '{7 | mod 2}',
        ],
        params: [
          {
            key: 'value',
            desc: "A value to be modded",
            type: 'anything',
            required: true
          },
          {
            key: 'by',
            desc: "Value to mod it by",
            type: 'anything',
          },
        ],
        fun: function(value, by) {
          // NOTE: the default JS '%' operator is the remainder. we fiddle with negatives to make this a true modulo operation.
          return D.Etc.Math.solver(value, by, function(a, b) {
            if(!b) 
              return D.set_error('Modulation by zero is a crime against nature') || 0
            
            return a >= 0 == b > 0 ? a % b : a % b + b
            // return a > 0 ^ b > 0 ? -a % b : a % b // so pretty, but so wrong
          })
        },
      },

      pow: {
        desc: "A smack in the face to exponents of exponentiation",
        help: [
          'This raises value to the exp. Fractional exponents are fine, so the square root of five is {5 | math pow exp :0.5}.',
        ],
        examples: [
          '{math pow value 2 exp 8}',
          '{5 | math pow exp :3}',
          '{5 | math pow exp :0.5}',
        ],
        params: [
          {
            key: 'value',
            desc: 'Base',
            type: 'number',
            required: true
          },
          {
            key: 'exp',
            desc: 'Exponent',
            type: 'number',
            required: true
          },
        ],
        fun: function(value, exp) {
          // THINK: can we solver this?
          if(value < 0 && exp % 1)
            return D.set_error('Roots of negatives are not real') || 0
            
          return Math.pow(value, exp) || 0
        },
      },

      less: {
        desc: "Is value less than than?",
        params: [
          {
            key: 'value',
            desc: 'A value',
            type: 'number',
            required: true
          },
          {
            key: 'than',
            desc: 'Another value',
            type: 'number',
            required: true
          },
        ],
        fun: function(value, than) {
          return value < than
        },
      },

      random: {
        desc: "There's random, and then there's AYN random",
        params: [
          {
            key: 'max',
            desc: 'Maximum value (defaults to 1)',
            type: 'number',
          },
        ],
        fun: function(max) {
          if(!max) max = 1
          return Math.floor(Math.random() * (max + 1))
        },
      },

      // TODO: move these into a math-trig handler

      log: {
        desc: "Returns the logarithm, natural by default",
        params: [
          {
            key: 'value',
            desc: 'A number to log',
            type: 'number',
          },
          {
            key: 'base',
            desc: 'Defaults to e',
            type: 'number',
          },
        ],
        fun: function(value, base) {
          return (base ? (Math.log(value) / Math.log(base)) : Math.log(value) ) || 0 // clears out NaNs
        },
      },


      // CAREFUL WHEN YOU ADD asin and acos and also sqrt and log -- all of those can give NaNs!
      sin: {
        desc: "Find out if yours is original",
        params: [
          {
            key: 'value',
            desc: 'In degrees -- I know, right?',
            type: 'number',
          },
        ],
        fun: function(value) {
          return Math.sin(Math.PI * value / 180)
        },
      },

      cos: {
        desc: "The reason we did it: jus",
        params: [
          {
            key: 'value',
            desc: 'In degrees -- I know, right?',
            type: 'number',
          },
        ],
        fun: function(value) {
          return Math.cos(Math.PI * value / 180)
        },
      },

      round: {
        desc: "Round yourself out",
        params: [
          {
            key: 'value',
            desc: 'A number',
            type: 'number',
            required: true
          },
          {
            key: 'to',
            desc: "Significant digits",
            type: "number",
          },
        ],
        fun: function(value, to) {
          // THINK: can we accept an array to round?
          
          if(!to) return Math.round(value)
          
          var power = Math.pow(10, to)
          return Math.round(value * power) / power
        },
      },

      min: {
        desc: "Find the lowest value",
        params: [
          {
            key: 'value',
            desc: 'A number or list of numbers',
            type: 'anything', // [number] | number
            required: true
          },
          {
            key: 'also',
            desc: 'A number',
            type: 'number',
            undefined: true
          },
        ],
        fun: function(value, also) {
          value = D.to_array(value)

          if(also != undefined)
            value.push(also)
          
          return Math.min.apply(null, value) || 0
        },
      },

      max: {
        desc: "Find the highest value",
        params: [
          {
            key: 'value',
            desc: 'A list of numbers',
            type: 'anything', // [number] | number
            required: true
          },
          {
            key: 'also',
            desc: 'A number',
            type: 'number',
            undefined: true
          },
        ],
        fun: function(value, also) {
          value = D.to_array(value)

          if(also != undefined)
            value.push(also)
          
          return Math.max.apply(null, value) || 0
        },
      },


    }
  }
});

D.Etc.Math = {}

D.Etc.Math.solver = function(value, to, fun) {
  // TODO: we don't need this if the type is "array|number"
  value = (typeof value == 'object') ? D.to_array(value) : value
  to = (typeof to == 'object') ? D.to_array(to) : to
  // var arrays = (typeof value == 'object') + (typeof to == 'object');

  // are these arrays or numbers?
  var arrays = Array.isArray(value) + Array.isArray(to)
  
  // THINK: maybe wrap these with D.to_numeric to keep out NaNs
  if(arrays == 2) return D.Etc.Math.doubleArray(value, to, fun);
  if(arrays == 1) return D.Etc.Math.singleArray(value, to, fun);
  if(arrays == 0) return D.Etc.Math.naryanArray(value, to, fun);
};

D.Etc.Math.doubleArray = function(value, to, fun) {
  return value.map(function(val, key) {
    return fun(D.to_numeric(val), D.to_numeric(to[key]));
  });
};

D.Etc.Math.singleArray = function(value, to, fun) {
  // ensure value is the array
  if(typeof value != 'object') {
    var temp = to; to = value; value = temp;
  }
  
  // one array, one number
  if(D.is_numeric(to)) {
    return value.map(function(val) {
      return fun(D.to_numeric(val), D.to_numeric(to));
    });
  }

  // just the one array
  var total = false;
  value = D.to_array(value);
  for(var i=0, l=value.length; i < l; i++) {
    // NOTE: this essentially bypasses identity concerns -- total=0 poisons *, total=1 taints +. it means subtraction and division are relative to the first value in the array, but that's ok.
    if(total === false) total = D.to_numeric(value[i]);
    else total = fun(total, D.to_numeric(value[i]));
  }
  return total;
};

D.Etc.Math.naryanArray = function(value, to, fun) {
  if(!D.is_numeric(value)) {
    if(value)
      D.set_error("That is not a numeric value")
    value = 0
  }
  if(!D.is_numeric(to)) {
    // D.to_numeric(value)
    to = 0
  }
  return fun(D.to_numeric(value), D.to_numeric(to));        
};
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
            D.setImmediate(function() {
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
                       return (port.name == name && port.station == process.station_id) 
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
            type: 'anything'
          },
        ],
        fun: function(block, _with, prior_starter, process) {
          var scope = {}
          
          if(Array.isArray(_with)) {                    // unkeyed list? pass it as process input
            scope = {'__in': _with}
          } else 
          if(typeof _with == 'object') {                //   keyed list? use it as the scope
            scope = _with
          } else
          if(_with === "" || !D.is_nice(_with)) {       // default to current process scope (__in plus injected vars)
            scope = Object.keys(process.state)
                          .filter(function(key) {return +key != +key})
                          .reduce(function(acc, key) {acc[key] = process.state[key]; return acc}, {})
          } else {
            scope = {'__in': _with}                     // scalar value? pass it as process input
          }
          
          return block(function(value) {
            prior_starter(value)
          }, scope, process)
          
          // return NaN
          
          // var space = D.OuterSpace
          // space.real_execute(value, callback) 
          // TODO: fix me this is stupid it needs the right space
          
          // return D.run(value)
        },
      },
      
    }
  }
});// commands for strings

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
// commands for managing temporal anomalies

D.import_models({
  time: {
    desc: "Commands for exploding temporal quonsets",
    methods: {
      
      // TODO: add a {time now} command that returns the current timestamp and uses a downport to find it
      // TODO: then remove the default 'now' from stampwrap
      
      stampwrap: {
        desc: "",
        params: [
          {
            key: 'value',
            desc: 'A timestamp',
            type: 'number',
          }
        ],
        fun: function(value) {
          var date = value
                   ? new Date(value * 1000) // convert to milliseconds
                   : new Date()
          
          if(!date.valueOf())
            return D.set_error('Invalid timestamp')
            
          return { year:   date.getFullYear()
                 , month:  date.getMonth() + 1
                 , day:    date.getDate()
                 , hour:   date.getHours()
                 , minute: date.getMinutes()
                 , second: date.getSeconds()
                 , stamp:  Math.floor(date.getTime() / 1000) // convert to seconds
                 }
        },
      },
      
    }
  }
});
D.import_type('anything', function(value) {
  return D.make_nice(value) // THINK: what about blocks? 
})

D.import_type('array', function(value) { // ugh...
  return D.to_array(value)
})

D.import_type('either:block,string', function(value) {
  if(D.is_block(value)) {
    return D.blockify(value)
  } else {
    return D.stringify(value)
  }
})
D.import_type('block', function(value) {
  if(D.is_block(value)) {
    // value is a block ref...
    return function(prior_starter, scope, process) {
      // TODO: check value.value.id first, because it might not be in ABLOCKS
      // TODO: how does this fit with parent processes and parallelization? 
      var space = process ? process.space : D.ExecutionSpace
        , station_id = process ? process.station_id : false
      if(process && process.state && process.state.secret) { // FIXME: this seems really quite silly
        scope.parent_process = process
        scope.secret = process.state.secret
      }
      return space.real_execute(D.BLOCKS[value.value.id], scope, prior_starter, station_id) 
    }
  }
  else {
    return function() {
      return value
      // return D.stringify(value) // strings just fire away // THINK: why were we stringifying here?
    }
  }
})

D.import_type('integer', function(value) {
  value = D.Types['number'](value) // TODO: make a simpler way to call these
  
  return Math.round(value)
})

D.import_type('list', function(value) {
  if(value && typeof value === 'object') 
    return value.type == 'Block' ? [value] : value
  return D.to_array(value)
})

D.import_type('maybe-list', function(value) {
  if(value === false || !D.is_nice(value))
    return false
  else
    return D.Types['list'](value)
})

D.import_type('number', function(value) {
  if(typeof value == 'number') value = value
  else if(typeof value == 'string') value = +value
  // else if(typeof value == 'object') value = Object.keys(value).length // THINK: this is a little weird
  else value = 0

  return value
})

D.import_type('string', function(value) {
       if(D.is_block(value))                  value = value.toJSON()
  else if(typeof value == 'string')           value = value
  else if(typeof value == 'number')           value = value + ''
  else if(typeof value == 'boolean')          value = '' // THINK: we should only cast like this on output...
  else if(typeof value == 'object' && value)  value = JSON.stringify(value, function(key, value) 
                                                        {return value === null ? '' : value}) 
                                                        // OPT: sucking nulls out here is probably costly
  else if(value && value.toString)            value = value.toString()
  else                                        value = ''
  
  return value
})

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 * 
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 * 
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash 
 */

function murmurhash(key, seed) {
	var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
	  	k1 = 
	  	  ((key.charCodeAt(i) & 0xff)) |
	  	  ((key.charCodeAt(++i) & 0xff) << 8) |
	  	  ((key.charCodeAt(++i) & 0xff) << 16) |
	  	  ((key.charCodeAt(++i) & 0xff) << 24);
		++i;

		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}

	k1 = 0;

	switch (remainder) {
		case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1: k1 ^= (key.charCodeAt(i) & 0xff);

		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}// seedrandom.js version 2.0.
// Author: David Bau 4/2/2011
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
//
// Usage:
//
//   <script src=http://davidbau.com/encode/seedrandom-min.js></script>
//
//   Math.seedrandom('yipee'); Sets Math.random to a function that is
//                             initialized using the given explicit seed.
//
//   Math.seedrandom();        Sets Math.random to a function that is
//                             seeded using the current time, dom state,
//                             and other accumulated local entropy.
//                             The generated seed string is returned.
//
//   Math.seedrandom('yowza', true);
//                             Seeds using the given explicit seed mixed
//                             together with accumulated entropy.
//
//   <script src="http://bit.ly/srandom-512"></script>
//                             Seeds using physical random bits downloaded
//                             from random.org.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 Seeds using urandom bits from call.jsonlib.com,
//                             which is faster than random.org.
//
// Examples:
//
//   Math.seedrandom("hello");            // Use "hello" as the seed.
//   document.write(Math.random());       // Always 0.5463663768140734
//   document.write(Math.random());       // Always 0.43973793770592234
//   var rng1 = Math.random;              // Remember the current prng.
//
//   var autoseed = Math.seedrandom();    // New prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable.
//
//   Math.random = rng1;                  // Continue "hello" prng sequence.
//   document.write(Math.random());       // Always 0.554769432473455
//
//   Math.seedrandom(autoseed);           // Restart at the previous seed.
//   document.write(Math.random());       // Repeat the 'unpredictable' value.
//
// Notes:
//
// Each time seedrandom('arg') is called, entropy from the passed seed
// is accumulated in a pool to help generate future seeds for the
// zero-argument form of Math.seedrandom, so entropy can be injected over
// time by calling seedrandom with explicit data repeatedly.
//
// On speed - This javascript implementation of Math.random() is about
// 3-10x slower than the built-in Math.random() because it is not native
// code, but this is typically fast enough anyway.  Seeding is more expensive,
// especially if you use auto-seeding.  Some details (timings on Chrome 4):
//
// Our Math.random()            - avg less than 0.002 milliseconds per call
// seedrandom('explicit')       - avg less than 0.5 milliseconds per call
// seedrandom('explicit', true) - avg less than 2 milliseconds per call
// seedrandom()                 - avg about 38 milliseconds per call
//
// LICENSE (BSD):
//
// Copyright 2010 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
// 
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
/**
 * All code is in an anonymous closure to keep the global namespace clean.
 *
 * @param {number=} overflow 
 * @param {number=} startdenom
 */
(function (pool, math, width, chunks, significance, overflow, startdenom) {


//
// seedrandom()
// This is the seedrandom function described above.
//
math['seedrandom'] = function seedrandom(seed, use_entropy) {
  var key = [];
  var arc4;

  // Flatten the seed string or build one from local entropy if needed.
  seed = mixkey(flatten(
    use_entropy ? [seed, pool] :
    arguments.length ? seed :
    [new Date().getTime(), pool, window], 3), key);

  // Use the seed to initialize an ARC4 generator.
  arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(arc4.S, pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  math['random'] = function random() {  // Closure to return a random double:
    var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
    var d = startdenom;                 //   and denominator d = 2 ^ 48.
    var x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  // Return the seed that was used
  return seed;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, u, me = this, keylen = key.length;
  var i = 0, j = me.i = me.j = me.m = 0;
  me.S = [];
  me.c = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) { me.S[i] = i++; }
  for (i = 0; i < width; i++) {
    t = me.S[i];
    j = lowbits(j + t + key[i % keylen]);
    u = me.S[j];
    me.S[i] = u;
    me.S[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  me.g = function getnext(count) {
    var s = me.S;
    var i = lowbits(me.i + 1); var t = s[i];
    var j = lowbits(me.j + t); var u = s[j];
    s[i] = u;
    s[j] = t;
    var r = s[lowbits(t + u)];
    while (--count) {
      i = lowbits(i + 1); t = s[i];
      j = lowbits(j + t); u = s[j];
      s[i] = u;
      s[j] = t;
      r = r * width + s[lowbits(t + u)];
    }
    me.i = i;
    me.j = j;
    return r;
  };
  // For robust unpredictability discard an initial batch of values.
  // See http://www.rsa.com/rsalabs/node.asp?id=2009
  me.g(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
/** @param {Object=} result 
  * @param {string=} prop
  * @param {string=} typ */
function flatten(obj, depth, result, prop, typ) {
  result = [];
  typ = typeof(obj);
  if (depth && typ == 'object') {
    for (prop in obj) {
      if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
  }
  return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
/** @param {number=} smear 
  * @param {number=} j */
function mixkey(seed, key, smear, j) {
  seed += '';                         // Ensure the seed is a string
  smear = 0;
  for (j = 0; j < seed.length; j++) {
    key[lowbits(j)] =
      lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
  }
  seed = '';
  for (j in key) { seed += String.fromCharCode(key[j]); }
  return seed;
}

//
// lowbits()
// A quick "n mod width" for width a power of 2.
//
function lowbits(n) { return n & (width - 1); }

//
// The following constants are related to IEEE 754 limits.
//
startdenom = math.pow(width, chunks);
significance = math.pow(2, significance);
overflow = significance * 2;

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

// End anonymous scope, and pass initial values.
})(
  [],   // pool: entropy pool starts empty
  Math, // math: package containing random, pow, and seedrandom
  256,  // width: each RC4 output is 0 <= x < 256
  6,    // chunks: at least six RC4 outputs for each double
  52    // significance: there are 52 significant digits in a double
);// inspired by http://dbaron.org/log/20100309-faster-timeouts

~function() {
  var later = []
  var messageName = 12345
  var gimme_a_tick = true

  function setImmediate(fn) {
    later.push(fn)
    
    if(gimme_a_tick) {
      gimme_a_tick = false
      window.postMessage(messageName, "*")
    }
  }

  function handleMessage(event) {
    if(event.data != messageName) return false

    event.stopPropagation()
    gimme_a_tick = true

    var now = later
    later = []

    for(var i=0, l=now.length; i < l; i++)
      now[i]()
    
    // OPT: put a special branch here for array messages, and then handle them like this:
    // timeouts[i][0].forEach(function(port) { port.enter(timeouts[i][1]) })  // aka ports and ship
    
  }
  
  if(typeof window != 'undefined') {
    window.addEventListener("message", handleMessage, true)
    D.setImmediate = setImmediate
  }
}();
D.import_optimizer('constant_list', 0.5, function(block) {
  var changed  = false
  var segments = block.segments
  var wiring   = block.wiring
  var new_segments = []
  var new_wiring   = {}
  
  for(var i=0, l=segments.length; i < l; i++) {
    var temp = []
    var places = []
    var this_segment = segments[i]
    
    new_segments.push(this_segment)

    if(!wiring[i]) continue    

    if(this_segment.type != 'List') {                   // capture the wiring 
      new_wiring[i] = wiring[i]
      continue
    }
    
    new_wiring[i] = D.clone(wiring[i])                  // or clone it if necessary
    
    for(var j=0, k=wiring[i].length; j < k; j++) {
      var wire = wiring[i][j]
      var wireseg = segments[wire]
      if(!wireseg                                       // note that && binds tighter than ||
       || wireseg.type != 'Number'                      // (but don't try this at home, kids)
       && wireseg.type != 'String' ) {
          temp.push(null)
          places.push(j)
          continue }

      new_wiring[i][j] = undefined
      // new_segments[wire] = null
      temp.push(wireseg.value)
    }
    
    changed  = true
    
    new_wiring[i] = new_wiring[i].filter(function (x) { return x !== undefined })
    if(!new_wiring[i].length) delete new_wiring[i]

    var value = { list: temp, places: places.length ? places : false }
    new_segments[i] = new D.Segment('OPT_constant_list', value, this_segment)
  }
  
  return changed ? new D.Block(new_segments, new_wiring) : block
})



D.SegmentTypes.OPT_constant_list = {
  execute: function(segment, inputs) {
    var val = segment.value.list.slice()        // TODO: fix this when the new datastructure becomes
    var places = segment.value.places
    
    for(var i=0, l=places.length; i < l; i++)
      val[places[i]] = inputs[i]

    return val
    
    // TODO: blend null vals with inputs or have a flag in value to indicate we need to do that
  }
}
D.import_optimizer('simple_math', 0.5, function(block) {
  var changed  = false
  var segments = block.segments
  var wiring   = block.wiring
  var new_segments = []
  var new_wiring   = {}
  
  for(var i=0, l=segments.length; i < l; i++) {
    var temp = []
    var places = []
    var this_segment = segments[i]
    
    new_segments.push(this_segment)

    if(!wiring[i]) continue
    new_wiring[i] = wiring[i]

    if( this_segment.type != 'Command'
     || this_segment.value.handler  != 'math'
     || this_segment.value.method   != 'multiply'       // && binds tighter than ||
     && this_segment.value.method   != 'add' )          
        continue
    
    if(wiring[i].length != 2)                           // THINK: we could still opt in this case...
      continue
    
    var wire = wiring[i][0]
    var wireseg = segments[wire]

    if(!wireseg                                         // && binds tighter than ||
     || wireseg.type != 'Number' )                      // THINK: we could still opt in this case...
        continue

    changed = true
    new_wiring[i] = [wiring[i][1]]

    value = {value: wireseg.value, op: this_segment.value.method}
    new_segments[i] = new D.Segment('OPT_simple_math', value, this_segment)
  }

  return changed ? new D.Block(new_segments, new_wiring) : block
})

D.SegmentTypes.OPT_simple_math = {
  execute: function(segment, inputs) {
    var val  = inputs[0]
    var sval = segment.value.value
    var svop = segment.value.op
    
    if(typeof val == 'number')
      return svop == 'add'
           ? sval + val
           : sval * val

    val = D.Types.anything(val)

    if(svop == 'add')
      return D.Commands.math.methods.add.fun(sval, val)

    return D.Commands.math.methods.multiply.fun(sval, val)
  }
}
D.import_optimizer('simple_peek', 0.4, function(block) {
  if(!D.Etc.OPT_simple_peek)                            // oh hai have some fun
    D.Etc.OPT_simple_peek = 
      { pos : D.Pathfinders.filter(function(pf) {return pf.name == "position"})[0].gather
      , key : D.Pathfinders.filter(function(pf) {return pf.name == "key"})[0].gather }
  
  var changed  = false
  var segments = block.segments
  var wiring   = block.wiring
  var new_segments = []
  var new_wiring   = {}
  
  for(var i=0, l=segments.length; i < l; i++) {
    var temp = []
    var places = []
    var this_segment = segments[i]
    
    new_segments.push(this_segment)

    if(!wiring[i]) continue
    new_wiring[i] = wiring[i]

    if( this_segment.type != 'Command'
     || this_segment.value.handler  != 'list'
     || this_segment.value.method   != 'peek'
     || this_segment.value.names[1] != 'path' )         // THINK: we could still opt in this case...
        continue
    
    var pathwire = wiring[i][1]
    var listseg = segments[pathwire]
    
    if( !wiring[pathwire]                               // only one item
     ||  wiring[pathwire].length != 1 )
         continue
    
    var wire = wiring[pathwire][0]
    var wireseg = segments[wire]

    if(!wireseg                                         // && binds tighter than ||
     || wireseg.value == '*'
     || wireseg.type  != 'Number'
     && wireseg.type  != 'String' )
        continue

    changed = true
    delete new_wiring[pathwire]
    new_wiring[i] = [wiring[i][0]]

    new_segments[i] = new D.Segment('OPT_simple_peek', wireseg.value, this_segment)
  }

  return changed ? new D.Block(new_segments, new_wiring) : block
})

D.SegmentTypes.OPT_simple_peek = {
  execute: function(segment, inputs) {
    var key  = segment.value
    var data = inputs[0]

    if(key[0] == '#') {
      var position = +key.slice(1)
      if(Array.isArray(data))
        if(position < 0)
          return data[data.length + position]
        else
          return data[position - 1]
      
      return D.Etc.OPT_simple_peek.pos(inputs[0], segment.value)[0]
    }

    return D.Etc.OPT_simple_peek.key(inputs[0], segment.value)[0]
  }
}

D.import_pathfinder('list', {
  keymatch: function(key) {
    if(Array.isArray(key))
      return 'many'
  },
  gather: function(value, key) {
    var output = []

    for(var i=0, l=key.length; i < l; i++) {
      var this_key = key[i]
      if(Array.isArray(this_key)) { // outer list is parallel, inner list is serial, etc
        output.push(D.peek(value, key[i] ))
      } else { // scalar needs wrapping... why?
        output.push(D.peek(value, [key[i]] ))
      }
    }
    
    return output
  },
  create: function(value, key) {
    var output = []

    for(var i=0, l=key.length; i < l; i++) {
      var this_key = key[i]
      if(Array.isArray(this_key)) { // outer list is parallel, inner list is serial, etc
        output.push(D.poke(value, key[i], []))
      } else { // scalar needs wrapping... why?
        output.push(D.poke(value, [key[i]], []))
      }
    }
    
    return output
  },
  set: function(value, key, new_val) {
    var output = []
      // , temp = []

    for(var i=0, l=key.length; i < l; i++) {
      var this_key = key[i]
      if(Array.isArray(this_key)) { // outer list is parallel, inner list is serial, etc
        output.push(D.poke(value, key[i], new_val))
      } else { // scalar needs wrapping... why?
        output.push(D.poke(value, [key[i]], new_val))
      }
    }
    
    // for(var i=0, l=output.length; i < l; i++) {
    //   if(output[l] == temp)
    //     output[l] = new_val
    // }
    
    return output
  }
})

D.import_pathfinder('position', {
  keymatch: function(key) {
    if( (typeof key == 'string') && /#-?\d/.test(key) )
      return 'one'
  },
  gather: function(value, key) {
    var safe_value = (typeof value == 'object') ? value : [value]
      , vkeys = Object.keys(safe_value)
      , position = +key.slice(1)
      , index = (position < 0) ? (vkeys.length + position) : position - 1
      , output = safe_value[ vkeys[ index ] ]
      
    return output ? [output] : []
  },
  create: function(value, key) {
    var vkeys = Object.keys(value)
    
    // special case for push / unshift
    if(key == '#0')
      key = '#-' + (vkeys.length + 1)
    if(key == '#-0')
      key = '#' + (vkeys.length + 1)
      
    var first_position = +key.slice(1)
    var abs_first_position = Math.abs(first_position)
    var position = first_position - (first_position / abs_first_position) // offset by one
      
    if(vkeys.length < abs_first_position) { // not enough items
      var this_key
        , excess = abs_first_position - vkeys.length

      for(var i=0; i < excess; i++) {        
        if(!Array.isArray(value)) { // object
          // this_key = Math.random() // herp derp merp berp
          this_key = i + 1000000
          value[this_key] = [] 
          // THINK: ok, we're using integers here instead, but that means this will collide with existing keys with high probability. maybe an offset? ok, an offset. this is really really stupid.
          // THINK: using random keys here is super stooopid, but honestly what else can you do? there's no reasonable way to extend a keyed list by position. is there? 
          // THINK: also note that negative positions are sorted last in keyed lists in this case, which is also weird. we'll need the parent to fix it, though, because it requires making a whole new list (you can't just delete everything and repopulate because of implementation-specific oddness in object ordering post deletion&repopulation).
        } 
        else if(first_position < 0) { // backwards
          this_key = 0
          value.unshift([])
        }
        else { // forwards
          this_key = value.length
          value.push([])
        }
      }
      
      return [value[this_key]]
    }
      
    if(first_position < 0) { // negative index
      vkeys.reverse()
      position *= -1
    }
    
    if(typeof value[ vkeys[ position ] ] != 'object')
      value[ vkeys[ position ] ] = []
    
    return [ value[ vkeys[ position ] ] ]
    
    // value = D.to_array(value)
    // var position = Math.abs(+key.slice(1)) // THINK: if |value| < N for #-N then do this backward...
    // 
    // for(var i=0, l=position; i <= l; i++)
    //   if(typeof value[i] == 'undefined')
    //     value[i] = []
    // 
    // return [value[position]]
  },
  set: function(value, key, new_val) {
    // THINK: the default value of [] is a little weird on the set side... but maybe it's best for consistency?
    var vkeys = Object.keys(value)
      , position = +key.slice(1)
      , index = (position < 0) ? (vkeys.length + position) : position - 1

    if(value[ vkeys[ index ] ]) {
      value[ vkeys[ index ] ] = new_val
      return
    }
    
    var selected = this.create(value, key)[0]
    // at this point we've created all the dummy values, so we just need to figure out where 'selected' is...
    for(var k in value) {
      if(value[k] == selected) {
        value[k] = new_val 
        continue
      }
    }
  }
})

D.import_pathfinder('star', {
  keymatch: function(key) {
    if(key == '*')
      return 'many'
  },
  gather: function(value, key) {
    if(value && typeof value == 'object')
      return D.to_array(value)

    return []
  },
  create: function(value, key) {
    value = D.to_array(value) // TODO: this is wrong, but we need parent to fix it (right?)
    
    for(var i=0, l=value.length; i < l; i++)
      if(typeof value[i] != 'object')
        value[i] = []
    
    return value
  },
  set: function(value, key, new_val) {
    for(var k in value) {
      value[k] = new_val
    }
  }
})

// NOTE: this is the fallback, and has to be imported last... so if you need to import a custom pathfinder, you'll have to pop this off and push it back on after. 
// TODO: find a better way to manage importee ordering
D.import_pathfinder('key', {
  keymatch: function(key) {
    if(typeof key == 'string')
      return 'one'
  },
  gather: function(value, key) {
    return (value && value.hasOwnProperty(key)) 
           ? [value[key]] 
           : []
  },
  create: function(value, key) {
    if(value.hasOwnProperty(key) && (typeof value[key] == 'object') )
      return [value[key]]
      
    value[key] = {}
    return [value[key]]
  },
  set: function(value, key, new_val, parent) {
    // TODO: this can't work until we have access to the parent object...
    // if(Array.isArray(value) && !/^\d+$/.test(key)) { // proper array and non-N key
    //   // convert the array into an object so the key will stick
    //   var value_object = {}
    //   for(var i=0, l=value.length; i < l; i++)
    //     value_object[i] = value[i]
    //   value = value_object
    // }

    // TODO: array + numeric key -> sparse array. fill in the blanks with "" (all Daimio lists are dense)
    value[key] = new_val
  }
})
D.import_port_flavour('dom-do-submit', {
  dir: 'out',
  outside_exit: function(ship) {
    if(this.element)
      this.element.submit()
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)
    
    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')
    
    if(!('submit' in this.element))
      return D.set_error('That dom thing has no submit')
  }
})
D.import_port_flavour('dom-on-blur', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('blur', this.settings.thing, function(value) {self.enter(value)})
  }
})
D.import_port_flavour('dom-on-change', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('change', this.settings.thing, function(value) {self.enter(value)})
  }
})
D.import_port_flavour('dom-on-keypress', {
  dir: 'in',
  outside_add: function() {
    // THINK: this requires binding to a particular DOM element -- is there a way to default to 'document'?
    var self = this
    D.track_event('keypress', this.settings.thing, function(value) {self.enter(value)})
  }
})
D.import_port_flavour('dom-on-click', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('click', this.settings.thing, function(value) {self.enter(value)})
  }
})
D.import_port_flavour('dom-on-mouseout', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('mouseout', this.settings.thing, function(value) {self.enter(value)})
  }
})
D.import_port_flavour('dom-on-mouseover', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('mouseover', this.settings.thing, function(value) {self.enter(value)})
  }
})
D.import_port_flavour('dom-on-submit', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    var callback = function(value, event) {                     // TODO: buckle down and have this suck out 
      var ship = {}                                             //       all form values, not just the easy ones. 
      var element = event.target                                //       yes, it's ugly. but do it for the kittens.
        
      for(var i=0, l=element.length; i < l; i++) {
        if(element[i].type == 'checkbox') {
          var name = element[i].name
          if(name.slice(-2) == '[]') {                          // yes, this is totally gross, but we need a way
            name = name.slice(0,-2)                             // to distinguish between single checkboxes and
            ship[name] = ship[name] ? ship[name] : []           // lists of checkboxes, and this is a well-known
            if(element[i].checked)                              // strategy. please someone solve this betterly!
              ship[name].push(element[i].value)
          } else {
            ship[name] = element[i].checked ? element[i].value : false
          }
        }
        else {
          ship[element[i].name] = element[i].value
        }
      }
      self.enter(ship) 
    }
        
    D.track_event('submit', this.settings.thing, callback)
  }
})
// TODO: convert these 'set' style ports to use track_event

D.import_port_flavour('dom-set-html', {
  dir: 'out',
  outside_exit: function(ship) {
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    if(this.element) 
      this.element.innerHTML = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)

    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')

    if(!('innerHTML' in this.element))
      return D.set_error('That dom thing has no innerHTML')
  }
})
// TODO: convert these 'set' style ports to use track_event

// THINK: can we genericize this to handle both set-text & set-value?
D.import_port_flavour('dom-set-text', {
  dir: 'out',
  outside_exit: function(ship) {
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    // if(!(ship % 1000))
      if(this.element)
        this.element.textContent = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)
    
    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')
    
    if(this.element.textContent == undefined)
      return D.set_error('That dom thing has no text')
  }
})
// TODO: convert these 'set' style ports to use track_event

D.import_port_flavour('dom-set-value', {
  dir: 'out',
  outside_exit: function(ship) {
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    if(this.element) 
      this.element.value = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)

    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')
  }
})

D.import_port_flavour('from-js', {
  dir: 'in',
  outside_add: function(port) {
    this.default_value = this.settings.all.length > 2
                       ? this.settings.thing
                       : 1
  },
  enter: function(ship, process) {
    var value = ship !== undefined ? ship : this.default_value
    D.port_standard_enter.call(this, value, process)
  }
})


D.import_port_flavour('in', {
  dir: 'in'
})

D.import_port_flavour('err', {
  dir: 'out'
  // TODO: ???
})

D.import_port_flavour('out', {
  dir: 'out'
})

D.import_port_flavour('up', {
  dir: 'up'
  // THINK: this can only live on a space, not a station
})

D.import_port_flavour('down', {
  dir: 'down',
  exit: function(ship, process, callback) {
    // go down, then return back up...
    // THINK: is the callback param the right way to do this?? it's definitely going to complicate things...
    
    var self = this
    D.setImmediate(function() { 
      // THINK: ideally there's only ONE route from a downport. can we formalize that?
      // self.outs.forEach(function(port) { 
      //   port.enter(ship) 
      // }) 
      port = self.outs[0]
      if(port) {
        port.enter(ship, process, callback) // wat
      }
      else {
        callback(1234)
      }
    })
  }
})

D.import_port_flavour('exec', {
  dir: 'in',
  exit: function(ship) { 
    if(!this.space)
      return false
    
    // this.space.secret = ship
    this.space.execute(D.Parser.string_to_block_segment(ship.code), {secret: ship}) // TODO: ensure this is a block, not a string
  }
})


D.import_port_flavour('socket-add-user', {
  dir: 'in',
  outside_add: function() {
    var self = this
      , callback = function (ship) {
          if(!ship.user) return false
          self.enter(ship)
        }
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')
    
    D.Etc.socket.on('connected', callback)
    D.Etc.socket.on('add-user', callback)
  }
})
D.import_port_flavour('socket-in', {
  dir: 'in',
  outside_add: function() {
    var self = this
      , channel = 'bounced'
    
    if(self.settings.all.length > 2)
      channel = self.settings.thing // explicit third param only -- no sugar
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')

    D.Etc.socket.on(channel, function (ship) {
      self.enter(ship)
    })
    
  }
})
D.import_port_flavour('socket-out', {
  dir: 'out',
  outside_exit: function(ship) {
    var channel = 'bounce'
    
    if(this.settings.all.length > 2)
      channel = this.settings.thing // explicit third param only -- no sugar
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')

    D.Etc.socket.emit(channel, ship)
  }
})
D.import_port_flavour('socket-remove-user', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')
    
    D.Etc.socket.on('disconnected', function (ship) {
      if(!ship.user) return false
      self.enter(ship)
    })
    
  }
})
D.import_port_flavour('svg-add-line', {
  dir: 'out',
  outside_exit: function(ship) {
    var element = document.getElementById(ship.thing)
    
    if(!element)
      return D.set_error('You seem to be lacking elementary flair')
    
    if(!element.getCTM)
      return D.set_error("That doesn't look like an svg element to me")
    
    var x1 = ship.x1 || 0
      , y1 = ship.y1 || 0
      , x2 = ship.x2 || 0
      , y2 = ship.y2 || 0
      , width = ship.width || 1
      , alpha = ship.alpha || 1
      , color = ship.color || 'black'
    
    var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    newLine.setAttribute('stroke-opacity', alpha)
    newLine.setAttribute('stroke-width', width)
    newLine.setAttribute('stroke', color)
    newLine.setAttribute('x1', x1)
    newLine.setAttribute('y1', y1)
    newLine.setAttribute('x2', x2)
    newLine.setAttribute('y2', y2)
    
    element.appendChild(newLine)
  }
})





// ugh hack ugh
D.string_to_svg_frag = function(string) {
  var div= document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
      frag= document.createDocumentFragment();
  div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg">' + string + '</svg>';
  while (div.firstElementChild.firstElementChild)
    frag.appendChild(div.firstElementChild.firstElementChild);
  return frag;
};


D.import_port_flavour('svg-move', {
  dir: 'out',
  outside_exit: function(ship) {
    var element = document.getElementById(ship.thing)
    
    if(!element)
      return D.set_error('You seem to be lacking elementary flair')
    
    if(element.x !== undefined) { // a regular element
      
      if(typeof ship.x == 'number')
        element.x.baseVal.value = ship.x
      if(typeof ship.y == 'number')
        element.y.baseVal.value = ship.y
    
      if(typeof ship.dx == 'number')
        element.x.baseVal.value += ship.dx
      if(typeof ship.dy == 'number')
        element.y.baseVal.value += ship.dy
    
    }
    else { // a g tag or some such
      
      var x = ship.x
        , y = ship.y
        , ctm = element.getCTM()
        
      if(typeof x != 'number')
        x = ctm.e
      if(typeof y != 'number')
        y = ctm.f
    
      if(typeof ship.dx == 'number')
        x += ship.dx
      if(typeof ship.dy == 'number')
        y += ship.dy
      
      element.setAttribute('transform', 'translate(' + x + ', ' + y + ')')
    }
        
  }
})
D.import_port_flavour('svg-rotate', {
  dir: 'out',
  outside_exit: function(ship) {
    var element = document.getElementById(ship.thing)
    
    if(!element)
      return D.set_error('You seem to be lacking elementary flair')
    
    var x = typeof ship.x === 'number' ? ship.x : element.x.baseVal.value + (element.width.baseVal.value / 2)
      , y = typeof ship.y === 'number' ? ship.y : element.y.baseVal.value + (element.height.baseVal.value / 2)
      , a = ship.angle
      
    if(typeof a != 'number') {
      var ctm = element.getCTM()
      a = Math.atan2(ctm.b, ctm.a) / Math.PI * 180
    }
    
    if(typeof ship.dangle == 'number')
      a += ship.dangle
    
    element.setAttribute('transform', 'rotate(' + a + ' ' + x + ' ' + y + ')' )  
    
  }
})
D.import_port_flavour('to-js', {
  dir: 'out',
  outside_exit: function(ship) {
    // this is very very stupid
    
    var fun = D.Etc.fun && D.Etc.fun[this.settings.thing]
    if(!fun)
      return D.set_error('No fun found')
    
    fun(ship)
  }
})