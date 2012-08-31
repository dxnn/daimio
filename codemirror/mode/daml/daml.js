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
    lang_keyword: /[\w*+!\-_?:\/]/,
    breaking: /[\s+|^)}]/,
    not_breaking: /[^\s|^)}]/,
    not_open_brace: /[^{]/,
    not_brace: /[^}{]/
  };


  function likeSegue(ch, stream, state) {
    if(ch == '}') {
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
    this.handler = null
    this.method = null
    this.pname = ''
    this.usedPs = []
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
    pushState(state)
    state.now.mode = 'opening'
  }


  return {
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
          // pushState(state)
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
          if(stream.peek() == '{') {
            openCommand(state)
            // state.now.mode = 'opening'
          } else {
            state.now.mode = 'closing'
          }
          returnType = COMMENT
        break
        
        case 'erroring': // eat errors, up to first terminator
          stream.eatWhile(function(ch) {return !likeSegue(ch, stream, state)})
          
          // TODO: also catch open brace here
          
          // state.now.mode = likeSegue(stream.peek(), stream, state) || 'erroring'
          returnType = ERROR
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
          state.usedPs = []
          returnType = BRACE // THINK: something else?
        break
        
        case 'handling': // eat a handler or fall back to param
          var pos = stream.pos,
              word = getNextWord(stream)
          
          if(DAML) {
            if(DAML.aliases[word]) { // FIXME!
              state.now.mode = 'aliasing' // depr!!!
              state.now.alias = word // derp!!!!
            }
          
            if(DAML.models[word]) {
              state.now.handler = DAML.models[word]
              returnType = HANDLER
              state.now.mode = 'methoding'
            }
          }
          else { // no DAML... /QQ
            var next_word = getNextWord(stream)
            if(next_word) { // check the next word
              returnType = HANDLER
              state.now.mode = 'methoding'
            }
          }
          
          if(state.now.mode != 'methoding') { // fallback to pvaling
            stream.pos = pos; // retreat!
            state.now.mode = 'pvaling'             
          }
        break
        
        case 'methoding': // eat a method or pyuukk
          var word = getNextWord(stream)
          
          if(DAML) {
            if(state.now.handler.methods[word]) {
              state.now.method = state.now.handler.methods[word]
              state.now.mode = 'pnaming'
              returnType = METHOD
            } else {
              state.now.mode = 'erroring'
              returnType = ERROR
            }            
          } else {
            state.now.mode = 'pnaming'
            returnType = METHOD
          }
        break
        
        case 'pnaming': // eat a pname or a segue
          ch = stream.peek()
          var segue = likeSegue(ch, stream, state) // close command or start a new one

          if(segue) {
            returnType = segue
          } else {
            var word = getNextWord(stream)
            
            if(DAML) {
              state.now.pname = ''
              for(var i=0, l=state.now.method.params.length; i < l; i++) {
                if(state.now.method.params[i].key == word) {
                  state.now.pname = word
                  state.now.usedPs.push(word)
                  state.now.mode = 'pvaling' // TODO: use type system
                  returnType = PARAMNAME
                  break
                }
              }
            
              if(!state.now.pname) {
                state.now.mode = 'erroring'
                returnType = ERROR
              }
            } else {
              state.now.mode = 'pvaling'
              returnType = PARAMNAME
            }
          }
        break
        
        case 'pvaling': // treat as a param // TODO: use type system
          ch = stream.next()
          
          if(ch == '{') {
            openCommand(state)
            // state.now.mode = 'opening'
            stream.backUp(1)
          }
          else if(ch == '(') {
            pushState(state)
            state.now.type = 'lister' // I think this is the only place to open a list
            state.now.indentation += 2
            returnType = PAREN
          }
          else if (ch == ')') {
            if(state.now.type = 'lister') {
              popState(state) // and this is the only place to close one
              returnType = PAREN              
            } else {
              returnType = ERROR
            }
          }
          else if(likeNumber(ch, stream)) {
            returnType = eatNumber(ch, stream);
          }
          else if(ch == '"') {
            state.now.mode = 'quoting'
            returnType = STRING
          }
          else {
            state.now.mode = 'fancy'
            stream.backUp(1)
          }
          
          returnType = state.now.type == 'lister' ? 'pvaling' : 'pnaming'
        break
        
        case 'fancy': 
          ch = stream.peek()
          var word = getNextWord(stream)
          
          if(ch == ':') {
            // THINK: should limit this in some fashion, but also allow :{ & :} ?
            // state.now.mode = 'symboling'
            returnType = SYMBOL
          }
          else {
            // TODO: lots to fix here....
            returnType = VARIABLE
          }
          
          state.now.mode = 'pval'
        break
                
        case 'outside': // outside all DAML commands
        case 'blocking': // inside a block, but outside commands
        default:
          stream.eatWhile(tests.not_open_brace)
          if(stream.peek() == '{') {
            openCommand(state)
            // state.now.mode = 'opening'
          }
          returnType = null
        break
      }

      return returnType;
    },

    indent: function (state, textAfter) {
      if (state.now.indentStack == null) return state.now.indentation;
      return state.now.indentStack.indent;
    }
  };
});

CodeMirror.defineMIME("text/x-daml", "daml");
