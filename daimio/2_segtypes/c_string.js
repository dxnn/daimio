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
