/**
 * Author: dann
 * A CodeMirror mode for DAML
 *  (forked from Clojure mode by Hans Engel 
 *    (branched from Scheme mode by Koh Zi Han 
 *      (based on implementation by Koh Zi Chun)))
 */
CodeMirror.defineMode("daml", function() {
  
	if(typeof DAML == 'undefined') DAML = {models:{}, aliases:{}}; // use live DAML env if we have it

  var SYMBOL = "atom", STRING = "atom", COMMENT = "comment", NUMBER = "number", BRACE = "bracket", 
      PAREN = "hr", PARAMNAME = "qualifier", PARAM = "attribute", HANDLER = "builtin", METHOD = "keyword",
      ERROR = "error";

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
    else if(ch == '|' || ch == '^') { // terminators
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
          pushState(state)
          state.now.indentation += 2
          returnType = BRACE
          
          if(stream.peek() == '/') {
            state.now.mode = 'commenting'
          } else {
            state.now.mode = 'entering'
          }
        break
        
        case 'commenting': // eat comments, up to first brace
          stream.eatWhile(tests.not_brace)
          if(stream.peek() == '{') {
            state.now.mode = 'opening'
          } else {
            state.now.mode = 'closing'
          }
          returnType = COMMENT
        break
        
        case 'closing': // eat closing brace
          stream.next()
          popState(state)
          returnType = BRACE
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
          returnType = BRACE // THINK: something else?
        break
        
        case 'handling': // eat a handler or fall back to param
          var word = getNextWord(stream)
          
          if(DAML.aliases[word]) { // FIXME!
            state.now.mode = 'aliasing' // depr!!!
            state.now.alias = word // derp!!!!
          }
          
          if(DAML.models[word]) {
            state.handler = DAML.models[word]
          } 
          else if(!DAML.parse && tests.word.test(word)) { // flying blind
            state.handler = {methods: {}}
          } 
          
          if(state.handler) {
            returnType = HANDLER
            state.now.mode = 'methoding'
          }
          else {
            stream.backUp(word.length)
            state.now.mode = 'pvaling'             
          }
        break
        
        case 'methoding': // eat a method or pyuukk
          var word = getNextWord(stream)
          
          if(state.handler.methods[word]) {
            state.method = state.handler.methods[word]
            returnType = METHOD
          } else {
            state.now.mode = 'commenting' // FIXME! 'erroring' goes till next terminator
            returnType = ERROR
          }
          
          if(DAML.metho[word]) {
            state.handler = DAML.models[word]
          } 
          else if(!DAML.parse && tests.word.test(word)) { // flying blind
            state.handler = {methods: {}}
          } 
          
          if(state.handler) {
            returnType = HANDLER
            state.now.mode = 'methoding'
          }
          else {
            stream.backUp(word.length)
            state.now.mode = 'pvaling'             
          }
          
          if(!state.handler) {
            if(DAML.models[word]) {
              state.handler = DAML.models[word]
              returnType = HANDLER              
            } 
            else if(DAML && DAML.aliases[word]) {
              state.now.mode = 'aliasing'
              state.now.alias = word
              // derp!!!!
            }
            else {
              state.now.mode = 'commenting' // FIXME! 'erroring' goes till next terminator
              returnType = ERROR
            }
          }
          else if(!state.method) {
            if(state.handler.methods[word]) {
              state.method = state.handler.methods[word]
              returnType = METHOD
            } else {
              state.now.mode = 'commenting' // FIXME! 'erroring' goes till next terminator
              returnType = ERROR
            }
          }

          
          
          // if(DAML && DAML.models[word]) {
          //   state.now.mode = 'handling'
          //   state.now.handler = DAML.models[word]
          // }
          // else if(DAML && DAML.aliases[word]) {
          //   state.now.mode = 'aliasing'
          //   state.now.alias = word
          // }
          // else {
          //   state.now.mode = 'pvaling' // it's a quote or list or variable or something
          // }
          // 
          // stream.backUp(word.length)
          
          
        break
        
        
        case 'pvaling': // treat as a param
          if(likeNumber(ch, stream)) {
            returnType = eatNumber(ch, stream);
          }
          else if(ch == '(') {
            state.now.mode = 'listing'
            state.now.indentation += 2
            returnType = PAREN
          }
          else if (ch == ')') {
            state.now.indentation -= 2
            returnType = PAREN;
          } 
          else if(ch == '"') {
            state.now.mode = 'quoting'
            returnType = STRING
          }
          else if(ch == ':') {
            state.now.mode = 'symboling'
            returnType = SYMBOL
          }
          else {
            // if(tests.word.test(ch)) {              
              state.now.mode = 'variabling'
            // }
          }
        break
        
                  
                case 'aliasing': // inject alias into stream?
                  // TODO
                // break
                  
                case 'pnaming': 
                // break
                  
                case 'listing': 
                  // TODO
                // break
                
                case 'quoting': 
                  // TODO
                // break
                
                case 'symboling': 
                  // TODO
                // break
                
                case 'variabling': 
                  // TODO
                // break

        case 'outside': // outside all DAML commands
        case 'blocking': // inside a block, but outside commands
        default:
          stream.eatWhile(tests.not_open_brace)
          if(stream.peek() == '{') {
            state.now.mode = 'opening'
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
