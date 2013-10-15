D.SegmentTypes.Fancy = {
  try_lex: function(string) {
    // var regex = new RegExp('^[' + D.FancyGlyphs + ']') // THINK: would anything else ever start with a fancy glyph?

    if(D.Etc.FancyRegex.test(string)) 
      return new D.Token('Fancy', string)

    return string
  }
, munge_tokens: function(L, token, R) {
    // var glyph = token.value.slice(0,1)
    var glyph = token.value.replace(/^([^a-z0-9.]+).*/i, "$1")
  
    if(!D.Fancies[glyph]) {
      D.set_error('Your fancies are borken:' + glyph + ' ' + token.value)
      return [L, R]
    }

    var new_tokens = D.Fancies[glyph].eat(token)
      , last_replacement = new_tokens[new_tokens.length - 1]
    
    if(last_replacement) {
      var token_key = token.key
        , token_prevkey = token.prevkey
      
      new_tokens.filter(function(token) {return token.key == token_key})
                .forEach(function(token) {token.key = last_replacement.key})
                                          // token.prevkey = last_replacement.prevkey})

      new_tokens = new_tokens.map(function(token) {
        if(token.inputs)
          token.inputs = token.inputs.map(function(input) {return input == token_key ? last_replacement.key : input})
        return token
      })

      last_replacement.key = token_key
      // last_replacement.prevkey = token_prevkey
    }
    
    return [L, new_tokens.concat(R)] 
    // NOTE: the new tokens are *pre* munged, and shouldn't contain fancy segments [erp nope!]
    // THINK: but what about wiring???
  }
, token_to_segments: function(token) {
    // you shouldn't ever get here
  }
, execute: function(segment) {
    // or here
  }
}
