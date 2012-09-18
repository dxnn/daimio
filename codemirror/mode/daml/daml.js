/**
 * Author: dann
 * A CodeMirror mode for DAML
 *  (forked from Clojure mode by Hans Engel 
 *    (branched from Scheme mode by Koh Zi Han 
 *      (based on implementation by Koh Zi Chun)))
 */
CodeMirror.defineMode("daml", function() {
  
  // TODO: make a stub DAML with some standard commands and aliases and stick it in here just in case
  // this parser doesn't work without a live DAML install, because we need aliases n' stuff
  if(typeof DAML == 'undefined') return {token: function(stream, state) {stream.skipToEnd(); return 'atom'}}

  var SYMBOL = "atom", STRING = "atom", COMMENT = "comment", NUMBER = "number", BRACE = "bracket", 
      PAREN = "hr", PARAMNAME = "attribute", HANDLER = "builtin", METHOD = "keyword",
      ALIAS = "def", VARIABLE = "variable", ERROR = "error"

  var tests = {
    digit_or_sign: /[0-9+-]/,
    word: /[\w_\-]/,
    pname: /^[a-z][\w_\-]*$/i,
    not_breaking: /[^\s|^)}]/,
    not_open_brace: /[^{]/,
    not_quote_or_open_brace: /[^{"]/,
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
      // THINK: should limit this in some fashion, but also allow :{ & :} & :" ?
      returnType = SYMBOL
    }
    else if(ch == '@' || tests.word.test(word)) {
      // TODO: lots to fix here....
      returnType = VARIABLE
    }
    
    return returnType
  }
  
  function Stately(oldNow, where) { // represents a state stack object
    this.data = {}
    this.verb = 'open'
    this.where = where || 'outside'
    this.indentation = oldNow.indentation || 0
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
  
  function inCommand(stream, state) {
    var returnType = null, now = state.now, data = now.data
    
    if(now.verb != 'close') {
      var segue = false, peek = stream.peek()
      if(peek == '}') {
        now.verb = 'close'
        segue = true
      }
      else if(DAML.terminators[peek]) {
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
      case 'open': // eat opening brace
        stream.next()
        now.indentation += 2
        now.verb = 'handle'
        data.pnames = []
        
        returnType = BRACE
      break

      case 'handle': // eat a handler or fall back to pval
        var word = getNextWord(stream)

        // TODO: this assumes well-formed aliases, and will bomb if there's an error. make it robust!
        if(DAML.aliases[word]) { 
          returnType = ALIAS
          var words = DAML.aliases[word].split(' ').reverse() 
          word = words.pop()
          data.handler = word
          now.verb = 'methodize'
          if(words.length) {
            word = words.pop()
            for(var i=0, l = DAML.models[data.handler].methods[word].params.length; i < l; i++) {
              data.pnames.push(DAML.models[data.handler].methods[word].params[i].key)
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
        else if(DAML.models[word]) {
          data.handler = word
          returnType = HANDLER
          now.verb = 'methodize'
        } 
        else {
          stream.backUp(word.length)
          goThere(state, 'pval')             
        }
        
        // NOTE: handler and method have to be on the same line!
        // TODO: combine handler and method to make pvaling of handler-named-pvals easier
      break

      case 'methodize': // eat a method or pyuukk
        var word = getNextWord(stream)
        var handler = DAML.models[data.handler]

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
        } else {
          // ERROR!
          stream.backUp(word.length)
          goThere(state, 'pval')
        }
      break

      case 'parametrize': // eat a pname
        var word = getNextWord(stream)
        var index = data.pnames.indexOf(word)
        data.pname = ''

        if(index >= 0) { // available pname
          data.pname = word
          data.pnames.splice(index, 1)
          returnType = PARAMNAME
        } else {
          if(tests.pname.test(word)) { // valid but unavailable pname
            data.pname = word // derp?
            returnType = ERROR
          } else { // try again as pval
            // ERROR!
            stream.backUp(word.length)
          }
        }

        goThere(state, 'pval')
      break
      
      case 'close': // eat closing brace
      default:
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
      case 'open': // eat opening paren
        stream.next()
        now.indentation += 2
        now.verb = 'consume'
        
        returnType = PAREN
      break
      
      case 'consume': // close list or pval
        if(stream.peek() == ')') now.verb = 'close'
        else goThere(state, 'pval')
      break

      case 'close': // eat closing paren
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
      case 'open': // eat opening quote
        stream.next()
        now.indentation += 2
        now.verb = 'consume'
        
        returnType = STRING
      break
      
      case 'consume': // close quote, open command, or all you can eat
        stream.eatWhile(tests.not_quote_or_open_brace)

        var peek = stream.peek()
        if(peek == '"') now.verb = 'close'
        if(peek == '{') goThere(state, 'command')
        
        returnType = STRING
      break

      case 'close': // eat closing quote
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
      case 'open': // eats numbers or fancy
        now.verb = 'close'
        peek = stream.peek()
        
        if(likeNumber(stream)) returnType = eatNumber(stream)
        else if(peek == '{') goThere(state, 'command')
        else if(peek == '(') goThere(state, 'list')
        else if(peek == '"') goThere(state, 'quote')
        else returnType = eatFancy(stream)
      break

      case 'close': // go back to whence you came
      default:
        comeBack(state)
      break
    }
    
    return returnType
  }
  
  function inBlock(stream, state) {
    stream.eatWhile(tests.not_open_brace)
    if(stream.peek() == '{') goThere(state, 'command')
  }
   
  function inTerminator(stream, state) {
    var returnType = null, now = state.now, data = now.data
    
    switch(now.verb) {
      case 'open': // eat a terminator
        peek = stream.peek()
        returnType = DAML.terminators[peek].eat(stream)
        // TODO: this needs to return the terminator type, but also mark the ptree for further parsing
        now.verb = 'close'
      break

      case 'close': // go back to whence you came
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
        
        case 'outside': // outside all DAML commands
        default:
          stream.eatWhile(tests.not_open_brace)
          if(stream.peek() == '{') {
            goThere(state, 'command')
          }
        break
      }
      
      return returnType
    },
  }
})

CodeMirror.defineMIME("text/x-daml", "daml")
