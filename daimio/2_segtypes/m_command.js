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
