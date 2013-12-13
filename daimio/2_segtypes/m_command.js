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
        token.value = {handler: items[0], method: items[1]}
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
      token.value = { handler: items.shift()
                    , method: items.shift()}
    }

    // collect params
    while(items.length) {
      var word = items.shift()

      if(!/^[a-z]/.test(word) && word != '__alias__') { // ugh derp
        D.set_error('Invalid parameter name "' + word + '" for "' + JSON.stringify(token.value) + '"')
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
    var handler, method
      , vhandler = segment.value.handler                 // TODO: this is not the right place for this optimization 
      , vmethod  = segment.value.method                  // -- or any optimization really.
      , cache    = dialect.cache                         // find a different home for it; 
                                                         // somewhere orthogonal to Process.run, ideally.
    if(cache) {
      handler = cache[vhandler]
      method  = cache[vhandler + ' ' + vmethod]
    } else {
      dialect.cache = {}
    }
    
    if(!handler) {
      handler = dialect.get_handler(vhandler)
      dialect.cache[vhandler] = handler
    }
    
    if(!method) {
      method = dialect.get_method(vhandler, vmethod)
      dialect.cache[vhandler + ' ' + vmethod] = method
    }                                                    // end dialect caching optimization
    
    if(!method) {
      // THINK: error?
      D.set_error('You have failed to provide an adequate method: ' + segment.value.handler + ' ' + segment.value.method)
      return "" // THINK: maybe {} or {noop: true} or something, so that false flows through instead of previous value
    }
    
    var piped  = false
      , params = []
      , paramlist = segment.paramlist
      , typefun

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
    

    if(!paramlist) {
      paramlist = []
      segment.errors = []
      
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
        // if(!piped && !D.is_nice(param_value)) {                           // make map of names to inputs
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
            segment.errors.push( 'Missing required parameter "' + method_param.key 
                                 + '" for command "' + segment.value.handler 
                                 + " " + segment.value.method + '"' )
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
      
      segment.paramlist = paramlist
    }
    
    for(var i=0, l=paramlist.length; i < l; i++) {
      var pfunk = paramlist[i]
      var param_value = pfunk.key == -1
                      ? pfunk.value
                      : pfunk.typefun(inputs[pfunk.key])            // we have to do this at runtime

      params.push(param_value)
    }
    
    if(!segment.errors.length) {
      return method.fun.apply(handler, params.concat(prior_starter, process))
    } else {
      segment.errors.forEach(function(error) {
        D.set_error(error)
      })
      return ""
    }
  }
}
