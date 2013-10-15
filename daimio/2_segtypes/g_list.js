D.SegmentTypes.List = {
  try_lex: function(string) {
    if(string[0] != '(' || string.slice(-1) != ')')
      return string

    return new D.Token('List', string.slice(1, -1))
  }
, munge_tokens: function(L, token, R) {
    if(token.done)
      return [L.concat(token), R]
  
    var new_token_sets = D.Parser.split_on_space(token.value)
                                    .map(D.Parser.strings_to_tokens)

    if(!new_token_sets.length)
      return [L.concat(token), R]
      
    token.inputs = token.inputs || []
    token.done = true
    
    // it's important to only take inputs from the last token to prevent double linking of nested lists and pipelines
    for(var i=0, l=new_token_sets.length; i < l; i++) {
      var last_new_token_from_this_set_oy_vey = new_token_sets[i][new_token_sets[i].length - 1]
      if(last_new_token_from_this_set_oy_vey && last_new_token_from_this_set_oy_vey.key)
        token.inputs.push(last_new_token_from_this_set_oy_vey.key)
    }
    
    var new_tokens = new_token_sets.reduce(D.concat, [])

    /* what we need here:
       - all 'top' magic pipes point to previous segment
       - except magic pipes in pipelines
       
       
    */

    for(var i=0, l=new_tokens.length; i < l; i++) {
      if(!new_tokens[i].prevkey)
        new_tokens[i].prevkey = token.prevkey
    }

    return [L, new_tokens.concat(token, R)]
  }
, token_to_segments: function(token) {
    return [new D.Segment('List', [], token)]
  }
, execute: function(segment, inputs) {
    return inputs
  }
}
