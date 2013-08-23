(function() {
    
    // NOTES: always space-complete (space is easy to hit), find matches based on non-adjacent letters (so string and stripe can be sg and sp), use esc to match non-daml words, use something else to turn this off and on, almost always be ACing -- H&M&Pn should be always and Pv should be usually w/ autocom fun.
    
  function daimioHint(editor) {
    // Find the token at the cursor
    var cur = editor.getCursor()
      , token = editor.getTokenAt(cur)
      , found = []
      , state = token.state.now
      , stack = token.state.stack
      , oldstate = stack[stack.length-1]
      , start = token.string
      , from = {line: cur.line, ch: token.start}
      , to = {line: cur.line, ch: token.end}
    
    
    if(!/^\w+$/.test(start)) { // fix the token if it's borken
      // TODO: if inside a pval, do some crazy autocompleting stuff
      // not pval? then just skip the boundaries
      start = ''
      from.ch = cur.ch
      to.ch = cur.ch
    }
    
    var possibilities = ( oldstate.data.handler
                        ? try_state(oldstate, start)
                        : try_state(state, start)
                        ) || []  
    // maybe  = try_state(state.data, start)
    //       || try_state(oldstate.data, start)
    //       || []
    
    for(var i=0, l=possibilities.length; i < l; i++) {
      var possible = possibilities[i]
      if(/\w/.test(start)) {
        if (possible.indexOf(start) == 0) 
          found.push(possible)
      } else {
        found.push(start + possible)
      }
    }
    
    return {list: found, from: from, to: to}
  }
  
  function try_state(state, start) {
    if(!state.data.handler)
      return Object.keys(DAML.commands) // TODO: only at command start?
    else if(!state.data.method)
      return Object.keys(DAML.commands[state.data.handler].methods)
    else if(state.verb == 'parametrize' && !start) // no pname
      return state.data.pnames
    else if(state.data.pname == start) // incomplete pname
      return state.data.pnames
  }
  
  CodeMirror.registerHelper("hint", "daimio", daimioHint);
})()