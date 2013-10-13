/*
  Initial setup:
  - create the top-level space 
  - run code in the top level space which
    - builds subspaces with their own dialects
    - builds gateways to I/O
    - connects those gateways to channels
    - connects subspaces to channels

  The basic execution process:
  - create a new Block from a string S and a Space (which has a Dialect and a Varset)
    - breaks S into components (text, pipelines, blocks)
    - recursively converts any further blocks
    - builds Pipelines from a string, dialect and state
      - recursively builds inner pipelines and blocks
      - perform compile-time operations (escaping blocks, etc)
  - call block.execute() ... or space.execute? no, space.execute(block) always takes a param (possibly an empty one)
    
      
  
  Q: how do we keep from initially compiling subspace init blocks, since those should be compiled with their parent dialect? 
  A: don't worry about it for now -- recompile as often as needed.
  
  Q: how do we detect and activate compile-time operations? this happens in block init pipelines, including possibly our initial (top-level) block. it can also happen in regular pipelines. e.g. {begin foo | string quote}
  
  Q: how do we attach execution code to a space? A space has init code that builds it... maybe {space create} takes a block? yeah, suppose so. is that block compiled with the space's dialect? yep, that makes sense. {space create block $B dialect $D | > :MYSPACE} or something.



// NEW THOUGHTS
collects
checks
calculates
effects

gather
conditions
calculations
effects

Maybe add Frink as a handler?

*/ 


/* Naming conventions for Daimio:
D.import_commands   <--- snake_case for functions
D.SegmentTypes      <--- CamelCase for built-in objects
D.SPACESEEDS        <--- ALLCAPS for runtime containers

*/
D = {}
D.Etc = {}
D.ABLOCKS = {}
D.SPACESEEDS = {}
D.DIALECTS = {}
D.Types = {}
D.Aliases = {}
D.AliasMap = {}

D.Parser = {}
D.commands = {}
D.SegmentTypes = {}

D.command_open = '{'
D.command_closed = '}'
D.list_open = '('
D.list_closed = ')'
D.quote = '"'

D.noop = function() {}
D.identity = function(x) {return x}
D.concat = function(a,b) {return a.concat(b)}

D.process_counter = 1
D.token_counter = 100000 // this is stupid // FIXME: make Rekey work even with overlapping keys

/*
  D.CONSTANTS = {}
  CONSTANTSFRY
  - OpenBrace
  - CloseBrace
  - OpenAngle
  - CloseAngle
*/


/////// SOME HELPER METHODS ///////////

// TODO: clean up this error stuff... 

// THINK: maybe every station has a stderr outport, and you tap those ports to do anything with errors (instead of having them act as a global cross-cutting concern). you could run them to the console.log outport by default (or just in debug mode) and do something else in production like log in the db and send an email or something, based on error message / metadata. [oh... errors should probably have metadata]
// we can also put the error text/data in the command definition as an array, and then reference it from the error sender as an index (or object/key is probably better)
// that would simplify e.g. translation, and allows automated error stuff (eg show what errors a command can throw, practice throwing those to see what happens, pick out all potential errors of type foo from all stations (like, which stations are capable of producing *extreme* errors?))

// use this to set simple errors
D.setError = function(error) {
  return D.onerror('', error)
}

// use this to report errors in low-level daimio processes
D.onerror = function(command, error) {
  console.log('error: ' + error, command)
  return ""
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

D.Etc.regex_escape = function(str) {
  var specials = /[.*+?|()\[\]{}\\$^]/g // .*+?|()[]{}\$^
  return str.replace(specials, "\\$&")
}


/*
  If we make the event log a little stronger, can we use it to update local stores? 
  example: Bowser is auditing in his browser. He pulls up an audit and gets to work. This loads up all the audit data, but it also subscribes to the update channels for those _things_. Then Peach loads the same audit and makes some changes. 
  - Bowser's browser receives those events and updates the cached audit data accordingly (and hence the display).
  - Any queries to loaded objects can just hit the local cache, because it's automatically kept in sync.
 implies the local commands understand how to modify local cache based on events... hmmm.
 
 Log commands as a 3-element list: [H, M, P], with H&M as strings and P as a param map. this is canonical. also log time and user id. 
 thing: this is findable if it matches H+P.id. some commands might affect multiple things (but most don't). so... always log thing? never log thing? if the command is atomic, then the command is the bottom, not the thing. so changes on a thing are found via command search? need to list use cases. 
 
 there will be lots of 'standard form' commands, like {noun add} and {noun set-type} and {my set collection :nouns}. can we do something useful with them? 
 
 {my set} becomes a fauxcommand which includes a call to {attr set} and has user:* exec perms.
 {attr set} allows setting of a things' attributes if you have perms on that thing. (superdo can bypass, natch)
 so... how do you know what a thing's schema is? for example, given @thing, is it @thing.name or @thing.my.name?
 is it {thing set-name} or {my set attr :name}? are these formally defined somewhere or ad hoc? 
 defined: discoverable, programatically constrained, but requires locking in the schema before building
 ad hoc: flexible, friendly, but difficult to generate knowledge of thing structure -- leading to confusion and "sample querying"
 we have a fixed mechanical schema. that exists, if only in our heads. why not make it formal? could aid in migration, also, when needed.
 then anything not covered in the schema is available for attr'ing. so you can have super-friendly attrs like @thing.name, without having to specify anything (by simply *not* putting them in the formal schema).
 so a {name set} fauxcommand and the ilk for things in general? and {my set} for user-created ad hoc attrs?
 
 commands are the atomic bottom. things are underneath that. most commands change one attr on one thing at a time. but some more complex ones might change many attrs on several things at once. we want to:
 - track changes to a thing over time
 - see the system at a particular moment in time
 - rewind and fast forward through time
 - allow unlimited undoability
 complex commands are like a transaction. so maybe commands are 'simple' (one thing/attr, undo means redo prior command w/ same params (id, maybe collection for {attr set}) but different value). 
 whereas a 'complex' command requires a custom 'undo' function as part of the command definition. so the bottom command itself contains information on the collection+attr. (automated for set-* style commands)
 
 also need to allow custom events in the event log, not just commands. this is important for... i don't know what. maybe those go in a different collection. command log for commands. error log for errors. event log for other things. maybe the event log is just there for attaching listeners? but if you're using a command for firing an event then that's going to go in the command log. so you could just trigger off of that...
 (so a no-op command that goes in the command log w/ a param and allows for attaching listeners? that seems weird... but maybe with some adjustment that's the right way to go.)
  
  
  
  something like a scatter-gather + stm, where you grab data from different urls in parallel and merge it into a data structure in a potentially overlapping fashion [photos from flickr plus tweets plus google news or something?, then arranged in circles that overlap or move?]
  
  
*/

// Daimio var keys match /^[-_A-Za-z0-9]+$/ but don't match /^[_-]+$/ -- i.e. at least one alphanumeric
// this way we've got lots of room for fancy options for keys, like #N
// and also we can use something like {value: 5, to: {!:__}} in our pipeline vars, where the ! means 'check the state'

if (typeof exports !== 'undefined') {

  //     mmh = require('murmurhash3')
  // 
  // var murmurhash = mmh.murmur128HexSync
     
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = D
  }
  exports.D = D
}

D.CHANNELS = {}


/* DECORATORS! */

D.DECORATORS = []
D.DecoratorsByType = {}
D.DecoratorsByBlock = {}
D.DecoratorsByTypeBlock = {}

D.addDecorator = function(block_id, type, value, unique) {
  var decorator = { block: block_id
                  , type: type
                  , value: value }
    , existing_decorators
  
  if(unique) {
    existing_decorators = D.getDecorators(block_id, type)
    if(existing_decorators && existing_decorators.length) {
      return existing_decorators[0]
    }
  }
  
  if(!D.DecoratorsByType[type]) {
    D.DecoratorsByType[type] = []
  }
  if(!D.DecoratorsByBlock[block_id]) {
    D.DecoratorsByBlock[block_id] = []
  }
  if(!D.DecoratorsByTypeBlock[type + '-' + block_id]) {
    D.DecoratorsByTypeBlock[type + '-' + block_id] = []
  }
  
  D.DECORATORS.push(decorator)
  D.DecoratorsByType[type].push(decorator)
  D.DecoratorsByBlock[block_id].push(decorator)
  D.DecoratorsByTypeBlock[type + '-' + block_id].push(decorator)
  
  return decorator
}

