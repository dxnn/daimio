(function() {
  var on = false;
  CodeMirror.damlHint = function(editor) {
    var complete = {}
    // if(on) {return complete.parentNode.removeChild(complete)}
    on = !on
    
    function collectHints(previousToken) {
      // We want a single cursor position.
      if (editor.somethingSelected()) return

      var tempToken = editor.getTokenAt(editor.getCursor())

      var result = getHints(editor);
      if (!result || !result.list.length) return;
      var completions = result.list;
      function insert(str) {
        editor.replaceRange(str, result.from, result.to);
      }
      
      // When there is only one completion, use it directly.
      if (completions.length == 1) {insert(completions[0]); hide(); return true;}

      // Build the select widget
      complete = document.createElement("div");
      complete.className = "CodeMirror-completions";
      var sel = complete.appendChild(document.createElement("select"));
      
      // Opera doesn't move the selection when pressing up/down in a
      // multi-select, but it does properly support the size property on
      // single-selects, so no multi-select is necessary.
      if (!window.opera) sel.multiple = true;
      for (var i = 0; i < completions.length; ++i) {
        var opt = sel.appendChild(document.createElement("option"));
        opt.appendChild(document.createTextNode(completions[i]));
      }
      
      sel.firstChild.selected = true;
      sel.size = Math.min(10, completions.length);
      var pos = editor.cursorCoords();
      complete.style.left = pos.x + "px";
      complete.style.top = pos.yBot + "px";
      document.body.appendChild(complete);
      
      // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
      var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
      if(winW - pos.x < sel.clientWidth)
        complete.style.left = (pos.x - sel.clientWidth) + "px";
      // Hack to hide the scrollbar.
      if (completions.length <= 10)
        complete.style.width = (sel.clientWidth - 1) + "px";

      var done = false;
      function hide() {
        if(done || !complete.parentNode) return;
        done = true;
        complete.parentNode.removeChild(complete);
        // complete.style.display = "none"
      }
      function show() {
        complete.style.display = "block"
      }
      
      function pick(e, str) {
        insert(completions[sel.selectedIndex] + (str || ''))
        setTimeout(function() {editor.focus()}, 50)
      }
      
      CodeMirror.connect(sel, "blur", hide);
      CodeMirror.connect(sel, "keydown", function(event) {
        var code = event.keyCode;
        // Enter or space
        if (code == 13 || code == 32) {CodeMirror.e_stop(event); pick({}, ' ');}
        // Escape
        else if (code == 27) {CodeMirror.e_stop(event); hide(); editor.focus();}
        else if (code != 38 && code != 40) {
          close(); editor.focus();
          // Pass the event to the CodeMirror instance so that it can handle things like backspace properly.
          editor.triggerOnKeyDown(event)
          setTimeout(function(){collectHints(tempToken)}, 50)
        }
      });
      CodeMirror.connect(sel, "dblclick", pick);

      sel.focus();
      // Opera sometimes ignores focusing a freshly created node
      if (window.opera) setTimeout(function(){if (!done) sel.focus();}, 100);
      return true;
    }
    
    return collectHints();
  };
  
  function getHints(editor) {
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
      maybe = Object.keys(DAML.models) // TODO: only at command start?
    }
    else if(!state.method) {
      maybe = Object.keys(DAML.models[state.handler].methods)
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
})()