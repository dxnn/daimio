// // fiddly DOM connection commands
// 
// D.import_models({
//   dom: {
//     desc: "Basic DOM commands",
//     help: "This is a bit wonky at the moment. Maybe it always will be, due to the wonkiness of the DOM.",
//     vars: {bindings: {}},
//     methods: {
// 
//       // BINDINGS AND WHATNOT
// 
//       on: {
//         desc: "Attach a Daimio action to an event on a DOM element.",
//         help: "See http://api.jquery.com/on/ for more details.",
//         params: [
//           {
//             key: 'event',
//             desc: "An event name, like click or focus",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'daimio',
//             desc: "A Daimio template",
//             type: 'block',
//           },
//           {
//             key: 'filter',
//             desc: "A jQuery filter string for sub-items",
//             type: 'string',
//           },
//           {
//             key: 'continue',
//             desc: "Continue event propagation (defaults to false, which cancels the event)",
//             type: 'string',
//           },
//         ],
//         fun: function(event, id, daimio, filter, _continue) {
//           var fun = function(e) {
//             var faux_this = {}
//             
//             faux_this.id = this.id.id || this.id // THINK: non-strings or objects may bork this...
//             faux_this.dataset = this.dataset
//             // THINK: these could be quite large and unweildy, and you can get them if you need them from the id.
//             // faux_this.innerHTML = this.innerHTML;
//             // faux_this.outerHTML = this.outerHTML;
//             faux_this.pageX = e.pageX
//             faux_this.pageY = e.pageY
//             faux_this.type = e.type
//             
//             D.import_var('this', faux_this) // THINK: make this __this or something???
//             
//             if(event.slice(0,6) == 'submit') {
//               var commands = ''
//               $.each($(this).serializeArray(), function(i, field) {
//                 D.import_var(field.name, field.value)
//                 if(field.name == 'commands') commands = field.value
//               })
//               if(commands) {
//                 D.run(commands)
//               }
//             }
//             
//             D.run(daimio)
//             return !!_continue;
//           };
//           
//           if(filter) {
//             $('#' + id).on(event, filter, fun)
//           } else {
//             $('#' + id).on(event, fun)
//           }
//         },
//       },
//       
//       off: {
//         desc: "Remove a Daimio action from an event on a DOM element.",
//         help: "See http://api.jquery.com/off/ for more details.",
//         params: [
//           {
//             key: 'event',
//             desc: "An event name, like click or focus",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'filter',
//             desc: "A jQuery filter string for sub-items",
//             type: 'string',
//           },
//         ],
//         fun: function(event, id, filter) {
//           // TODO: allow this to accept a block and only cancel that one listener. (until then this is kind of broken for some contexts)
//           if(filter) {
//             $('#' + id).off(event, filter)
//           } else {
//             $('#' + id).off(event)
//           }
//         },
//       },
//       
//       trigger: {
//         desc: "Fire an event on a DOM element, triggering any attached event handlers",
//         help: "See http://api.jquery.com/trigger/ for more details.",
//         params: [
//           {
//             key: 'event',
//             desc: "An event name, like click or focus",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(event, id) {
//           $('#' + id).trigger(event)
//         },
//       },
//       
//       onkey: {
//         desc: "Sugar for key events",
//         help: "Uses 'on' under the hood. Always attached to the top-level document.",
//         params: [
//           {
//             key: 'key',
//             desc: "A single keyboard key.", //  Prefix with ^ to require control modifier.
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'daimio',
//             desc: "A Daimio template",
//             type: 'block',
//             required: true,
//           },
//           {
//             key: 'type',
//             desc: "Accepts up, down, or press. Defaults to press.",
//             type: 'string',
//             fallback: 'press',
//             falsy: false,
//           },
//         ],
//         fun: function(key, daimio, type) {
//           // TODO: merge this with the 'on' fun, somehow
//           key = key.charCodeAt(0)
//           
//           var fun = function(e) {
//             if(e.which != key) return true
//             
//             var faux_this = {}
//             
//             faux_this.id = this.id
//             faux_this.dataset = this.dataset
//             // THINK: these could be quite large and unweildy, and you can get them if you need them from the id.
//             // faux_this.innerHTML = this.innerHTML;
//             // faux_this.outerHTML = this.outerHTML;
// 
//             faux_this.which = e.which
//             faux_this.pageX = e.pageX
//             faux_this.pageY = e.pageY
//             faux_this.type = e.type
//             
//             D.import_var('this', faux_this)
//             
//             D.run(daimio)
//             return false
//           }
//           
//           var event = 'key' + (['up', 'down'].indexOf(type) == -1 ? 'press' : type)
//           $(document).on(event, fun)
//         },
//       },
//       
//       // TEMPLATES AND SUCH
//       
//       set_template: {
//         desc: "Bind a template to a DOM element",
//         help: "Note that the template is for the *content* of the DOM element, not including the element itself (i.e., this uses innerhtml).",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'daimio',
//             desc: "A Daimio template",
//             type: 'block',
//             required: true,
//           },
//         ],
//         fun: function(id, daimio) {
//           this.vars.bindings[id] = daimio.toFun()
//           return daimio
//         },
//       },
//       
//       refresh: {
//         desc: "Update a DOM element's template",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(id) {
//           var template = this.vars.bindings[id]
//           if(!template) return D.onerror(id, "You must bind the element before you refresh it. Use {dom set} to set an element's content.")
//           
//           var el = document.getElementById(id)
//           if(!el) return D.onerror(id, "Invalid element id.")
//           
//           el.innerHTML = D.run(template).replace(/^\s+|\s+$/g, '') // FIXME: this shouldn't have to trim!
//         },
//       },
//       
//       get_value: {
//         desc: "Get the value of a form element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(id) {
//           var el = document.getElementById(id)
//           if(!el) return D.onerror(id, "Invalid element id.")
//           
//           return el.value
//         },
//       },
//       
//       set_value: {
//         desc: "Set the value of a form element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'to',
//             desc: "A value",
//             type: 'string',
//             required: true,
//           },
//         ],
//         fun: function(id, to) {
//           var el = document.getElementById(id)
//           if(!el) return D.onerror(id, "Invalid element id.")
//           
//           return el.value = to
//         },
//       },
//       
//       get_html: {
//         desc: "Get the content of a DOM element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(id) {
//           var el = document.getElementById(id)
//           if(!el) return D.onerror(id, "Invalid element id.")
//           
//           return el.innerHTML
//         },
//       },
//       
//       set_html: {
//         desc: "Set the content of a DOM element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//           {
//             key: 'to',
//             desc: "A content string",
//             type: 'string',
//             required: true,
//           },
//         ],
//         fun: function(id, to) {
//           var el = document.getElementById(id)
//           if(!el) return D.onerror(id, "Invalid element id.")
//           
//           el.innerHTML = to
//         },
//       },
//       
//       show: {
//         desc: "Show a hiding element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(id) {
//           $('#' + id).show()
//         },
//       },
//       
//       hide: {
//         desc: "Hide an element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(id) {
//           $('#' + id).hide()
//         },
//       },
//       
//       toggle: {
//         desc: "Toggle an element",
//         params: [
//           {
//             key: 'id',
//             desc: "The element's id",
//             type: 'string',
//             required: true,
//             falsy: false,
//           },
//         ],
//         fun: function(id) {
//           // THINK: this might not be necessary
//           $('#' + id).toggle()
//         },
//       },
//             
//       
//       log: {
//         desc: "Log something",
//         params: [
//           {
//             key: 'value',
//             desc: "A value to log",
//           },
//         ],
//         fun: function(value) {
//           console.log(value)
//         },
//       },
//             
//     }
//   }
// });