D.getDecorators = function(by_block, by_type) {
  var decorators = D.DECORATORS
  
  if(!by_block) {
    if(by_type) {
      decorators = D.DecoratorsByType[by_type]
    }
  }
  else {
    if(by_type) {
      decorators = D.DecoratorsByTypeBlock[by_type + '-' + by_block]
    } else {
      decorators = D.DecoratorsByBlock[by_block]
    }
  }
  
  return decorators
}


/* PORTS! */

D.PORTFLAVOURS = {}

// A port flavour has a dir [in, out, out/in, in/out (inback outback? up down?)], and dock and add functions


/*
  space ports to add: up, down, EXEC, INIT, SEED
  stations have one dock but multiple depart ports... there's technically no reason they couldn't also have multiple implicit dock ports, although oh right. ALWAYS ONLY ONE DOCK, because it's triggered by an async event (ship arriving), but everything inside is dataflow so requires *all* inputs before processing. having only one input bridges that gap. if your block is super complicated, break it into multiple stations in a space...
  so: 
  - a port w/o a pair and w/ a station is special-cased in port.enter
  - a port w/o a pair and w/o a station is errored in port.enter
  - otherwise port.enter calls port.pair.exit
  - for port pairs on the 'outside', a special outside-pair fun is activated at pairing time
  - likewise those ports have a special outside-exit fun
  - a regular space port on the outside doesn't have either of those, so it functions like a disconnected port [nothing enters, exit is noop]
*/


