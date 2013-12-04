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
