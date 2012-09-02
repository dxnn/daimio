/**
 * Author: dann
 * A CodeMirror mode for DAML
 *  (forked from Clojure mode by Hans Engel 
 *    (branched from Scheme mode by Koh Zi Han 
 *      (based on implementation by Koh Zi Chun)))
 */
CodeMirror.defineMode("daml", function() {
  
  // this parser doesn't work without a live DAML install, because we need aliases n' stuff
  if(typeof DAML == 'undefined') return {token: function(stream, state) {stream.skipToEnd(); return 'atom'}};

  var SYMBOL = "atom", STRING = "atom", COMMENT = "comment", NUMBER = "number", BRACE = "bracket", 
      PAREN = "hr", PARAMNAME = "qualifier", PARAM = "attribute", HANDLER = "builtin", METHOD = "keyword",
      VARIABLE = "variable", ERROR = "error";

  var commands = {"list pair":1, "if":1, "time":1, "cond":1};
  var aliases = {"*": "list pair"};

  var tests = {
    digit: /\d/,
    sign: /[+-]/,
    exponent: /e/i,
    word: /[\w_\-]/,
    alpha: /[a-z]/i,
    not_space: /[^\s]/,
    lang_keyword: /[\w*+!\-_?:\/]/,
    breaking: /[\s+|^)}]/,
    not_breaking: /[^\s|^)}]/,
    not_open_brace: /[^{]/,
    not_brace: /[^}{]/,
    not_brace_or_quote: /[^}{"]/,
  };


  function likeSegue(ch, stream, state) {
    var closing = false, erroring = false
    
    if(state.now.type == 'commander' && ch == '}') {
      closing = true
    } 
    if(state.now.type == 'lister' && ch == ')') {
      closing = true
    }
    
    // if(state.now.type == 'commander' && ch == ')') {
    //   erroring = true
    // } 
    // if(state.now.type == 'lister' && ch == '}') {
    //   erroring = true
    // }
    // 
    // if(erroring) {
    //   state.now.mode = 'erroring'
    //   return true
    // }
    
    if(closing) {
      state.now.mode = 'closing'
      return true
    }
    
    if(ch == '|' || ch == '^') { // terminators
      state.now.mode = 'terminating'
      return true
    }
  }

  function likeNumber(ch, stream) {
    if(ch == '+' || ch == '-') { // leading sign
      ch = stream.peek()
    }

    return tests.digit.test(ch)
  }

  function eatNumber(ch, stream) {
    if(ch == '+' || ch == '-') { // leading sign
      stream.eat(tests.sign)
      ch = stream.peek()
    }
    
    stream.eatWhile(tests.digit)
    ch = stream.peek()
    
    if(ch == '.') {
      stream.eat(ch)
      stream.eatWhile(tests.digit)
      ch = stream.peek()
    }

    if(tests.exponent.test(ch)) {
      stream.eat(tests.exponent)
      stream.eat(tests.sign)
      stream.eatWhile(tests.digit)
      ch = stream.peek()
    }
    
    if(tests.breaking.test(ch) || !ch) return NUMBER   
    
    stream.eatWhile(tests.not_breaking)
    return ERROR
  }
  
  
  function Stately(oldNow, type, mode) { // represents a state stack object
    this.handler = ''
    this.method = ''
    this.pname = ''
    this.tainted = ''
    this.pnames = []
    this.type = type || 'outsider'
    this.mode = mode || 'outside'
    this.indentation = oldNow.indentation || 0
    // return this // remind me again why we don't need this?
  }

  function pushState(state, type, mode) {
    state.stack.push(state.now)
    state.now = new Stately(state.now, type, mode);
  }

  function popState(state) {
    state.now = state.stack.pop();
  }

  function getNextWord(stream) {
    var word = '', letter
    stream.eatSpace()
    while((letter = stream.eat(tests.not_breaking)) != null) {word += letter}
    return word;
  }
  
  function openCommand(state) {
    pushState(state, 'commander', 'opening')
  }


  return {
    indent: function (state, textAfter) {
      if (state.now.indentStack == null) return state.now.indentation;
      return state.now.indentStack.indent;
    },

    copyState: function(state) {
      var nstate = {}
      nstate.now = new Stately({})
      for(var key in state.now) {
        nstate.now[key] = state.now[key];
      }
      
      nstate.stack = state.stack.concat([])
      return nstate;
    },

    startState: function(baseIndent) {
      var quasistate = {indentation: baseIndent}
      return {
        stack: [],
        now: new Stately(quasistate)
      }
    },

    token: function (stream, state) {
      if(state.now.indentation == null && stream.sol()) {
        // update indentation, but only if indentStack is empty
        state.now.indentation = stream.indentation();
      }

      if(stream.eatSpace()) return null  // skip spaces
      var returnType = null, ch = null
      
      switch(state.now.mode) {
        
        case 'opening': // eat opening brace
          stream.next()
          state.now.type = 'commander'
          state.now.indentation += 2
          returnType = BRACE
          
          if(stream.peek() == '/') {
            state.now.mode = 'commenting'
          } else {
            state.now.mode = 'entering'
          }
        break
        
        case 'closing': // eat closing brace
          stream.next()
          popState(state)
          returnType = BRACE
        break
        
        case 'commenting': // eat comments, up to first brace
          stream.eatWhile(tests.not_brace)
          var pch = stream.peek()
          
          if(pch == '{') {
            openCommand(state)
          } 
          else if(pch == '}'){
            state.now.mode = 'closing'
          }

          returnType = COMMENT
        break
        
        case 'entering': // no eating
          ch = stream.peek()
          
          var segue = likeSegue(ch, stream, state)
          
          if(!segue) {
            state.now.mode = 'handling'
          }
        break
        
        case 'terminating': // eats terminal chars -- should hand off to terminal parser fun
          stream.next()
          state.now.mode = 'entering'
          state.handler = ''
          state.method = ''
          state.pname = ''
          state.tainted = ''
          state.pnames = []
          returnType = BRACE // THINK: something else?
        break
        
        case 'handling': // eat a handler or fall back to param
          var pos = stream.pos,
              word = getNextWord(stream)
          
          if(DAML.aliases[word]) { // FIXME!
            state.now.mode = 'aliasing' // depr!!!
            state.now.alias = word // derp!!!!
          }
        
          if(DAML.models[word]) {
            state.now.handler = word
            returnType = HANDLER
            state.now.mode = 'methoding'
          } else {
          
          // if(state.now.mode != 'methoding') { // fallback to pvaling
            stream.pos = pos; // retreat!
            state.now.mode = 'pvaling'             
          }
        break
        
        case 'methoding': // eat a method or pyuukk
          var word = getNextWord(stream)
          var handler = DAML.models[state.now.handler]
          
          if(handler.methods[word]) {
            var method = handler.methods[word]
            state.now.method = word
            returnType = METHOD
            for(var i=0, l = method.params.length; i < l; i++) {
              state.now.pnames.push(method.params[i].key)
            }
          } else {
            returnType = ERROR
          }            

          state.now.mode = 'pnaming'
        break
        
        case 'pnaming': // eat a pname or switch to segue
          ch = stream.peek()
          var segue = likeSegue(ch, stream, state) // close command or start a new one

          if(segue) {
            returnType = segue
          } else {
            var word = getNextWord(stream)
            var index = state.now.pnames.indexOf(word)
            
            state.now.pname = ''
            
            if(index) {
              state.now.pname = word
              state.now.pnames.splice(index, 1)
              returnType = PARAMNAME
            }
              
            //   && state.now.method.params) {
            //   if(state.now.pnames)
            //   for(var i=0, l=state.now.method.params.length; i < l; i++) {
            //     if(state.now.method.params[i].key == word) {
            //       state.now.pname = word
            //       state.now.usedPs.push(word)
            //       returnType = PARAMNAME
            //       break
            //     }
            //   }
            // }
            
            // two issues: 
            // 1. glitch with {(}
            // 2. pname-pval wrt HMP: {* (1 2 3)}
              
            if(!state.now.pname) {
              returnType = ERROR
            }

            state.now.mode = 'pvaling'
          }
        break
        
        case 'pvaling': // treat as a param // TODO: use type system
          ch = stream.next()
          
          if(ch == '{') {
            openCommand(state)
            stream.backUp(1)
          }
          else if(ch == '(') {
            pushState(state, 'lister', 'pvaling') // I think this is the only place to open a list
            state.now.indentation += 2
            returnType = PAREN
          }
          else if (ch == ')') {
            if(state.now.type == 'lister') {
              popState(state) // and this is the only place to close one
              returnType = PAREN              
            } else {
              returnType = ERROR
            }
            state.now.mode = (state.now.type == 'lister') ? 'pvaling' : 'pnaming'
          }
          else if(likeNumber(ch, stream)) {
            returnType = eatNumber(ch, stream);
            state.now.mode = (state.now.type == 'lister') ? 'pvaling' : 'pnaming'
          }
          else if(ch == '"') {
            state.now.mode = 'quoting'
            returnType = STRING
          }
          else {
            state.now.mode = 'fancy'
            stream.backUp(1)
          }
        break
        
        case 'quoting': // eat quotes, up to first brace or quote
          stream.eatWhile(tests.not_brace_or_quote)
          var pch = stream.peek()
          
          if(pch == '{') {
            openCommand(state)
          } 
          else if(pch == '}') {
            state.now.mode = 'closing'
          } 
          else if(pch == '"') {
            stream.next()
            state.now.mode = (state.now.type == 'lister') ? 'pvaling' : 'pnaming'
          }
          
          returnType = STRING
        break
        
        case 'fancy': 
          ch = stream.next()
          var word = ch
          while((letter = stream.eat(tests.not_space)) != null) {word += letter}
          
          if(ch == ':') {
            // THINK: should limit this in some fashion, but also allow :{ & :} ?
            // state.now.mode = 'symboling'
            returnType = SYMBOL
          }
          else if(ch == '@' || tests.alpha.test(ch)) {
            // TODO: lots to fix here....
            returnType = VARIABLE
          }
          else {
            returnType = ERROR
          }
          
          state.now.mode = (state.now.type == 'lister') ? 'pvaling' : 'pnaming'
        break
                
        case 'outside': // outside all DAML commands
        case 'blocking': // inside a block, but outside commands
        default:
          stream.eatWhile(tests.not_open_brace)
          if(stream.peek() == '{') {
            openCommand(state)
          }
          returnType = null
        break
      }

      return returnType;
    },
  };
});

CodeMirror.defineMIME("text/x-daml", "daml");
