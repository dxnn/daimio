/**
 * Author: dann
 * A CodeMirror mode for D
 *  (forked from Clojure mode by Hans Engel 
 *    (branched from Scheme mode by Koh Zi Han 
 *      (based on implementation by Koh Zi Chun)))
 */
CodeMirror.defineMode("daimio", function() {
  
  
  // this parser doesn't work without a live D install. We use the internal D parser directly, and the local dialect of D commands, aliases, terminators, etc.
  if(typeof D == 'undefined') return {token: function(stream, state) {stream.skipToEnd(); return 'atom'}}

  var SYMBOL = "atom", STRING = "atom", COMMENT = "comment", NUMBER = "number", BRACE = "bracket", 
      PAREN = "hr", PARAMNAME = "attribute", HANDLER = "builtin", METHOD = "keyword",
      ALIAS = "def", VARIABLE = "variable", ERROR = "error", BLOCK = "hr"

  var tests = {
    digit_or_sign: /[0-9+-]/,
    word: /[\w_\-]/,
    pname: /^[a-z][\w_\-]*$/i,
    not_breaking: /[^\s|^)}]/,
    not_open_brace: /[^{]/,
    not_quote_or_open_brace_or_angle: /[^{"><]/,
  }

  function likeNumber(stream) {
    var ch = stream.peek()
    return tests.digit_or_sign.test(ch)
  }

  function eatNumber(stream) {
    var word = getNextWord(stream)
    return (+word >= 0) ? NUMBER : ERROR
  }
  
  function eatFancy(stream, state) {
    returnType = ERROR
    
    var ch = stream.next(), // ensure we always eat something
        word = getNextWord(stream, true)

    if(ch == ':') {
      // THINK: should limit this in some fashion, but also allow :{ & :} & :" ? no, no. only lowercase alpha
      returnType = SYMBOL
    }
    else if(ch == '@' || tests.word.test(word)) {
      // TODO: lots to fix here....
      returnType = VARIABLE
    }
    else if(!word && tests.word.test(ch)) {
      returnType = VARIABLE
    }
    
    return returnType
  }
  
  function Stately(oldNow, where) { // represents a state stack object
    this.data = {}
    this.verb = 'open'
    this.where = where || 'outside'
    this.indentation = oldNow.indentation || 0
    this.onTerminate = {errorLevel: 0, commentLevel: 0}
    this.onClose = {errorLevel: 0, commentLevel: 0}
  }

  function goThere(state, where) {
    state.stack.push(state.now)
    state.now = new Stately(state.now, where)
  }

  function comeBack(state) {
    state.now = state.stack.pop()
  }

  function getNextWord(stream, nospace) {
    var word = '', letter
    if(!nospace) stream.eatSpace()
    while((letter = stream.eat(tests.not_breaking)) != null) word += letter
    return word
  }
  
  function upError(state) {
    state.now.onTerminate.errorLevel--
    state.errorLevel++
  }
  
  function onClose(state) {
    var item = state.now.onClose

    state.errorLevel += item.errorLevel
    item.errorLevel = 0

    state.commentLevel += item.commentLevel
    item.commentLevel = 0
    
    // closing also clears terminators
    onTerminate(state)
  }
  
  function onTerminate(state) {
    var item = state.now.onTerminate

    state.errorLevel += item.errorLevel
    item.errorLevel = 0

    state.commentLevel += item.commentLevel
    item.commentLevel = 0
  }
  
  
  function inCommand(stream, state) {
    var returnType = null, now = state.now, data = now.data
    
    /*
      closing brace or terminator
    */
    if(now.verb != 'close') {
      var segue = false, peek = stream.peek()
      if(peek == '}') {
        now.verb = 'close'
        segue = true
      }
      else if(D.terminators[peek]) {
        onTerminate(state)
        now.verb = 'handle'
        goThere(state, 'terminator')
        segue = true
      }
      
      if(segue) {
        // TODO: if verb == methodize backpedal to pval mode for handler to gracefully handle e.g. {list}
        return null
      }
    }
    
    switch(now.verb) {

      /*
        eat opening brace
      */
      case 'open': 
        stream.next()
        now.indentation += 2
        now.verb = 'handle'
        data.pnames = []
        returnType = BRACE
        
        if(stream.peek() == '/') {
          state.commentLevel++
          now.onClose.commentLevel--
        }
      break

      /*
        switch to block or
        eat an alias or
        eat a handler or
        pass to pval, but return to error loop
      */
      case 'handle': 
        var word = getNextWord(stream)

        if(word == 'begin' || word == 'end') {
          goThere(state, 'block')
          returnType = BLOCK
        }

        // TODO: this assumes well-formed aliases, and will bomb if there's an error. make it robust!
        // good alias
        else if(D.AliasMap[word]) { 
          returnType = ALIAS
          var words = D.AliasMap[word].split(' ').reverse() 
          word = words.pop()
          data.handler = word
          now.verb = 'methodize'
          
          if(words.length) {
            word = words.pop()
            for(var i=0, l = D.commands[data.handler].methods[word].params.length; i < l; i++) {
              data.pnames.push(D.commands[data.handler].methods[word].params[i].key)
            }
            data.method = word
            now.verb = 'parametrize'
            
            var after
            while(words.length) {
              word = words.pop()
              data.pname = word
              after = 'pval'
              data.pnames.splice(data.pnames.indexOf(word), 1)
              if(words.length) {
                word = words.pop()
                after = 'parametrize'
              }
            }
            if(after == 'pval') goThere(state, 'pval')
            else now.verb = 'parametrize'
          }
        } 
        
        // good handler
        else if(D.commands[word]) { 
          data.handler = word
          returnType = HANDLER
          now.verb = 'methodize'
        } 
        
        // try as param, but goto errorloop on return
        else {  
          now.verb = 'errorloop'
          stream.backUp(word.length)
          goThere(state, 'pval')             
        }
      break

      /*
        eat a method
        or goto errorloop
      */
      case 'methodize':
        var word = getNextWord(stream)
        var handler = D.commands[data.handler]

        // good method
        if(handler.methods[word]) { 
          var method = handler.methods[word]
          data.method = word
          now.verb = 'parametrize'
          returnType = METHOD 
          if(method.params) {
            for(var i=0, l = method.params.length; i < l; i++) {
              data.pnames.push(method.params[i].key)
            }
          }
        } 
        // bad method
        else { 
          now.verb = 'errorloop'
          stream.backUp(word.length)
        }
      break

      /*
        eat pname then goto pval
      */
      case 'parametrize': // eat a pname
        var word = getNextWord(stream)
        var index = data.pnames.indexOf(word)
        data.pname = ''

        if(index >= 0) { 
          // pname exists!
          data.pname = word
          data.pnames.splice(index, 1)
          returnType = PARAMNAME
        } else {
          if(tests.pname.test(word)) { 
            // valid but non-existent pname
            data.pname = word // derp?
            returnType = ERROR
          } else {                     
            // invalid pname
            upError(state) // ensures first pval is an error
            now.verb = 'errorloop'
            stream.backUp(word.length)
          }
        }

        goThere(state, 'pval')
      break
      
      /*
        set error and goto pval
      */
      case 'errorloop':
        upError(state)
        goThere(state, 'pval')
      break
      
      /*
        eat closing brace
      */
      case 'close':
      default:
        onClose(state)
        stream.next()
        comeBack(state)
        
        returnType = BRACE
      break

    }
    
    return returnType
  }
  
  function inList(stream, state) {
    var returnType = null, now = state.now, data = now.data

    switch(now.verb) {
      /*
        eat opening paren
      */
      case 'open': 
        stream.next()
        now.indentation += 2
        now.verb = 'consume'
        
        returnType = PAREN
      break
      
      /*
        goto close or
        goto pval
      */
      case 'consume': 
        if(stream.peek() == ')') now.verb = 'close'
        else if(stream.peek() == '}') comeBack(state) // just in case {(}  -- :(
        else goThere(state, 'pval')
      break

      /*
        eat closing paren
      */
      case 'close':
      default:
        stream.next()
        comeBack(state)

        returnType = PAREN
      break
    }
    
    return returnType
  }
   
  function inQuote(stream, state) {
    var returnType = null, now = state.now, data = now.data

    switch(now.verb) {
      /*
        eat opening quote
      */
      case 'open':
        stream.next()
        now.indentation += 2
        now.verb = 'consume'
        returnType = STRING
      break
      
      /*
        goto close or
        goto command or
        continue eating
      */
      case 'consume': 
        stream.eatWhile(tests.not_quote_or_open_brace_or_angle)
        var peek = stream.peek()
        
        if(peek == '<') {
          data.angled = true
          stream.next()
        }
        
        if(peek == '>') {
          data.angled = false
          stream.next()
        }
        
        if(peek == '"') {
          if(data.angled) stream.next()
          else now.verb = 'close'
        }
        
        if(peek == '{') goThere(state, 'command')
        
        returnType = STRING
      break

      /*
        eat closing quote
      */
      case 'close':
      default:
        stream.next()
        comeBack(state)
        returnType = STRING
      break
    }
    
    return returnType
  }
  
  function inPval(stream, state) {
    var returnType = null, now = state.now, data = now.data

    switch(now.verb) {
      /*
        eat numbers or
        close command or
        open command, list, quote or
        eat fancy
      */
      case 'open': 
        now.verb = 'close'
        peek = stream.peek()
        
        if(likeNumber(stream)) returnType = eatNumber(stream)
        else if(peek == '}') comeBack(state) // THINK: can this leak?
        else if(peek == '{') goThere(state, 'command')
        else if(peek == '(') goThere(state, 'list')
        else if(peek == '"') goThere(state, 'quote')
        else returnType = eatFancy(stream)
      break

      /*
        go home
      */
      case 'close':
      default:
        comeBack(state)
      break
    }
    
    return returnType
  }
  
  function inBlock(stream, state) {
    var word = getNextWord(stream)
    returnType = BLOCK
    
    // TODO: make bad ends errors; make bad names errors; anon blocks?
    
    comeBack(state)
    return returnType
  }
   
  function inTerminator(stream, state) {
    var returnType = null, now = state.now, data = now.data
    
    switch(now.verb) {
      /*
        eat a terminator
      */
      case 'open':
        peek = stream.peek()
        returnType = D.terminate(peek, 'eat', [stream, state])
        // terminators take the previous stack and the next stack and merge them together, 
        // but here they just return a type and modify 'state'. we need to put these two things together somehow...
        now.verb = 'close'
      break

      /*
        go home
      */
      case 'close': 
      default:
        comeBack(state)
      break
    }
    
    return returnType
  }
  

  return {
    indent: function (state, textAfter) {
      if (state.now.indentStack == null) return state.now.indentation
      return state.now.indentStack.indent
    },

    copyState: function(state) {
      return JSON.parse(JSON.stringify(state)) // stinky, but terribly effective
    },

    startState: function(baseIndent) {
      var quasistate = {indentation: baseIndent}
      return {
        stack: [], // previous states
        errorLevel: 0,
        commentLevel: 0, 
        now: new Stately(quasistate)
      }
    },

    token: function (stream, state) {
      if(state.now.indentation == null && stream.sol()) {
        // update indentation, but only if indentStack is empty
        state.now.indentation = stream.indentation()
      }

      if(stream.eatSpace()) return null  // skip spaces
      var returnType = null, ch = null
      
      switch(state.now.where) {
        case 'command': // inside a command
          returnType = inCommand(stream, state)
        break
        
        case 'pval': 
          returnType = inPval(stream, state)
        break
        
        case 'list':
          returnType = inList(stream, state)
        break
        
        case 'quote':
          returnType = inQuote(stream, state)
        break
        
        case 'block': 
          returnType = inBlock(stream, state)
        break
        
        case 'terminator': 
          returnType = inTerminator(stream, state)
        break
        
        case 'outside': // outside all D commands
        default:
          stream.eatWhile(tests.not_open_brace)
          if(stream.peek() == '{') {
            goThere(state, 'command')
          }
        break
      }
      
      if(returnType == BRACE) return BRACE
      if(state.commentLevel) return COMMENT
      if(state.errorLevel) return ERROR
      return returnType
    },
  }
})

CodeMirror.defineMIME("text/x-daimio", "daimio")
