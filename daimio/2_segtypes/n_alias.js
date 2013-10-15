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

    // alias keys are low numbers and conflict with rekeying...
    // segments = D.mungeLR(segments, D.Transformers.rekey)
    

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
