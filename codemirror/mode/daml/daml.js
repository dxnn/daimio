/**
 * Author: dann
 * A CodeMirror mode for DAML
 *  (forked from Clojure mode by Hans Engel 
 *    (branched from Scheme mode by Koh Zi Han 
 *      (based on implementation by Koh Zi Chun)))
 */
CodeMirror.defineMode("daml", function() {
  
	if(typeof DAML == 'undefined') DAML = false; // use live DAML env if we have it

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
    lang_keyword: /[\w*+!\-_?:\/]/,
    breaking: /[\s+)}]/,
    not_breaking: /[^\s)}]/,
    not_open_brace: /[^{]/
  };


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
    
    if(tests.breaking.test(ch)) return NUMBER   
    
    stream.eatWhile(tests.not_breaking)
    return ERROR
  }
  
  
  function Stately(oldNow) { // represents a state stack object
    this.handler = ''
    this.model = ''
    this.usedPs = []
    this.mode = 'outside'
    this.quoteLevel = oldNow.quoteLevel || 0
    this.indentation = oldNow.indentation || null
    // return this // remind me again why we don't need this?
  }

  function pushState(state) {
    state.stack.push(state.now)
    state.now = new Stately(state.now);

    // var stack = state.stateStack.concat([]) // copy of old stateStack
    // stack.push(state);
    // if(!state) state = {quoteLevel: 0, indentation: 0}
    // state = new stateStack(state, indent, type, state.stateStack);
  }

  function popState(state) {
    state.now = state.stack.pop();
  }

  function getNextWord(stream) {
    var word = '', letter
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
        
        case 'outside': // outside all DAML commands
        case 'blocking': // inside a block, but outside commands
          stream.eatWhile(tests.not_open_brace)
          if(stream.peek() == '{') {
            state.now.mode = 'opening'
          }
          // var next;
          // while((next = stream.next()) != null) {
          //   if (next == "{") {
          //     state.now.mode = 'inside'
          //     stream.backUp(1)
          //     break;
          //   }
          // }
          returnType = null
        break
        
        case 'opening': // detected an opening brace
          stream.next() 
          pushState(state)
          state.now.mode = 'detecting'
          state.now.indentation += 2
          returnType = BRACE
        break
        
        case 'closing': // detected a closing brace
          stream.next() 
          popState(state)
          // state.now.mode = 'detecting'
          // state.now.indentation -= 2
          returnType = BRACE
        break
        
        case 'detecting': // detects comments, handlers, pvals and aliases
          ch = stream.next()
          
          if(ch == '/') {
            state.now.mode = 'commenting'
            returnType = COMMENT
          }
          else if(ch == '}') {
            state.now.mode = 'closing' // empty command
            stream.backUp(1)
          }
          else {
            var word = ch + getNextWord(stream)
            
            if(DAML && DAML.models[word]) {
              state.now.mode = 'handling'
            }
            else if(DAML && DAML.aliases[word]) {
              state.now.mode = 'aliasing'
            }
            else {
              state.now.mode = 'pvaling' // it's a quote or list or variable or something
            }
            
            stream.backUp(word.length)
          }
          
          // else if(ch == '(') {
          //   state.now.mode = 'listing'
          //   returnType = PAREN
          // }
          // else if(ch == '"') {
          //   state.now.mode = 'quoting'
          //   returnType = null
          //   stream.backUp(1)
          // }
          // else if(ch == ':') {
          //   state.now.mode = 'symboling'
          //   returnType = null
          //   stream.backUp(1)
          // }
          // else {
          //   // if(tests.word.test(ch))
          //     // state.now.mode = 'variabling'
          // }
          
        break
        
        case 'inside':
        default:
          ch = stream.next()

          if(ch == '}') {
            state.now.mode = 'closing'
            stream.backUp(1)
          }
          else if(likeNumber(ch, stream)) {
            returnType = eatNumber(ch, stream);
          } 
          else if (ch == "(") {
            state.now.indentation += 2
            returnType = PAREN;
          } 
          else if (ch == ")") {
            state.now.indentation -= 2
            returnType = PAREN;
          } 
          else if ( ch == ":" ) {
            stream.eatWhile(tests.lang_keyword);
            return SYMBOL;
          } 
          else {
            stream.eatWhile(tests.word);

            if (commands && commands.propertyIsEnumerable(stream.current())) {
              returnType = HANDLER;
            } 
            else if (aliases && aliases.propertyIsEnumerable(stream.current())) {
              returnType = METHOD;
            } 
            else returnType = null;
          }
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
