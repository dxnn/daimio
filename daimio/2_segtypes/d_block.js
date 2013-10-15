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
