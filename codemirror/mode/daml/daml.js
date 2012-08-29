/**
 * Author: dann
 * Forked from CodeMirror's Clojure mode 
 *   (by Hans Engel, branched from Scheme mode 
 *     (by Koh Zi Han, based on implementation by Koh Zi Chun))
 */
CodeMirror.defineMode("daml", function() {
	
	var Daml = DAML || {};

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
    terminal: /[\s+)}]/,
    not_terminal: /[^\s)}]/,
    not_brace: /[^{]/
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
    
    if(tests.terminal.test(ch)) return NUMBER   
    
    stream.eatWhile(tests.not_terminal)
    return ERROR
  }
  
  
  function Stately(oldState) { // represents a state stack object
    this.handler = ''
    this.model = ''
    this.usedPs = []
    this.currently = oldState.currently ? 'bracing' : 'outside'
    this.quoteLevel = oldState.quoteLevel || 0
    this.indentation = oldState.indentation || null
    this.oldState = oldState || {};
    // return this // remind me again why we don't need this?
  }

  function pushState(state) {
    return new Stately(state)
    
    // var stack = state.stateStack.concat([]) // copy of old stateStack
    // stack.push(state);
    // if(!state) state = {quoteLevel: 0, indentation: 0}
    // state = new stateStack(state, indent, type, state.stateStack);
  }

  function popState(state) {
    state = state.oldState;
  }

  

  return {
    startState: function(baseIndent) {
      var quasistate = {indentation: baseIndent}
      return new Stately(quasistate)
    },

    token: function (stream, state) {
      if(state.indentation == null && stream.sol()) {
        // update indentation, but only if indentStack is empty
        state.indentation = stream.indentation();
      }

      if(stream.eatSpace()) return null  // skip spaces
      var returnType = null, ch = null

      switch(state.currently) {
        
        case 'outside': // outside all DAML commands
        case 'blocking': // inside a block, but outside commands
          stream.eatWhile(tests.not_brace)
          if(stream.peek() = '{') state.mode = 'bracing'
          
          // var next;
          // while((next = stream.next()) != null) {
          //   if (next == "{") {
          //     state.mode = 'inside'
          //     stream.backUp(1)
          //     break;
          //   }
          // }
          returnType = null
          break
          
        case 'bracing': // detected an opening brace
          stream.next() 
          pushState(state)
          state.mode = 'detecting'
          state.indentation += 2
          returnType = BRACE
          break
          
        case 'detecting': // detects comments, handlers, pvals and aliases
          ch = stream.next()
          
          if(ch == '/') {
            state.mode = 'commenting'
            returnType = COMMENT
          }
          else if(ch == '(') {
            state.mode = 'listing'
            returnType = PAREN
          }
          else {
            // get word
            var word = '', letter
            while((letter = stream.eat(tests.word)) != null) {
              keyWord += letter;
            }

            //  {
            // if in DAML handlers
              state.mode = 'handling'
            // if in DAML aliases
              state.mode = 'aliasing'
            // if(tests.word.test(ch))
              state.mode = 'variabling'
            // otherwise
              state.mode = 'pvaling' // it's a quote or list or something weird
            
            stream.backup(1)
          }
          
          
          returnType = null
          break
          
        default: // default parsing mode
          ch = stream.next()

          if (ch == '}') {
            state.mode = 'outside';
            returnType = STRING;
          } 
          else if (ch == ";") { // comment
            stream.skipToEnd(); // rest of the line is a comment
            returnType = COMMENT;
          } 
          else if(likeNumber(ch, stream)) {
            returnType = eatNumber(ch, stream);
          } 
          else if (ch == "{" || ch == "(") {
            returnType = ch == "{" ? BRACE : PAREN;
          } 
          else if (ch == ")" || ch == "}") {
            returnType = ch == ")" ? PAREN : BRACE;
            if (state.indentStack != null && state.indentStack.type == (ch == ")" ? "(" : "{")) {
              popStack(state);
            }
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
      if (state.indentStack == null) return state.indentation;
      return state.indentStack.indent;
    }
  };
});

CodeMirror.defineMIME("text/x-daml", "daml");
