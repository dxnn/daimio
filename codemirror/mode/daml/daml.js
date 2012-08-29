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
    exponent: /[eE]/,
    basic: /[\w\$_\-]/,
    lang_keyword: /[\w*+!\-_?:\/]/,
    terminal: /[\s+)}]/,
    not_terminal: /[^\s)}]/,
  };

  function stateStack(indent, type, prev) { // represents a state stack object
    this.indent = indent;
    this.type = type;
    this.prev = prev;
  }

  function pushStack(state, indent, type) {
    state.indentStack = new stateStack(indent, type, state.indentStack);
  }

  function popStack(state) {
    state.indentStack = state.indentStack.prev;
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
    
    if(tests.terminal.test(ch)) return NUMBER   
    
    stream.eatWhile(tests.not_terminal)
    return ERROR
  }

  return {
    startState: function () {
      return {
        indentStack: null,
        indentation: 0,
        mode: 'inside',        // 'outside' is raw string, 'inside' is within a daml command block
        commandStack: [],
      };
    },

    token: function (stream, state) {
      if(state.indentStack == null && stream.sol()) {
        // update indentation, but only if indentStack is empty
        state.indentation = stream.indentation();
      }

      if(stream.eatSpace()) return null  // skip spaces
      var returnType = null;

      switch(state.mode) {
        case "outside": // multi-line string parsing mode
          var next, escaped = false;
          while ((next = stream.next()) != null) {
            if (next == "\"" && !escaped) {

              state.mode = 'inside';
              break;
            }
            escaped = !escaped && next == "\\";
          }
          returnType = STRING; // continue on in string mode
          break;
        default: // default parsing mode
          var ch = stream.next()

          if (ch == "\"") {
            state.mode = "outside";
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
            stream.eatWhile(tests.basic);

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
