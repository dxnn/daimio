D.SegmentTypes.Terminator = {
  try_lex: function(string) {
    return string // THINK: hmmmm.... these are made elsewhere. what are we doing??
  }
, extract_tokens: function(L, token, R) {
    // LE COMMENTS
    if(/^\//.test(token.value)) {
      if(/^\/\//.test(token.value)) {
        return [L, []] // double slash comment goes to end of pipe
      }
      R.shift() // a single slash comment just pops the next segment off
    }

    // LE ARROW
    if(/^→/.test(token.value)) {
      var next = R[0]
        , prev = L[L.length - 1]

      if(!next || !prev)
        return [L, R] // if we aren't infix, don't bother

      var new_token = new D.Token('Command', 'channel bind')
      new_token.names = ['from', 'to']
      new_token.inputs = [prev.key, next.key]

      return [L, [next, new_token].concat(R.slice(1))]
    }

    // LE PIPE
    if(/^\|/.test(token.value)) {
      var next = R[0]
        , prev = L[L.length - 1]

      /*
        Pipes connect the next and prev segments.
        Double pipes don't change the wiring.
        Double pipe at the end cancels output.
      */


      // TODO: what if 'next' is eg a comment?
      // TODO: double pipe means something different
      // TODO: pipe at beginning / end (double pipe at end is common)

      // set the prevkey
      if(next) {
        if(prev) {
          next.prevkey = prev.key
        } else {
          next.prevkey = '__in' // THINK: really? this only applies to  {| add __} which is weird and stupid
        }
      }

      // bind the segments
      if(/^\|\|/.test(token.value)) { // double pipe
        if(!next) {
          R = [new D.Token('String', "")] // squelch output by returning empty string
        }
      }
      else if(next && prev) {
        // if(next.value.params) {
        //   next.value.params['__pipe__'] = prev.key
        // }

        if(next.type == 'Command') {
          next.names = next.names || [] // TODO: fix me this is horrible
          next.inputs = next.inputs || []
          next.names.push('__pipe__')
          next.inputs.push(prev.key)
          // next.params['__pipe__'] = new D.Segment('Input', prev.key)
          // return [L, R]
        }

      }
    }

    return [L, R]
  }
, token_to_segments: function(token) {
    return []
    // this shouldn't happen
  }
, execute: function(segment) {
    // nor this
  }
}
