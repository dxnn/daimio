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
