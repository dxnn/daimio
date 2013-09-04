// Here Be UI Models


// COMMANDS

// finish_word = function(word) {
//   var value = $('#commander').val();
//   value = value.split(/ /).slice(0, -1).join(' ')
//   value = (value ? value + ' ' : '') + word + ' ';
//   $('#commander').val(value);
// };

D.import_models({
  command: {
    desc: "Interface methods for managing D commands.",
    methods: {
      
      init: {
        desc: "Initialize the command interface on a set of DOM nodes: commanddiv, commander, autofill, response and desc.",
        fun: function() {
          var self = this;
          self.search = '';
          self.current = -1;

          // build bindings
          $('#commanddiv').submit(function(e) {
            e.preventDefault();
            
            var value, command = $('#commander').val();
            
            // D.run(command);
            D.enqueue(command);

            // TODO: register history using a post-command hook in D
            
            // if(value = D.enqueue(D.parse(command, self.response_callback))) {
            //   Interfaces.history.add('> ' + command); // only log valid commands
            // }
            
            // cleanup
            $('#commander').val('');
            $('#autofill').html('').hide();
            $('#response').text('').hide();
            $('#desc').html('').hide();
            self.search = '';
            self.current = -1;
            return false;
          });

          $('#autofill').delegate('.autofill', 'click', function(e) {
            e.preventDefault();
            // finish_word($(this).text());
          });

          $('#commander').keydown(function(e) {
            var keyCode = e.keyCode || e.which, arrow = {left: 37, up: 38, right: 39, down: 40 };
            switch (keyCode) {
              case arrow.up:
              case arrow.down:
                e.preventDefault(); // block native up/down cursor-hopping behavior
              break;
            }
          });

          $('#commander').keyup(function(e) {
            var obj, keyCode = e.keyCode || e.which, arrow = {left: 37, up: 38, right: 39, down: 40 };

            // switch (keyCode) {
            //   case arrow.up:
            //     D.execute('history', 'get_prev', [self.search, self.current]);
            //     // obj = D.commands.history.methods.get_prev(self.search, self.current);
            //     if(obj && obj.string) {
            //       $('#commander').val(obj.string);
            //       self.current = obj.current;
            //     }
            //   break;
            //   case arrow.down:
            //     // TODO: down arrow at bottom should recover search phrase
            //     D.execute('history', 'get_next', [self.search, self.current]);
            //     // obj = D.commands.history.methods.get_next(self.search, self.current);
            //     if(obj && obj.string) {
            //       $('#commander').val(obj.string);
            //       self.current = obj.current;
            //     }
            //   break;
            //   case 32: // space
            //     var first_fill = $('#autofill .autofill').first().text();
            //     if(first_fill) {
            //       $('#commander').val($('#commander').val().slice(0, -1));
            //       finish_word(first_fill);
            //     }
            //     // NOTE: bleed-through
            //   default:
            //     self.search = $('#commander').val();
            //     self.current = -1;
            // 
            //     // where am i?
            //     // THINK: integrate this with the actual parser...
            //     var words=[], model={}, method={}, param={}, last_param_index=0, stuff={}, autoval='';
            // 
            //     words = $('#commander').val().split(/ /);
            //     model = D.commands[words[0]] || {};
            // 
            //     if(words.length == 1) {
            //       stuff = {
            //         type: 'model', 
            //         word: words[0], 
            //         desc: model.desc ? model.desc : '', 
            //         auto: function(string) {
            //           var regex = new RegExp('^' + string);
            //           return _.select(Object.keys(D.commands || []), function(value) {return regex.test(value);});
            //         }(words[0]),
            //       };
            //     } 
            // 
            //     if(model.methods) {
            //       method = model.methods[words[1]] || {};
            //     }
            // 
            //     if(words.length == 2) {
            //       stuff = {
            //         type: 'method', 
            //         word: words[1], 
            //         desc: method.desc ? method.desc : model.desc, 
            //         auto: function(string) {
            //           var regex = new RegExp('^' + string);
            //           return _.select(Object.keys(model.methods || []), function(value) {return regex.test(value);});
            //         }(words[1]),
            //       };
            //     }
            // 
            //     last_param_index = (words.length % 2) ? words.length - 1 : words.length - 2;
            //     if(method.params) {
            //       param = method.params[words[last_param_index]] || {};
            //     }
            // 
            //     if(words.length > 2 && last_param_index == words.length - 1) {
            //       stuff = {
            //         type: 'param', 
            //         word: words[last_param_index],
            //         desc: param.desc ? param.desc : method.desc, 
            //         auto: function(string) {
            //           var regex = new RegExp('^' + string);
            //           return _.select(Object.keys(method.params || []), function(value) {return regex.test(value);});
            //         }(words[last_param_index]),
            //       };
            //     }
            // 
            //     if(words.length > 2 && last_param_index == words.length - 2) {
            //       stuff = {
            //         type: 'value', 
            //         word: words[last_param_index], 
            //         desc: param.desc ? param.desc : method.desc, 
            //         auto: param.auto ? param.auto(words[words.length - 1]) : [],
            //       };
            //     }
            // 
            //     // show desc
            //     $('#desc').html(stuff.desc || '').show();
            // 
            //     // autofill
            //     for(var i=0; i < stuff.auto.length; i++) {
            //       autoval += '<p><a href="#" class="autofill">' + stuff.auto[i] + '</a></p>';
            //     }
            //     $('#autofill').html(autoval).show();
            // 
            //   break;
            // }

            return true;
          });
        },
      },
      
      show: {
        desc: "Show this interface",
        fun: function() {
          $('#commanddiv').show();
        },
      },
      
      hide: {
        desc: "Hide this interface",
        fun: function() {
          $('#commanddiv').hide();
        },
      },
      
    }
  },


// HISTORY

  history: {
    desc: "Interface methods for interacting with session history, and recording history to the local datastore.",
    methods: {
      
      init: {
        desc: "Set up the history interface. This requires a DOM element with id 'history'.",
        fun: function() {
          this.list = [];
          // THINK: maybe create the history div if it doesn't exist?
        },
      },
      
      show: {
        desc: "Show this interface.",
        fun: function() {
          $('#history').show();
        },
      },
      
      hide: {
        desc: "Hide this interface.",
        fun: function() {
          $('#history').hide();
        },
      },
      
      add: {
        desc: "Add an item to the history.",
        params: [
          {
            key: 'command',
            desc: 'A command to add',
            type: 'string'
          },
        ],
        fun: function(command) {
          var string = '<p>&gt; ' + command + '</p>';
          $('#history').append($(string)).scrollTop(100000);
          this.list.unshift(command);
          // OPT: use push/pop instead of unshift/shift
          // THINK: removed the queue from here... is there any benefit to queueing this?
        },
      },
      
      get_prev: {
        desc: "Get the previous history item.",
        params: [
          {
            key: 'matching',
            desc: 'Find only history items that begin with this string.',
            type: 'string'
          },
          {
            key: 'index',
            desc: 'The history index at which to begin searching.',
            type: 'string'
          },
        ],
        fun: function(matching, index) {
          var regex = new RegExp('^' + matching);
          if(index >= this.list.length - 1) {
            return {string: this.list[this.list.length - 1], 
                    current: this.list.length - 1};
          }
          for(var i=index+1; i < this.list.length; i++) {
            if(regex.test(this.list[i])) {
              return {string: this.list[i],
                      current: i};
            }
          }
        },
      },
      
      get_next: {
        desc: "Get the previous history item.",
        params: [
          {
            key: 'matching',
            desc: 'Find only history items that begin with this string.',
            type: 'string'
          },
          {
            key: 'index',
            desc: 'The history index at which to begin searching.',
            type: 'string'
          },
        ],
        fun: function(matching, index) {
          var regex = new RegExp('^' + matching);
          if(index <= 0) {
            return {string: '',
                    current: -1};
          }
          for(var i=index-1; i >= 0; i--) {
            if(regex.test(this.list[i])) {
              return {string: this.list[i],
                      current: i};
            }
          }
        },
      },
      
    }
  },


// CHAT

  chat: {
    desc: "Methods for chatting. Requires a 'chat' div.",
    methods: {
      
      init: {
        desc: "Set up the chat interface. This requires a DOM element with id 'chat'.",
        fun: function() {
          // THINK: maybe create the chat div if it doesn't exist?
        },
      },
      
      show: {
        desc: "Show this interface.",
        fun: function() {
          $('#chat').show();
        },
      },
      
      hide: {
        desc: "Hide this interface.",
        fun: function() {
          $('#chat').hide();
        },
      },
      
      say: {
        desc: "Speak into the chatroom",
        params: [
          {
            key: 'phrase',
            desc: "The phrase to speak",
            required: true
          },
          {
            key: 'name',
            desc: "Defaults to your chosen name",
            // fallback: now.name
          },
        ],
        fun: function(phrase, name) {
          // THINK: where's the server connection?
          var string = '<p><em>' + name + '</em> <span>' + phrase.replace(/_/g, ' ') + '</span></p>';
          $('#chat').append($(string)).scrollTop(100000);
        },
      },
      
    }
  },


// GAMETEXT

  // THINK: how do we generalize this?

  gametext: {
    desc: "Hooks to a particular div for displaying data. Will likely be deprecated soon.",
    methods: {
      
      init: {
        desc: "Set up the gametext interface. This requires a DOM element with id 'gametext'.",
        fun: function() {
          // THINK: maybe create the gametext div if it doesn't exist?
        },
      },
      
      show: {
        desc: "Show this interface.",
        fun: function() {
          $('#gametext').show();
        },
      },
      
      hide: {
        desc: "Hide this interface.",
        fun: function() {
          $('#gametext').hide();
        },
      },
      
      add: {
        desc: "Add some gametext",
        params: [
          {
            key: 'string',
            desc: 'A string to add',
            type: 'string'
          },
        ],
        fun: function(string) {
          $('#gametext').append($(string)).scrollTop(100000);
        },
      },
      
    }
  },



// PORTRAIT

  // THINK: how do we generalize this?

  portrait: {
    desc: "Hooks to a particular div for displaying data. Will likely be deprecated soon.",
    methods: {
      
      init: {
        desc: "Set up the portrait interface. This requires a DOM element with id 'portrait' and a Swears spritely_image.",
        fun: function() {
          // THINK: maybe create the portrait div if it doesn't exist?
        },
      },
      
      show: {
        desc: "Show this interface.",
        fun: function() {
          $('#portrait').show();
        },
      },
      
      hide: {
        desc: "Hide this interface.",
        fun: function() {
          $('#portrait').hide();
        },
      },
      
      set: {
        desc: "Set the portrait",
        params: [
          {
            key: 'string',
            desc: 'A string to add',
            type: 'string'
          },
        ],
        fun: function(sprite_loc) {
          var canvas = document.getElementById('portrait'),
              context = canvas.getContext('2d'),
              sprite_width = 80,
              sprite_height = 80;

          context.clearRect(0, 0, canvas.width, canvas.height);

          // THINK: how do we disconnect this from Swears? can we pass an 'image' type object instead?
          
          context.drawImage(Swears.spritely_image, sprite_loc[0] * sprite_width, sprite_loc[1] * sprite_height, sprite_width, sprite_height, 0, 0, canvas.width, canvas.height);
        },
      },
      
    }
  },
  
  
  // inter... faces?
    'interface': {
    help: "Interface methods",
    methods: {
      open: {
        help: "Open a closed interface",
        params: [
          {
            key: 'id',
            help: "The interface id",
            required: true,
            auto: function(string) {
              var regex = new RegExp('^' + string);
              return _.select(Object.keys(Interfaces || []), function(value) {return regex.test(value);});
            },
          },
        ],
        fun: function(id) {
          // Interfacer.open(id)
        },
      },
      close: {
        help: "Close an open interface",
        params: [
          {
            key: 'id',
            help: "The interface id",
            required: true,
            auto: function(string) {
              var regex = new RegExp('^' + string);
              return _.select(Object.keys(Interfaces || []), function(value) {return regex.test(value);});
            },
          },
        ],
        fun: function(id) {
          // Interfacer.close(id)
        },
      },
    },
  }
});
