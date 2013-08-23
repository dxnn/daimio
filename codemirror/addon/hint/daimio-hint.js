(function() {
    
    // NOTES: always space-complete (space is easy to hit), find matches based on non-adjacent letters (so string and stripe can be sg and sp), use esc to match non-daml words, use something else to turn this off and on, almost always be ACing -- H&M&Pn should be always and Pv should be usually w/ autocom fun.
    
  function daimioHint(editor) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = editor.getTokenAt(cur)
    
    var found = [], maybe = [], 
        state = token.state.now, start = token.string,
        from = {line: cur.line, ch: token.start},
        to = {line: cur.line, ch: token.end}
    
    
    if(!/^\w+$/.test(start)) { // fix the token if it's borken
      // TODO: if inside a pval, do some crazy autocompleting stuff
      // not pval? then just skip the boundaries
      start = ''
      from.ch = cur.ch
      to.ch = cur.ch
    }
    
    if(!state.handler) {
      maybe = Object.keys(DAML.commands) // TODO: only at command start?
    }
    else if(!state.method) {
      maybe = Object.keys(DAML.commands[state.handler].methods)
    }
    else if(state.mode == 'pnaming' && !start) { // no pname
      maybe = state.pnames
    }
    else if(state.pname == start) { // incomplete pname
      maybe = state.pnames
    }
    else {
      maybe = []
    }
    
    for(var i=0, l=maybe.length; i < l; i++) {
      if(/\w/.test(start)) {
        if (maybe[i].indexOf(start) == 0) found.push(maybe[i])
      } else {
        found.push(start + maybe[i])
      }
    }
    
    return {list: found, from: from, to: to}
  }
  
  CodeMirror.registerHelper("hint", "daimio", daimioHint);
})()