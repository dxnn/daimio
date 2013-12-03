D.SegmentTypes.Variable = {
  try_lex: function(string) {
    return string // this is never lexed
  }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, munge_segments: function(L, segment, R) {
    if(segment.value.type == 'space')         // space vars have to be collected at runtime
      return [L.concat(segment), R]

    var my_key = segment.key
      , new_key = segment.value.prevkey
      , key_index

    if(!new_key && !R.length)                 // some pipeline vars have to be collected then too
      return [L.concat(segment), R]           //   -> this handles {_value | add 1}

    if(!R.length) {                           //   -> this handles {2 | >foo | "" | _foo}
      segment.value.name = new_key
      return [L.concat(segment), R]
    }

    if(!new_key)
      new_key = segment.value.name

    R.forEach(function(future_segment) {      // but others can be converted into wiring
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

    if(!D.is_nice(value))
      return false

    // return value // OPT: cloning each time is terrible
    return D.clone(value)
    // return D.deep_copy(value) // NOTE: we have to deep copy here because cloning (via JSON) destroys blocks...
  }
}