D.track_event = function(type, target, callback) {
  if(!D.Etc.events)
    D.Etc.events = {}
  
  if(!D.Etc.events[type]) {
    D.Etc.events[type] = {by_class: {}, by_id: {}}
    
    document.addEventListener(type, function(event) {
      var target = event.target
        , listener = tracked.by_id[target.id]
        , cname = target.className
      
      if(!listener && cname) {
        if(cname.baseVal != undefined)
          cname = cname.baseVal
        cname.split(/\s+/).forEach(function(name) {
          listener = listener || tracked.by_class[name] // TODO: take all matches instead of just first
        })
      }
      // listener = listener || tracked.by_class[target.className]
      
      if(listener) {
        event.stopPropagation() // THINK: not sure these are always desired...
        event.preventDefault()
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

D.send_value_to_js_port = function(to, value) {
  // THINK: this should require a space... right?
  
  try {
    document.dispatchEvent(new CustomEvent(to, { 'detail': value }))
  } catch(e) {
    // hack for old safari :(
    var event = document.createEvent('Event')
    event.initEvent(to, true, true)
    event.detail = value
    document.dispatchEvent(event)
  }
}


// THINK: this makes the interface feel more responsive on big pages, but is it the right thing to do?
D.port_standard_exit = function(ship) { 
  var self = this
  
  if(this.space)
    setImmediate(function() { self.outs.forEach(function(port) { port.enter(ship) }) })
  else
    self.outside_exit(ship) // ORLY? No delay?
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
    return D.setError('Every port must have a pair or a station')

  this.space.dock(ship, this.station) // THINK: always async...?
}


D.import_port_type = function(flavour, pflav) {
  if(D.PORTFLAVOURS[flavour])
    return D.setError('That port flavour has already been im-port-ed')
  
  // TODO: just use Port or something as a proto for pflav, then the fall-through is automatic
  
  if(!pflav)
    return D.setError('That flavour is not desirable')

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
  //   return D.setError("That port flavour's properties are invalid")
  
  D.PORTFLAVOURS[flavour] = pflav
  return true
}




/* FANCIES! */

D.FANCIES = {}
D.FancyRegex = ""
D.import_fancy = function(ch, obj) {
  if(typeof ch != 'string') return D.onerror('Fancy character must be a string')
  // ch = ch[0] // only first char matters
  if(!D.FANCIES[ch]) {
    // TODO: check obj.eat
    D.FANCIES[ch] = obj
  } else {
    D.setError('Your fancies are more borken')
  }
  
  D.FancyRegex = RegExp(Object.keys(D.FANCIES)
                                 .sort(function(a, b) {return a.length - b.length})
                                 .map(function(str) {return '^' + D.Etc.regex_escape(str) + '\\w'})
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
      D.setError('Only __ and __in are allow to start with __')
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



/* TERMINATORS! */

D.terminators = {}
D.Tglyphs = ""
D.import_terminator = function(ch, obj) {
  if(typeof ch != 'string') return D.onerror('Terminator character must be a string')
  // ch = ch[0] // only first char matters
  if(!D.terminators[ch]) D.terminators[ch] = []
  D.terminators[ch].push(obj)
  D.Tglyphs += ch
}

// TODO: these should do more than just return a fancy parser...

D.terminate = function(ch, verb, params) {
  if(!D.terminators[ch]) return false
  var fun, terminators = D.terminators[ch]
  
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

D.import_terminator('→', { // send [old]
  eat: function(stream, state) {
    /// dum dum dum herpderp
  }
})



/* ALIASES! */

D.import_models = function(new_models) {
  for(var model_key in new_models) {
    var model = new_models[model_key]
    if(!D.commands[model_key]) {
      D.commands[model_key] = model
    } 
    else {
      D.extend(D.commands[model_key]['methods'], model['methods'])
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



/* TYPES! */

// Daimio's type system is dynamic, weak, and latent, with implicit user-definable casting via type methods.
D.add_type = function(key, fun) {
  // TODO: add some type checking
  D.Types[key] = fun
};


D.add_type('string', function(value) {
  if(D.isBlock(value)) {
    return D.block_ref_to_string(value)
  }
  
  if(typeof value == 'string') value = value
  else if(typeof value == 'number') value = value + ""
  else if(typeof value == 'boolean') value = "" // THINK: we should only cast like this on output...
  else if(value && typeof value == 'object') value = JSON.stringify(value, function(key, value) {if(value===null) return ""; return value}) // OPT: sucking nulls out here is probably costly
  else if(value && value.toString) value = value.toString()
  else value = ''
  
  return value
})

D.add_type('number', function(value) {
  if(typeof value == 'number') value = value
  else if(typeof value == 'string') value = +value
  // else if(typeof value == 'object') value = Object.keys(value).length // THINK: this is a little weird
  else value = 0

  return value
})

D.add_type('integer', function(value) {
  value = D.Types['number'](value) // TODO: make a simpler way to call these
  
  return Math.round(value)
})

D.add_type('anything', function(value) {
  if(!D.isNice(value)) return ""
  return value // THINK: what about blocks? 
})

D.add_type('array', function(value) { // ugh...
  return D.toArray(value)
})

D.add_type('list', function(value) {
  if(value && typeof value === 'object') 
    return value.type == 'Block' ? [value] : value
  return D.toArray(value)
})

D.add_type('maybe-list', function(value) {
  if(value === false || !D.isNice(value))
    return false
  else
    return D.Types['list'](value)
})

D.add_type('block', function(value) {
  if(D.isBlock(value)) {
    // value is a block ref...
    return function(prior_starter, scope, process) {
      // TODO: check value.value.id first, because it might not be in ABLOCKS
      // TODO: how does this fit with parent processes and parallelization? 
      space = process ? process.space : D.ExecutionSpace
      if(process && process.state && process.state.secret) { // FIXME: this seems really quite silly
        scope.parent_process = process
        scope.secret = process.state.secret
      }
      return space.REAL_execute(D.ABLOCKS[value.value.id], scope, prior_starter) 
    }
  }
  else {
    return function() {
      return D.stringify(value) // strings just fire away
    }
    // value = D.stringify(value)
    // return function(prior_starter) {
    //   return prior_starter(value) // strings just fire away
    // }
  }
})

D.add_type('either:block,string', function(value) {
  if(D.isBlock(value)) {
    return D.Types['block'](value)
  } else {
    return D.Types['string'](value)
  }
})

// [string] is a list of strings, block|string is a block or a string, and ""|list is false or a list (like maybe-list)


// D.run is a serialized endpoint. Most gateways are also. If you want raw data use spacial execution
D.run = function(daimio, ultimate_callback, space) {
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



// Find some positions for a variable path... then mod them with a callback, in-place
/*

  Okay. This is ridiculous.
  
  We want to run fun over every path-matching item in base.
  Path can contain arrays and wildcards.
  If base doesn't contain a path segment we'll create it. [optionally]
  We also want to use this to gather items... so maybe a wrapper where fun is an closured accumulator?
  This is essentially recursive walk, without the recursion and with our crazy pathing semantics.

  $foo.(:a :b "*") is weird, because it gives you back ($foo.a $foo.b $foo.*)... but if that's what you want ok.
  
  on last words, do foo(value[word]) for all values and all words [or the appropriate eq]
  otherwise, return [value[word]] for all values for all words


  D.Pathfinders = [{
    is_it_in_here?
    get_all_the_ones_that_are_in_here [and return safe refs to them]
    run some fun over everything in here
  },{...},...]
  
  so. given a tree, we want to run a selection function over it and put nodes on our todo queue. 
    (in this case the selector changes based on tree layer.)
    (also we might create nodes where they don't exist, or modify existing nodes [like 5->() ])
  then we want to run a different fun over each "finally left leaf", whatever that means.

  
  A: DON'T OPTIMIZE
  B: DO PEEK ONLY, NOT POKE
  C: ONLY DO WHAT YOU NEED

*/

D.Pathfinders = []
D.import_pathfinder = function(name, pf) {
  if(typeof pf.keymatch != 'function')
    pf.keymatch = function(key) {return false} // return false if N/A, 'one' if you're singular, otherwise 'many'
   
  if(typeof pf.gather != 'function')
    pf.gather = D.identity // returns a list of all matched items
  
  pf.name = name
  
  D.Pathfinders.push(pf)
  // find returns a list of matching items, empty for none, null for N/A [or value/null, if amount is one]
}

// TODO: lookahead matching (does nothing in create mode?)
// TODO: go up one level (is this the same as capture/boxing?)
// TODO: filter by daimio code (does nothing in create mode?)


D.peek = function(base, path) {
  path = D.toArray(path)
  
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
      return D.setError('No matching pathfinder was found')
    
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

// TODO: generalize this more so it runs a callback function instead of setting a static value
// TODO: have a callback for branch creation as well, then combine this with peek
// YAGNI: seriously, just get it done and stop abstracting.

// NOTE: this mutates *in place* and returns the mutated portion (mostly to make our 'list' pathfinder simpler)
D.poke = function(base, path, value) {
  path = D.toArray(path)
  
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
      return D.setError('No matching pathfinder was found')
    
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



// NOTE: this extends by reference, but also returns the new value
D.extend = function(base, value) {
  for(var key in value) {
    if(!value.hasOwnProperty(key)) continue
    base[key] = value[key]
  }
  return base
}

// NOTE: this extends by reference, but also returns the new value
D.recursive_extend = function(base, value) {
  for(var key in value) {
    if(!value.hasOwnProperty(key)) continue
    
    if(typeof base[key] == 'undefined') {
      base[key] = value[key]
      continue
    }
    
    if(typeof base[key] != 'object') continue  // ignore scalars in base
    
    if(typeof value[key] != 'object') continue // can't recurse into scalar
    
    if(Array.isArray(base) && Array.isArray(value)) {
      if(base[key] == value[key]) continue
      base.push(value[key])
      continue // THINK: this bit is pretty specialized for my use case -- can we make it more general?
    }
    
    D.recursive_extend(base[key], value[key])
  }
  
  return base
}


// apply a function to every leaf of a tree, but generate a new copy of it as we go
// THINK: only used by D.deep_copy, which we maybe don't need anymore
D.recursive_leaves_copy = function(values, fun, seen) {
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
      if(D.isBlock(val)) {
        new_values[key] = fun(val); // blocks are immutable
      } else if(typeof val == 'object') {
        new_values[key] = D.recursive_leaves_copy(val, fun, seen);
      } else {
        new_values[key] = fun(val);
      }
    // } catch(e) {D.onerror(e)}
  }

  return new_values;
};


// DFS over data. apply fun whenever pattern returns true. pattern and fun each take one arg.
// NOTE: no checks for infinite recursion. call D.scrub_var if you need it.
// D.recursive_walk = function(data, pattern, fun) {
//   var true_pattern = false
//   
//   try {
//     true_pattern = pattern(data) // prevents bad pattern
//   } catch (e) {}
//   
//   
//   if(true_pattern) {
//     try {
//       fun(data) // prevents bad fun
//     } catch (e) {}
//   }
//   
//   if(!data || typeof data != 'object') return
//   
//   for(var key in data) {
//     if(!data.hasOwnProperty(key)) return
//     D.recursive_walk(data[key], pattern, fun)
//   }
// }

// run every function in a tree (but not funs funs return)
// D.recursive_run = function(values, seen) {
//   if(D.isBlock(values)) return values;
//   if(typeof values == 'function') return values();
//   if(!values || typeof values != 'object') return values;
//   
//   seen = seen || []; // only YOU can prevent infinite recursion...
//   if(seen.indexOf(values) !== -1) return values;
//   seen.push(values);
// 
//   var new_values = (Array.isArray(values) ? [] : {});
//   
//   for(var key in values) {
//     var value = values[key];
//     if(typeof value == 'function') {
//       new_values[key] = value();
//     }
//     else if(typeof value == 'object') {
//       new_values[key] = D.recursive_run(value, seen);
//     }
//     else {
//       new_values[key] = value;
//     }
//   }
//   return new_values;
// };

// NOTE: defunctionize does a deep clone of 'values', so the value returned does not == (pointers don't match)
// THINK: there may be cases where this doesn't actually deep clone...

// run functions in a tree until there aren't any left (runs funs funs return)
// D.defunctionize = function(values) {
//   if(!values) return values; // THINK: should we purge this of nasties first?
// 
//   if(values.__nodefunc) return values;
//   
//   if(D.isBlock(values)) return values.run(); // THINK: D.defunctionize(values.run()) ??  
//   if(typeof values == 'function') return D.defunctionize(values());
//   if(typeof values != 'object') return values;
//   
//   var new_values = (Array.isArray(values) ? [] : {});
// 
//   // this is a) a little weird b) probably slow and c) probably borked in old browsers.
//   Object.defineProperties(new_values, {
//     __nodefunc: {
//       value: true, 
//       enumerable:false
//     }
//   });
//   
//   for(var key in values) {
//     var value = values[key];
//     if(typeof value == 'function') new_values[key] = D.defunctionize(value());
//     else if(typeof value == 'object') new_values[key] = D.defunctionize(value); 
//     else new_values[key] = value;
//   }
//   
//   return new_values;
// };

// walk down into a list following the path, running a callback on each end-of-path item
// D.recursive_path_walk = function(list, path, callback, parent) {
//   if(typeof list != 'object') {
//     if(!path) callback(list, parent); // done walking, let's eat
//     return; 
//   }
// 
//   // parents for child items
//   // THINK: this is inefficient and stupid...
//   var this_parent = {'parent': parent};
//   for(var key in list) {
//     this_parent[key] = list[key];
//   }
// 
//   // end of the path?
//   if(!path) {
//     for(var key in list) {
//       callback(list[key], this_parent);
//     }
//     return; // out of gas, going home
//   }
// 
//   var first_dot = path.indexOf('.') >= 0 ? path.indexOf('.') : path.length;
//   var part = path.slice(0, first_dot); // the first bit
//   path = path.slice(first_dot + 1); // the remainder
// 
//   if(part == '*') {
//     for(var key in list) {
//       D.recursive_path_walk(list[key], path, callback, this_parent);
//     }
//   } else {
//     if(typeof list[part] != 'undefined') {
//       D.recursive_path_walk(list[part], path, callback, this_parent);
//     }
//   }
// };

// this is different from recursive_merge, because it replaces subvalues instead of merging
D.recursive_insert = function(into, keys, value) {
  // THINK: we're not blocking infinite recursion here -- is it likely to ever happen?
  if(!into || typeof into != 'object') into = {};
  
  if(typeof keys == 'string') keys = keys.split('.');
  
  if(keys.length) {
    var key = keys.shift();
    into[key] = D.recursive_insert(into[key], keys, value);
  }
  else {
    into = value;
  }
  
  return into;
};


// deep copy an internal variable (primitives and blocks only)
// NOTE: this is basically toPrimitive, for things that are already primitives. 
D.deep_copy = function(value) {
  if(!value || typeof value != 'object') return value; // number, string, or boolean
  if(D.isBlock(value)) return value; // blocks are immutable, so pass-by-ref is ok.
  return D.recursive_leaves_copy(value, D.deep_copy);
};

// copy and scrub a variable from the outside world
D.scrub_var = function(value) {
  try {
    return JSON.parse(JSON.stringify(value)); // this style of copying is A) the fastest deep copy on most platforms and B) gets rid of functions, which in this case is good (because we're importing from the outside world) and C) ignores prototypes (also good).
  } catch (e) {
    // D.onerror('Your object has circular references'); // this might get thrown a lot... need lower priority warnings
    value = D.mean_defunctionize(value);
    if(value === null) value = false;
    return value;
  }
};

// this is like defunc, but not as nice -- it trashes funcs and snips circular refs
D.mean_defunctionize = function(values, seen) {
  if(!D.isNice(values)) return false;
  if(!values) return values;

  if(typeof values == 'function') return null;
  if(typeof values != 'object') return values;            // number, string, or boolean
  
  var sig = values.constructor.toString().slice(0,12)     // prevents DOM yuckyucks. details here:
  if ( sig == "function Nod"                              // https://github.com/dxnn/daimio/issues/1
    || sig == "function HTM"                              // THINK: can this still leak too much info?
    || sig == "function win" 
    || sig == "function Win" 
    || sig == "function Mim" 
    || sig == "function DOM" )    
       return null

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


// D.execute = function(handler, method, params, prior_starter, process) {
//   var dialect = D.OuterSpace.dialect
//     , real_handler = dialect.get_handler(handler)
//     , real_method = dialect.get_method(handler, method)
//   
//   return real_method.fun.apply(real_handler, params, prior_starter, process)
// }


// D.Parser.split_string = function(string) {
//   var chunks = []
//     , chunk = ""
//   
//   while(chunk = D.Parser.get_next_thing(string)) {
//     string = string.slice(chunk.length)
// 
//     if(chunk[0] == D.command_open)
//       chunk = {block: chunk}
//       
//     chunks.push(chunk)
//   }
//   
//   /* "asdf {begin foo | string reverse} la{$x}la {end foo}{lkdjfj} askdfj" ==>
//        ["asdf ", 
//         {block: "{begin foo | string reverse} la{$x}la {end foo}"}, 
//         {block: "{lkdjfj}"}, 
//         " askdfj"]
//   */
//   
// 
//   return chunks
// }

D.Parser.get_next_thing = function(string, ignore_begin) {
  var first_open, next_open, next_closed
  
  first_open = next_open = next_closed = string.indexOf(D.command_open);
  
  if(first_open == -1) return string  // no Daimio here
  if(first_open > 0) return string.slice(0, first_open)  // trim non-Daimio head

  do {
    next_open = string.indexOf(D.command_open, next_open + 1)
    next_closed = string.indexOf(D.command_closed, next_closed) + 1
  } while(next_closed && next_open != -1 && next_closed > next_open)

  // TODO: add a different mode that returns the unfulfilled model / method etc (for autocomplete)
  if(!next_closed) {
    D.onerror("No closing brace for '" + string + "'")
    return string
  }

  if(ignore_begin || string.slice(0,7) != D.command_open + 'begin ')
    return string.slice(0, next_closed)  // not a block

  var block_name = string.match(/^\{begin (\w+)/)
  if(!block_name) {
    // FIXME: handle this situation better
    D.onerror(string, 'Something weird happened')
    return string
  }
  block_name = block_name[1];
  
  var end_tag = D.command_open + 'end ' + block_name + D.command_closed
    , end_begin = string.indexOf(end_tag)
    , end_end = end_begin + end_tag.length;
    
  if(!end_begin) {
    // FIXME: handle this situation better
    D.onerror(string, "No end tag for block '" + block_name + "'");
    return string;
  }
  
  // THINK: we're going to go ahead and deal with the block right here... is this the right place for this?
  // No, no it really isn't
  
  return string.slice(0, end_end);
}


D.Parser.string_to_block_segment = function(string) {
  // HACK FOR SPECIAL CASE
  if(string == '{__}')
    string = '{__ | __}'
  
  var segment = D.Parser.segments_to_block_segment(D.Parser.string_to_segments(string))
    , block_id = segment.value.id
    // , decorators = D.getDecorators(block_id)
  
  D.addDecorator(block_id, 'OriginalString', string, true)
  // if(!decorators) {
  //   // TODO: check to ensure there's already an OriginalString for this
  //   // TODO: refactor
  //   // TODO: don't be dum
  //   decorators = (D.DECORATORS[block_id] = [])
  //   decorators.push({type: 'OriginalString', value: string})
  // }
    
  return segment
}

D.Parser.segments_to_block_segment = function(segments) {
  var wiring = {}
  
  segments = D.mungeLR(segments, D.TRANSFORMERS.Rekey)
  
  // TODO: refactor this into get_wiring or something
  for(var i=0, l=segments.length; i < l; i++) {
    var segment = segments[i]
    
    if(segment.inputs && segment.inputs.length) {
      wiring[segment.key] = segment.inputs
    }
    
    delete segment.key
    delete segment.prevkey
    delete segment.names
    delete segment.inputs
  }
  
  var block = new D.ABlock(segments, wiring)
    , segment = new D.Segment('Block', {id: block.id})
  
  return segment
}

D.Parser.pipeline_string_to_tokens = function(string, quoted) {
  var tokens = []
    , P = D.Parser
    , strings = []
  
  if(typeof string != 'string') 
    return string || []
  
  if(string.slice(0,7) == D.command_open + 'begin ') { // in a block
    var pipeline = D.Parser.get_next_thing(string, true)
      , block_name = pipeline.match(/^\{begin (\w+)/)[1] // TODO: this could fail
      , end_tag = D.command_open + 'end ' + block_name + D.command_closed
      , body = string.slice(pipeline.length, -end_tag.length)
      , segment = D.Parser.string_to_block_segment(body)

    pipeline = '"foo" ' + pipeline.slice(7+block_name.length, -1) // trim '{begin \w+' and trailing '}'
    strings = P.split_on_terminators(pipeline)
    strings[0] = '"' + body + '"'
  } 
  else {
    if(string[0] != '{' && string.slice(-1) != '}') {
      D.setError('That string is not a pipeline')
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
  
  if(chunk.length == string.length && chunk[0] == D.command_open) {
    // only one chunk, so make regular pipeline
    return D.Parser.pipeline_string_to_tokens(chunk)
  } 
  else {
    // make blockjoin
    do {
      string = string.slice(chunk.length)
      result = []

      if(chunk[0] == D.command_open) {
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


/// NOTE: this always returns an ARRAY of tokens!
D.Parser.lexify = function(string) {
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

// D.partially_apply = function(fun, arg, number) {
//   
// }

// D.maybe_call = function(member) {
//   return function(item) {
//     if(typeof item.member == 'function') {
//       return item.member()
//     }
//   }
// }

D.block_ref_to_string = function(value) {
  // var json = JSON.stringify(value)
  // return json.slice(1, -1) // JSON puts extra quotes around the string value that we don't want
  return value.toJSON()
}


/*
  each Transformer takes a left-set of segments, the segment in question, and a right-set of segments. 
  it returns the new left and right set. the next segment from the right set is then considered, until no items remain.
  for now, all the fancy and terminator code is stuffed into these two functions.
  TODO: split out the fancys and terminators so they're added like types.
*/
D.TRANSFORMERS = {}

D.TRANSFORMERS.Rekey = function(L, segment, R) {
  var old_key = segment.key
    , new_key = L.length
    
  // TODO: holymuckymuck, is this ever ugly and slow. clean me!
  for(var i=0, l=R.length; i < l; i++) {
    var future_segment = R[i]
      , index
      
    if(future_segment.inputs) {
      while(true) {
        index = future_segment.inputs.indexOf(old_key)
        if(index == -1) break
        future_segment.inputs[index] = new_key
      }
    }
  }

  segment.key = new_key
  return [L.concat(segment), R]
}


D.ABlock = function(segments, wiring) {
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
  
  this.segments = segments
  this.wiring = wiring
  
  var json = JSON.stringify(this)
    , hash = murmurhash(json)
    
  // THINK: take this out and put it elsewhere? or... how is block access limited? or... huh.
  if(!D.ABLOCKS[hash])
    D.ABLOCKS[hash] = this
  
  this.id = hash
}

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


D.Token = function(type, value) {
  this.key = D.token_counter++
  this.type = type
  this.value = value
}

D.Segment = function(type, value, token) {
  this.type = type || 'String'
  this.value = D.isNice(value) ? value : ""
  
  if(!token) 
    token = {}
  
  this.prevkey = token.prevkey || false
  this.names = token.names || []
  this.inputs = token.inputs || []
  this.key = token.key || false

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

// THINK: how do we allow storage / performance optimizations in the segment structure -- like, how do we fill in the params ahead of time? 


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

    if(string.indexOf(D.command_open) != -1)
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

    if(string.indexOf(D.command_open) == -1)
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
      , decorators = D.getDecorators(block_id, 'OriginalString')
      
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

    return D.dataTrampoline(inputs, processfun, D.string_concat, prior_starter)
  }
}

D.SegmentTypes.Pipeline = {
  try_lex: function(string) {
    if(string[0] != D.command_open || string.slice(-1) != D.command_closed)
      return string

    return new D.Token('Pipeline', string)
  }
, munge_tokens: function(L, token, R) {
    var new_tokens = D.Parser.string_to_tokens(token.value)
    
    var last_replacement = new_tokens[new_tokens.length - 1]
    
    if(!last_replacement){
      // D.setError('The previous replacement does not exist')
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

    if(D.FancyRegex.test(string)) 
      return new D.Token('Fancy', string)

    return string
  }
, munge_tokens: function(L, token, R) {
    // var glyph = token.value.slice(0,1)
    var glyph = token.value.replace(/^([^a-z0-9.]+).*/i, "$1")
  
    if(!D.FANCIES[glyph]) {
      D.setError('Your fancies are borken:' + glyph + ' ' + token.value)
      return [L, R]
    }

    var new_tokens = D.FANCIES[glyph].eat(token)
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
      , new_key = segment.inputs[0]  //segment.prevkey
      , key_index
  
    if(type == 'space') // space vars have to be set at runtime
      return [L.concat(segment), R]
  
    // but pipeline vars can be converted into wiring
    R.filter(function(future_segment) { return future_segment.type == 'Variable' 
                                            && future_segment.value.name == name })
     .forEach(function(future_segment) { 
       if(future_segment.value.prevkey)
         return D.setError('Pipeline variables may be set at most once per pipeline')
       future_segment.value.prevkey = new_key
     })
  
    // and likewise for anything referencing this segment 
    R.forEach(function(future_segment) { // but others can be converted into wiring
      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = new_key
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
      , my_station = process.space.station_id
      , port = process.space.ports.filter(function(port) {
                 return (port.name == to && port.station === my_station) // triple so undefined != 0
               })[0] 
    
    // TODO: check not only this station but outer stations as well, so we can send to ports from within inner blocks. but first think about how this affects safety and whatnot
    
    if(port) {
      if(my_station === undefined) { // HACK
        port.enter(inputs[0], process) // weird hack for exec spaces
      } else {
        port.exit(inputs[0], process) 
      }
    }
    else {
      D.setError('Invalid port " + to + " detected')
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
    if(segment.value.type == 'space') // space vars have to be collected at runtime
      return [L.concat(segment), R]
  
    var my_key = segment.key
      , new_key = segment.value.prevkey
      , key_index

    // TODO: if !R.length, wire __out to the value [otherwise {2 | >foo | "" | _foo} doesn't work]
  
    if(!new_key && !R.length) // some pipeline vars have to be collected then too
      return [L.concat(segment), R]

    if(!new_key)
      new_key = segment.value.name
    
    R.forEach(function(future_segment) { // but others can be converted into wiring
      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = new_key
    })
  
    return [L, R]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var type = segment.value.type
      , name = segment.value.name
      , value = ''
      , clone = true // OPT: figure when this can be false and make it that way
      
    if(type == 'space')
      value = process.space.get_state(name)
    else if(type == 'pipeline')     // in cases like "{__}" or "{_foo}" pipeline vars serve as placeholders,
      value = process.state[name]   // because we can't push those down to bare wiring. [actually, use __out]
      
    if(!D.isNice(value))
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
      { 111 | *>a | (*a *a *a)}

      { 111 | __pipe }                         | > these both are shortened to __
      { (1 1 1) | each block "{__in}"}         | > but they mean different things

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
    if(segment.value == '__in' || (!R.length && segment.prevkey == '__in')) {
      segment.type = 'Variable'
      segment.value = {type: 'pipeline', name: '__in'}
      return [L.concat(segment), R]
    }
    
    R.forEach(function(future_segment) {
      var pipe_index = future_segment.names.indexOf('__pipe__')
        , this_key = new_key
        , key_index

      // this is to handle our strangely done aliases // THINK: really only for those?
      if(    new_key    != '__in'                               // not 'first'
          && pipe_index != -1                                  // is piped
          && my_key     != future_segment.inputs[pipe_index])  // and not piped to pipevar?
        this_key = future_segment.inputs[pipe_index]           // then keep on piping 

      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = this_key
    })
    
    // handles the weird case of {(1 2 3) | map block "{__ | __}"}
    if(R.length && R[0].type == 'PipeVar')
      R[0].prevkey = new_key
    
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
, execute: function(segment) {
    // nor this
  }
}

D.SegmentTypes.Command = {
  try_lex: function(string) {
    if(!/[a-z]/.test(string[0])) // TODO: move all regexs into a single constants farm
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
    
    if(items.length == 1) {  // {math}
      token.type = 'Alias'
      token.value = {word: items[0]}
      items = []
    }

    else if(items.length == 2) {
      if(/^[a-z]/.test(items[1])) {  // {math add}
        token.type = 'Command'
        token.value = {Handler: items[0], Method: items[1]}
      }
      else {  // {add 1}
        token.type = 'Alias'
        token.value = {word: items[0]}
        token.names.push('__alias__')
        
        var value = items[1]
          , some_tokens = D.Parser.strings_to_tokens(value)
          , some_token = some_tokens[some_tokens.length - 1] || {}
        
        token.inputs.push(some_token.key || null)
        new_tokens = new_tokens.concat(some_tokens)
        // new_tokens = new_tokens.concat(D.Parser.strings_to_tokens(items[1]))
      }

      items = []
    }

    else if(!/^[a-z]/.test(items[1])) {  // {add 1 to 3}
      token.type = 'Alias'
      token.value = {word: items[0]}
      items[0] = '__alias__'
    }
    else if(!/^[a-z]/.test(items[2])) {  // {add to 1}
      token.type = 'Alias'
      token.value = {word: items[0]}
      items.shift() // OPT: these shifts are probably slow...
    }
    else {  // {math add value 1}
      // collect H & M
      token.type = 'Command'
      token.value = { Handler: items.shift()
                    , Method: items.shift()}
    }

    // collect params
    while(items.length) {
      var word = items.shift()

      if(!/^[a-z]/.test(word) && word != '__alias__') { // ugh derp
        D.setError('Invalid parameter name "' + word + '" for "' + JSON.stringify(token.value) + '"')
        if(items.length)
          items.shift()
        continue
      }

      if(!items.length) { // THINK: ???
        // params[word] = null
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
      
      // params[word] = D.Parser.strings_to_tokens(value)[0] // THINK: is taking the first one always right?
    }
    
    for(var i=0, l=new_tokens.length; i < l; i++) {
      if(!new_tokens[i].prevkey)
        new_tokens[i].prevkey = token.prevkey
    }
    
    // if(!new_tokens.length)
    //   return [L.concat(token), R]
      
    token.done = true

    // for(var i=0, l=new_tokens.length; i < l; i++)
    //   token.inputs.push(new_tokens[i].key)

    return [L, new_tokens.concat(token, R)] // aliases need to be reconverted even if there's no new tokens
  }
, token_to_segments: function(token) {
    token.value.names = token.names
    // TODO: suck out any remaining null params here
    return [new D.Segment(token.type, token.value, token)]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var handler = dialect.get_handler(segment.value.Handler)
      , method = dialect.get_method(segment.value.Handler, segment.value.Method)

    if(!method) {
      // THINK: error?
      D.setError('You have failed to provide an adequate method: ' + segment.value.Handler + ' ' + segment.value.Method)
      return "" // THINK: maybe {} or {noop: true} or something, so that false flows through instead of previous value
    }
    
    var piped = false
      , params = []
      , errors = []
      , typefun
    
    // build paramlist, a properly ordered list of input values
    for(var index in method.params) {
      var method_param = method.params[index]
      var param_value = undefined
      var key = method_param.key
      var name_index = segment.value.names.indexOf(key)
      
      if(name_index != -1) {
        param_value = inputs[name_index]
      }
      
      if(!piped && !D.isNice(param_value)) {
        name_index = segment.value.names.indexOf('__pipe__')
        piped = true
        if(name_index != -1) {
          param_value = inputs[name_index]
        }
      }
  
      if(method_param.type && D.Types[method_param.type])
        typefun = D.Types[method_param.type]
      else
        typefun = D.Types.anything
  
      if(param_value !== undefined) {
        param_value = typefun(param_value)
      }
      else if(method_param.fallback) {
        param_value = typefun(method_param.fallback)
      }
      else if(method_param.required) {
        errors.push('Missing required parameter "' + method_param.key + '" for command "' + segment.value.Handler + " " + segment.value.Method + '"')
        param_value = typefun(undefined)
      }
      else if(!method_param.undefined) {
        param_value = typefun(undefined)
      }
      
      params.push(param_value)
    }
      
    if(!errors.length) {
      return method.fun.apply(handler, params.concat(prior_starter, process))
    } else {
      errors.forEach(function(error) {
        D.setError(error)
      })
      return ""
    }
  }
}

D.SegmentTypes.Alias = {
  try_lex: function(string) {
    return new D.Token('Command', string) // THINK: this is weird...
    // return new D.Token('Alias', string) // NOTE: this has to run last...
  }
, munge_tokens: function(L, token, R) {
    var new_tokens = D.Aliases[token.value.word]
    
    if(!new_tokens) {
      D.setError("The alias '" + token.value.word + "' stares at you blankly")
      return [L, R]
    }
    
    new_tokens =  D.clone(new_tokens)

    // alias keys are low numbers and conflict with rekeying...
    // segments = D.mungeLR(segments, D.TRANSFORMERS.Rekey)
    

    // fiddle with wiring
    
    var last_replacement = new_tokens[new_tokens.length - 1]
    
    if(!last_replacement) {
      // first in line, so no previous wiring... curiously, this works in {(1 2 3) | map block "{add __ to 3}"}
      return [L, R]
    }
    
    last_replacement.key = token.key
    last_replacement.prevkey = token.prevkey
    // last_replacement.inputs.concat(token.inputs)
    // last_replacement.names.concat(token.names)
    
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


// D.Parser.try_begin = function(string) {
//   var matches = string.match(/^begin (.?\w+)/)
//   if(!matches) return string
//   
//   return [new D.Segment('Begin', matches[1])]
// }


// D.Dialect = function(models, aliases, parent) {
D.Dialect = function(commands, aliases) {
  this.commands = commands ? D.deep_copy(commands) : D.commands
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

// D.dialect_get_handler = function(dialect, handler) {
//   if(  handler 
//     && dialect.commands
//     && dialect.commands[handler]
//     && dialect.commands[handler]
//   ) {
//     return dialect.commands[handler]
//   }
// 
//   return false
// }
// 
// D.dialect_get_method = function(dialect, handler, method) {
//   if(  handler 
//     && method
//     && dialect.commands
//     && dialect.commands[handler]
//     && dialect.commands[handler].methods
//     && dialect.commands[handler].methods[method]
//   ) {
//     return dialect.commands[handler].methods[method]
//   }
// 
//   return false
// }
// 
// 


/*
  We could consider having a NULL global value. nothing would return it. 
  undefined variables are NULL. a param set to NULL like {math add value (1 2 3) to NULL} will drop the param (so that would return 6). as opposed to {math add value (1 2 3) to FALSE} which would return (1 2 3) or {math add value (1 2 3) to TRUE} which would return (2 3 4)

  yuck type conversions yuck yuck. 
  maybe just NULL and not TRUE/FALSE? what's the use case for those again?
*/

D.get_block = function(ablock_or_segment) {
  if(!ablock_or_segment)
    return new D.ABlock()
  if(ablock_or_segment.segments)
    return ablock_or_segment
  else if(ablock_or_segment.value && ablock_or_segment.value.id && D.ABLOCKS[ablock_or_segment.value.id])
    return D.ABLOCKS[ablock_or_segment.value.id]
  else
    return new D.ABlock()
}


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
  // TODO: check stations [array of id -> D.ABLOCKS]
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

D.sort_object_keys = function(obj, sorter) {
  if(typeof obj != 'object')
    return {}
    
  var newobj = {}
    , keys = Object.keys(obj).sort(sorter)
  
  for(var i=0, l=keys.length; i < l; i++)
    newobj[keys[i]] = obj[keys[i]]
  
  return newobj
}

D.recursive_sort_object_keys = function(obj, sorter) { // THINK: this allocates like a fiend
  if(typeof obj != 'object')
    return obj
  
  for(var key in obj)
    obj[key] = D.recursive_sort_object_keys(obj[key], sorter)
   
  return D.sort_object_keys(obj, sorter)
}

// D.dialect_add = function(dialect) {
//   dialect = JSON.parse(JSON.stringify(dialect)) // no refs, no muss
//   dialect = D.recursive_sort_object_keys(dialect)
//   
//   dialect.id = D.spaceseed_hash(dialect)
//   D.DIALECTS[dialect.id] = dialect
// 
//   return dialect.id
// }


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

D.Port = function(port_template, space) {
  var flavour = port_template.flavour
    , settings = port_template.settings
    , station = port_template.station
    , name = port_template.name
    , typehint = port_template.typehint
    
  var pflav = D.PORTFLAVOURS[flavour]
  
  if(!pflav)
    return D.setError('Port flavour "' + flavour + '" could not be identified')
  
  // if(D.PORTS[name])
  //   return D.setError('That port has already been added')
    
  if(!name)
    name = 'port-' + Math.random()
    
  // if(!space)
  //   return D.setError('Every port must have a space')
  
  var port = Object.create(pflav)
  
  port.outs = []
  port.name = name
  port.space = space 
  port.flavour = flavour
  port.station = station || undefined
  port.typehint = typehint
  port.settings = D.isNice(settings) ? settings : {}
  
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


// something about using []s and {}s to map something... _and_ vs _or_? it was really clever, whatever it was.


D.Space = function(seed_id, parent) {
  // the template a pointer to D.SPACESEEDS, which contains: id, dialect, state, ports, stations, subspaces, routes
  
  var seed = D.SPACESEEDS[seed_id]
    , self = this
  
  if(!seed)
    return D.setError('Invalid spaceseed')
    
  // TODO: validate parent
  
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
    
    
    // seed.ports.map(
    //                 function(port, index) {return port.space == subspace_index+1 ? index : false}  // 1-indexed
    //               ).filter(function(val) {return val !== false})

    subspace.ports
      .filter(function(port) {return port.space === subspace && !port.station}) // outer ports
      .forEach(function(port) {port_name_to_port[port.name].pairup(port)})
        // port.pairup(portmap[] self.ports.filter(function(my_port) {return my_port.})[0] )})
  })
  
  // revise dialect
  this.dialect = D.DIALECTS.top // TODO: this probably isn't right, but the timing gets weird otherwise
  
  if(this.parent) {
    var parent_dialect = this.parent.dialect ? this.parent.dialect : D.DIALECTS.top
    this.dialect = new D.Dialect(parent_dialect.commands, parent_dialect.aliases)
    // if(seed.dialect.commands && seed.dialect.commands.minus) {
    //   var minus = seed.dialect.commands.minus
    if(seed.dialect.commands && seed.dialect.minus) {
      var minus = seed.dialect.minus
      for(var key in minus) {
        var value = minus[key]

        if(value === true) {
          delete this.dialect.commands[key]
          continue
        }

        value.forEach(function(method) {
          try {
            delete this.dialect.commands[key].methods[method]
          } catch(e) {}
        })

      }
    }
    
  }

  // yoiks
  this.only_one_process = true
  this.processes = []
  this.listeners = []
  this.queue = []
  
  
  // var self = this
  // this.loading = true
  // this.template = template // TODO: validate template
  
  // this.id = template.id 
  // this.dialect = template.dialect

  // this.stations = []
  // ;(template.stations || []).forEach(this.add_station)
  // stations = stations.map(function(block_id) { return D.ABLOCKS[block_id] })

  // this.ports = []
  // ;(template.ports || []).filter(function(port) { return port.space == this.id })
  //                        .forEach(this.add_port) // add only my own ports
  
  
  // this.ports = ports
  // .map(function(port) {
  //   return port.space == id 
  //        ? new D.Port(self, port.flavour, port.settings, this.stations[port.station], port.name, port.typehint)
  //        : false
  // })
  
  // this.ports
  // .filter()
  // .forEach(function(port, i) { 
  //   ports[i].outs.forEach(function(index) { 
  //     port.add_out(self.ports[index]) 
  //   }) 
  // })
  
  
  
  // ask my parent to add its outs to my ports
  // if(parent)
  //   parent.hi_im_here_fill_my_ports_please(this, this.ports) // this adds me to parent.children, replaces parent's fake ports with my actual ports, and adds parents routes to my ports
  // else // i'm in outer space?
  //   this.foo = 123 
  
  // switch my ports outs to valid port links
  
  // except my child space's ports won't be valid yet...
  // oh, except i don't have to worry about those -- they don't need to be valid until my kids ask for port info, then we trade the port ref for the proper outs. okay, maybe that works? timing, though... timing. merglepuffs.
  
  // this.wiring = this.ports.map(function(port) {return port.outs})
                     // .filter(function(outs) {return outs.length}) // have to retain indices...
  
  
  // this.children = []
  
  // this.block = D.get_block(block)
  
  // THINK: validate id?
  
  // delete this.loading
}

D.Space.prototype.get_state = function(param) {
  return (typeof this.state[param] != 'undefined') ? this.state[param] : this.seed.state[param]
}

D.Space.prototype.dock = function(ship, station_id) {
  this.station_id = station_id
  
  var block_id = this.seed.stations[station_id - 1]
    , block = D.ABLOCKS[block_id]
    , output_port = this.ports.filter(function(port) {return port.station == station_id && port.name == '_out'})[0]
    , prior_starter = function(value) {output_port.exit(value)} // THINK: we're jumping straight to exit here. need to do the same for any implicit station output ports...
    , scope = {"__in": ship} // TODO: find something better...
    , value = this.execute(block, scope, prior_starter)
    
  if(value === value)
    prior_starter(value)
  
  // this.station_id = false // THINK: if we go async in here it toasts the station_id...
  // THINK: do we need to send back NaN? there's probably no callstack here to speak of...
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


// D.Space.prototype.here_have_some_ports_thanks = function(child_ports) {
//   // this adds me to parent.children, replaces parent's fake ports with my actual ports, and adds parents routes to my ports
//   this.children.push(child)
//   this.ports.filter(function(port) {return port.space == child})
//             .forEach()
// }

// D.Space.prototype.switch_template = function(template) {
//   // this gives me a new template, makes the needed changes, and tells my parent
//   // get deltas of old template and new template
//   // is this the right thing to do? this seems silly.
// }
// 
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
//     return D.setError('No such station found')
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


D.Space.prototype.deliver = function(message, prior_starter) {
  // execute the block, with the message loaded in as __
  var scope = {"__in": message} // TODO: find something better...
  this.execute(this.block, scope, prior_starter)
}

// TODO: move this all into a Process, instead of doing it here.
// THINK: there's no protection in here again executing multiple processes concurrently in the same space -- which is bad. find a way to bake that in. [except for those cases of desired in-pipeline parallelism, of course]
D.Space.prototype.execute = function(ablock_or_segment, scope, prior_starter, listeners) {
  var self = this
    , block = D.get_block(ablock_or_segment)
  
  // if(!when_done) {
  //   when_done = function(result) {
  //     // THINK: what should we do here?
  //     D.setError("No when_done callback sent to space.execute for result: " + D.stringify(result))
  //   }
  // }
  
  if(this.processes.length && this.only_one_process) {
    // NOTE: we kind of need this -- it keeps all the process requests in order (using JS's event loop) and clears our closet of skeletal callstacks
    var thunk = function() {
      var result = self.REAL_execute(block, scope, prior_starter, listeners)
      if(result === result)
        prior_starter(result) // we're asynced, but the process didn't know it
    }
    
    setImmediate(thunk)
    // setTimeout(thunk, 0)
    
    // this.queue.push(function() {
    //   self.REAL_execute(block, scope, prior_starter, when_done)
    // })
    return NaN
  }

  return self.REAL_execute(block, scope, prior_starter, listeners)
}

D.Space.prototype.REAL_execute = function(block, scope, prior_starter, listeners) {
  var self = this
    , process
    , result
  
  result = this.try_optimize(block, scope)
  if(result)
    return result.value
  
  // var new_when_done = function(value) {
  //   self.cleanup(self.pid, self.last_value)
  //   if(when_done)
  //     when_done(value)
  // }
  
  if(!prior_starter) {
    prior_starter = function() {}
  }
  
  // override the prior_starter here -- THIS function is the prior starter now. (basically, remember to cleanup after and fire the listeners.)

  var my_starter = function(value) {
    self.cleanup(process, listeners)
    prior_starter(value)
  }
    
  process = new D.Process(this, block, scope, my_starter)
  this.processes.push(process)
  
  try {
    result = process.run()
    self.cleanup(process, listeners)
  } catch(e) {
    D.setError(e.message)
    self.cleanup(process, listeners)
  }
  
  return result
}

D.Space.prototype.cleanup = function(process, listeners) {
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

// this returns an object containing a 'value' property if it succeeds. optimizers are probably imported like everything else and run in a pipeline. how does this play with downports? other station output ports?
D.Space.prototype.try_optimize = function(block, scope) {

  for(var i=0, l=D.Optimizers.length; i < l; i++) {
    var result = D.Optimizers[i].fun(block, scope)
    
    if(result)
      return result
  }
  
  // okay, but how do you chain multiple optimizations together? you want the later ones to accept the earlier ones as input, or something...
  
  return undefined
  // return {value: 'foo'}
}

D.Optimizers = []
D.import_optimizer = function(name, fun) {
  var opt = {
    name: name,
    fun: fun
  }
  
  D.Optimizers.push(opt)
  // fun returns {value: xyyzy} if it finds something, false otherwise
}

// figure out how to make this work -- you need to examine the station's routes for multiple outs, and capture the value from the process cleanup phase. if it goes async you should probably not capture, because it might be sleeping. so commands have a 'nomemo' tag?

//D.Etc.opt_memos = {}
//D.import_optimizer('memoize', function(block, scope) {
//  var memos = D.Etc.opt_memos
//  if(!memos[block.id])
//    memos[block.id] = {}
//
//  var block_memos = memos[block.id]
//    , scope_id = murmurhash(JSON.stringify(scope))
//    
//  if(typeof block_memos[scope_id] == 'undefined') { // first time through primes it
//    block_memos[scope_id] = true
//    return false
//  }
//  
//  if(!block_memos[scope_id])
//    return false
//  
//  if(block_memos[scope_id] == true) { // second time runs it
//    var result = 
//    block_memos[scope_id] = {value: result}
//  }
//    
//  return block_memos[scope_id] 
//})


// NOTE: these two aren't used:

// D.Space.prototype.run_listeners = function(value, listeners) {
//   listeners = listeners || this.listeners
//   if(value !== undefined) {
//     for(var i=0, l=listeners.length; i < l; i++) {
//       // listeners[i](value) // call the registered listeners
//       // THINK: do we really have to go async here? it's pretty costly. blech.
// 
//       ~ function() {var fun = listeners[i]; setImmediate(function() {fun(value)} )} ()
//       // ~ function() {var fun = listeners[i]; setTimeout(function() {fun(value)}, 0)} ()
//     }
//   }
// }

// D.Space.prototype.run_queue = function() {
//   if(this.queue.length) {
//     this.queue.pop()()
//   }
// }


/*
  A Process executes a single Block from start to finish, executing each segment in turn and handling the wiring.
  Returns the last value from the Block's pipeline, or passes that value to prior_starter() and returns NaN if any segments go async.
  Each Process is used only once, for that one Block execution, and then goes away.
  A Process may launch sub-processes, depending on the segments in the Block.
*/


D.Process = function(space, block, scope, prior_starter) {
  this.pid = D.process_counter++
  this.starttime = Date.now()
  this.current = 0
  this.space = space
  this.block = block
  // this.when_done = when_done
  this.prior_starter = prior_starter
  this.asynced = false
  
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
  
  output = D.isNice(output) ? output : "" // THINK: should probably do this for each possible output in the array form

  if(this.asynced) {
    this.asynced = false // ORLY??
    if(this.prior_starter)
      this.prior_starter(output)
    return undefined
  } 
  
  return output
}

D.Process.prototype.run = function() {
  var self = this
    , value = ""

  while(this.block.segments[this.current]) {
    value = this.next() // TODO: this is not a trampoline
    if(value !== value) {  
      this.asynced = true    
      return NaN // NaN is the "I took the callback route" signal...
    }
    self.last_value = value
    self.state[self.current] = value // TODO: fix this it isn't general
    self.current++
  }
  
  return this.done()
}

D.Process.prototype.next = function() {
  var self = this
    , segment = this.block.segments[this.current]
    , wiring = this.block.wiring
    , state = this.state

  if(!segment) {
    return "" // THINK: what?
    // return this.done()
  }
  
  var params = segment.paramlist || []
    , type = D.SegmentTypes[segment.type]
    , inputs = []
    , key = segment.key || this.current

  if(wiring[key]) {
    inputs = wiring[key].map(function(index) {return D.isNice(state[index]) ? state[index] : null}) // THINK: why null?
  }
  
  return type.execute(segment, inputs, this.space.dialect, this.my_starter, this)
}

// D.Process.prototype.bound_next = function() {
//   return this.next.bind(this)
// } 

// D.Process.prototype.reset = function() {
//   // THINK: this is probably a bad idea, but it makes debugging easier... can we reuse stacks?
//   this.last_value = null
//   this.pcounter = 0
// } 



//////// MORE HELPERS //////////

// D.trampoline = function(fun, then) {
//   var output = true
//   while (output) {output = fun()}
//   if(output === output) then()
// }

// might need a fun for sorting object properties...

/*
  This *either* returns a value or calls prior_starter and returns NaN.
  It *always* calls finalfun if it is provided.
  Used in small doses it makes your possibly-async command logic much simpler.
*/

D.dataTrampoline = function(data, processfun, joinerfun, prior_starter, finalfun) {
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
  
  return inner()
}

D.string_concat = function(total, value) {
  total = D.isNice(total) ? total : ''
  value = D.isNice(value) ? value : ''
  return D.stringify(total) + D.stringify(value)
}

D.list_push = function(total, value) {
  if(!Array.isArray(total)) return [] // THINK: is this always ok?
  value = D.isNice(value) ? value : ""
  total.push(value)
  return total
}

D.list_set = function(total, value, key) {
  if(typeof total != 'object') return {}
  
  var keys = Object.keys(total)
  if(!key) key = keys.length
  
  value = D.isNice(value) ? value : ""
  
  total[key] = value
  return total
}

D.scrub_list = function(list) {
  var keys = Object.keys(list)

  if(keys.reduce(function(acc, val) {if(acc == val) return acc+1; else return -1}, 0) == -1)
    return list
    
  return D.toArray(list)
}


D.Parser.split_on = function(string, regex, label) {
  if(typeof string != 'string') 
    return string
  
  if(!(regex instanceof RegExp))
    regex = RegExp('[' + D.Etc.regex_escape(regex) + ']')
  
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
  return D.Parser.split_on(string, D.Tglyphs, 'Terminator')
}

D.Parser.split_on_space = function(string) {
  return D.Parser.split_on(string, /[\s\u00a0]/)
}

// give each item its time in the sun. also, allow other items to be added, removed, reordered or generally mangled
D.mungeLR = function(items, fun) {
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



// HELPER FUNCTIONS
// THINK: some of these are here just to remove the dependency on underscore. should we just include underscore instead?

D.isFalse = function(value) {
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

D.isNice = function(value) {
  return !!value || value == false; // not NaN, null, or undefined
  // return (!!value || (value === value && value !== null && value !== void 0)); // not NaN, null, or undefined
};

// this converts non-iterable items into a single-element array
D.toArray = function(value) {
  if(Array.isArray(value)) return Array.prototype.slice.call(value); // OPT: THINK: why clone it here?
  if(typeof value == 'object') return D.obj_to_array(value);
  if(value === false) return []; // hmmm...
  if(!D.isNice(value)) return []; // double hmmm.
  return [value];
};

D.obj_to_array = function(obj) {
  var arr = [];
  for(key in obj) {
    arr.push(obj[key]);
  }
  return arr;
};

D.stringify = function(value) {
  return D.Types['string'](value)
}

D.execute_then_stringify = function(value, prior_starter, process) {
  if(D.isBlock(value)) {
    return D.Types['block'](value)(prior_starter, {}, process)
  } else {
    return D.stringify(value)
  }
}

D.isBlock = function(value) {
  if(!value instanceof D.Segment)
    return false // THINK: this prevents block hijacking (by making an object in Daimio code shaped like a block), but requires us to e.g. convert all incoming JSONified block segments to real segments.

  return value && value.type == 'Block' && value.value && value.value.id
}

D.Etc.isNumeric = function(value) {
  return (typeof(value) === 'number' || typeof(value) === 'string') && value !== '' && !isNaN(value)
}

D.Etc.toNumeric = function(value) {
  if(value === '0') return 0
  if(typeof value == 'number') return value
  if(typeof value == 'string') return +value ? +value : 0
  return 0
}

D.Etc.flag_checker_regex = /\/(g|i|gi|m|gm|im|gim)?$/

D.Etc.string_to_regex = function(string, global) {
  if(string[0] !== '/' || !D.Etc.flag_checker_regex.test(string)) {
    return RegExp(D.Etc.regex_escape(string), (global ? 'g' : ''))
  }
  
  var flags = string.slice(string.lastIndexOf('/') + 1)
  string = string.slice(1, string.lastIndexOf('/'))
  
  return RegExp(string, flags)
}

D.Etc.niceifyish = function(value, whitespace) {
  // this takes an array of un-stringify-able values and returns the nice bits, mostly
  // probably pretty slow -- this is just a quick hack for console debugging
  
  var purge = function(key, value) {
    try {
      JSON.stringify(value)
    } catch(e) {
      if(key && +key !== +key)
        value = undefined
    }
    return value
  }
  
  return JSON.stringify(value, purge, whitespace)
}




D.DIALECTS.top = new D.Dialect() // no params means "use whatever i've imported"

D.ExecutionSpace = 
  new D.Space(
    D.spaceseed_add(
      {dialect: {commands:{}, aliases:{}}, stations: [], subspaces: [], ports: [], routes: [], state: {}}))



/*
  lessons learned from JSTT presentation:
  - spacial structure code needs improvements
  - variable get/set needs sugar / rethinking (space vars are weird)
  - need space viz interface
  - partial application would be great
  - making new commands needs to be trivial
  - consuming incoming ships / pipeline param needs to be trivial: {foo x __.x y __.y} or {__ | >_(:x :y) | foo x _x y _y} or something
  - if types are disjoint maybe powerful commands are ok... (e.g. add) [static analysis is hard anyway]
  
  - interop w/ other libraries is good (simple wrapping mechanisms)
  - demos are really good
  - paper is maybe a good way to go... maybe excel also. 
  - CQ separation is good. return id from things that change state. don't for queries. bake this in deeply. "changing state" is a query in a sense, because we store the mutate events and can go back in time, so we're really changing the cached projection of those add-only events to the present time. (we can project to a moment in time but also over a particular set of events: what would this look like *now* with only events from *user 42*?)
  - start with an empty object, set state via events, cache the most recent projection for queries
  - objects are only data. commands are "methods". a query command might take one or more object ids and perform some calculation using that data. a command command (oy) might some object ids and perform an operation that changes state -- meaning it add events and reprocesses the projection.
  - making new commands has issues: 
    - you want to allow exec code to use them, but either all the command definitions have to be sent along each time or you have to have a response mechanism of "i don't understand/have that block" or you need to compile them down to bare commands
    - but then how do you do lens-type commands that have elevated permission? is it only done with ports instead? but then you lose the ability to override commands like math -> vectormath or something. 
    - how do you associate them with a dialect if they're created at runtime like in an exec?
    - how does the inherent input of a pipeline play with the command's pipeline vars? is this useful?
    - two different ways to add commands -- at compile time (can have different dialect underneath) and at runtime (just a function wrapper, compiled down to base commands before being sent)... 
    - or maybe you have to explicitly port requests to a higher oh we said that already
    
  - lambda explanation needs work... the quotes really throw people
  - maybe you can do audio etc nodes with a space that contains a single command in a station, like {osc $freq offset $offset id $node_id | >$ :node_id} and input ports that set $freq and $offset and retrigger the osc station (which SARs to the audio node manager), and then a special output port that sends the id of the node to oh wait maybe it doesn't need to be special? just send the id from the osc station. if you receive an audio node id, connect it, otherwise set it to that value (offset goes away, maybe... oy.)
  
  
*/




/*

  EVERYTHING BELOW HERE IS CRAZYPANTS

*/


D.make_some_space = function(stringlike) {
  return D.make_spaceseeds(D.seedlikes_from_string(stringlike))
}

D.seedlikes_from_string = function(stringlike) {
  var seedlikes = {}
    , seed_offset = -1
    , prop_offset = -1
    , seed_name = ''
    , this_seed = {}
    , continuation = ''
    , action = ''
    , action_name = ''
  
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
    
      if(this_offset > prop_offset) {
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
              D.setError('Port not found in line: ' + line)
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
            D.setError('Port not found in line: ' + line)
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
          D.setError('Invalid route: ' + route[0])
        if(!two)
          D.setError('Invalid route: ' + route[1])
        
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