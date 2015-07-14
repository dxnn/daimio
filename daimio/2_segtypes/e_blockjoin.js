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
