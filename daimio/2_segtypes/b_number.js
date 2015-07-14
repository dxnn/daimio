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
