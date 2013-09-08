// The daggr interface model

D.import_models({
  daggr: {
    desc: "Slices graphs into graphics (simple vector ones, at that)",
    help: "Daggr is a push-only interface: you can't use it as a data-store. You tell it what to render, set_data on items when things change, and move, re-render and remove as needed. Fancy rendering requires building a new type in JS.",
    vars: {},
    methods: {

      ////// ADDING & REMOVING //////

      add_sheet: {
        desc: "Create a new SVG sheet",
        params: [
          {
            key: 'id',
            desc: "The sheet id",
            type: 'string',
            required: true
          },
          {
            key: 'el',
            desc: "Container element's id",
            type: 'string',
            required: true
          },
        ],
        fun: function(id, el) {
          var sheet = Daggr.new_sheet(id, el);
          return sheet.id;
        },
      },

      add: {
        desc: "Add a thing to a sheet",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'type',
            desc: "A type, like node or port or edge",
            type: 'string',
            required: true,
          },
          {
            key: 'id',
            desc: "The node id",
            type: 'string',
          },
          {
            key: 'data',
            desc: "Additional node data",
            type: 'list',
          },
        ],
        fun: function(sheet, type, id, data) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          data = data || {};
          data.id = id;
          
          var thing = sheet.add_thing(type, data);
          return thing ? thing.id : false;
        },
      },
      
      remove: {
        desc: "Remove a thing from its sheet",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.onerror('Invalid thing id');
          
          if(thing.remove()) return sheet.id;
        },
      },

      
      ////// SETTING STUFF //////
          
      find_traits: {
        desc: "Find all the traits",
        params: [
        ],
        fun: function() {
          return Object.keys(Daggr.Traits);
        },
      },
      
      add_type: {
        desc: "Build a new type",
        help: "A type pairs a default template with some composable traits that respond to particular data points (like the 'movable' trait listens for x and y).",
        params: [
          {
            key: 'key',
            desc: 'A unique single-word string identifying this thing type',
            type: 'string',
            required: true,
          },
          {
            key: 'block',
            desc: 'A Daimio template',
            type: 'block',
            required: true,
          },
          {
            key: 'traits',
            desc: 'A set of trait keys',
            type: 'list',
          },
          {
            key: 'data',
            desc: 'A hash of data to feed the traits',
            type: 'list',
          },
        ],
        fun: function(key, template, traits, data) {
          // ok, fun.
        },
      },
      
      append: {
        desc: "Put a thing into some other thing",
        help: "Note that only the first element matching the jquery filter is moved.",
        params: [
          {
            key: 'thing',
            desc: 'A thing id',
            type: 'string',
            required: true,
          },
          {
            key: 'filter',
            desc: 'A jquery filter',
            type: 'string',
            required: true,
          },
        ],
        fun: function(thing, filter) {
          // ok, fun.
        },
      },
      
      
      set_template: {
        desc: "Set a template for a type",
        help: "Types are built-in things for doing stuff",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'type',
            desc: "A type, like node or port or edge",
            type: 'string',
            required: true,
          },
          {
            key: 'daimio',
            desc: "A new daimio template for the template",
            type: 'block',
            required: true,
          },
        ],
        fun: function(sheet, type, daimio) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          if(sheet.set_template(type, daimio)) return sheet.id;
        },
      },
      
      set_data: {
        desc: "Set some data for a thing",
        help: "Things are instantiated types in a sheet with data and stuff",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
          {
            key: 'key',
            desc: "Some new data key",
            type: 'string',
            required: true,
          },
          {
            key: 'value',
            desc: "Some new data value",
            required: true,
          },
        ],
        fun: function(sheet, thing, key, value) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.onerror('Invalid thing id');
          
          // THINK: mirror objects are pretty weird... we either go whole hog and make them part of Daggr, or fiddle around out here in the handler somehow. Could attach a callback to setting things... but really, when will Daggr ever *set* values directly? but it does set them indirectly through moving sub-items. Could have a 'data' object in Daggr items that store x, y, and whatever else you put there through Daimio. That's probably the cleanest way to get the values in and out. Then it's just a matter of triggering calls on Daggr when values change, and triggering calls in Daimio when Daggr changes things... [but how do you differentiate?]
          
          // {value | > :@Daggr.{sheet}.{thing}.key}
          // D.recursive_insert(D.Vglobals, ['@Daggr', sheet.id, thing.id, key.split('.')], value);
          
          return thing.set_data(key, value);
        },
      },
      
      ////// FINDING STUFF //////
      
      // THINK: we don't have find sheet or find things in here, because Daggr isn't really meant for storing things. Instead, you should reference things in Daggr by id, and store them somewhere else (like DAGoba). And, honestly, how hard is it to keep track of your sheets? Not very. 
      
      find_types: {
        desc: "Find all the types",
        params: [
        ],
        fun: function() {
          return Object.keys(Daggr.Types);
        },
      },

      ////// DOING STUFF //////
      
      // THINK: all coords and scales are within the internal coordinate space... is that ok? Maybe we need a convert command, that goes from coord_space x/y to pixel_space x/y. (and vice versa)
      
      pan: {
        desc: "Move around in the sheet",
        help: "Panning can find you gold. Also: dx and dy are additive shifts to the current positioning: dx of 100 will shift the viewbox 100 screen units (*not* svg coord units) to the right.",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'dx',
            desc: "Difference in x",
            type: 'number',
            required: true,
          },
          {
            key: 'dy',
            desc: "Difference in y",
            type: 'number',
            required: true,
          },
        ],
        fun: function(sheet, dx, dy) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          sheet.pan(dx, dy);
          return sheet.id;
        },
      },
      
      scale: {
        desc: "Zoomin or out",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'ratio',
            desc: "How low can you go?",
            type: 'number',
            required: true,
          },
        ],
        fun: function(sheet, ratio) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          sheet.scale(ratio);
          return sheet.id;
        },
      },
      
      //////// DOING THINGS /////////
      
      move: {
        desc: "Move a thing within a sheet",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
          {
            key: 'x',
            desc: "Absolute client coordinate (pageX)",
            type: 'number',
          },
          {
            key: 'y',
            desc: "Absolute client coordinate (pageY)",
            type: 'number',
          },
          {
            key: 'dx',
            desc: "Relative client coordinate",
            type: 'number',
          },
          {
            key: 'dy',
            desc: "Relative client coordinate",
            type: 'number',
          },
        ],
        fun: function(sheet, thing, x, y, dx, dy) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.onerror('Invalid thing id');
          
          // NOTE: thing's x/y are in the svg coord space (so we don't have to change them all with each zoom/pan), so we need to translate the incoming page-based x/y.
          if(x || x === 0) {
            var v = sheet.screen_to_svg_coords(x, y);
            thing.x = v.x;
            thing.y = v.y;            
          } else {
            var v = sheet.screen_to_svg_vector({x: dx, y: dy});
            thing.x += v.x;
            thing.y += v.y;            
          }
          
          if(thing.move()) return thing.id;
        },
      },
      
      render: {
        desc: "Redraw some thing",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.onerror('Invalid thing id');
          
          if(thing.render()) return thing.id;
        },
      },
      
      to_back: {
        desc: "Send it to the back",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.onerror('Invalid thing id');
          
          sheet.to_back(thing.el);
          
          return thing.id;
        },
      },
            
      to_front: {
        desc: "Send it to the front",
        params: [
          {
            key: 'sheet',
            desc: "The sheet id",
            type: 'string',
            required: true,
          },
          {
            key: 'thing',
            desc: "A thing id",
            type: 'string',
            required: true,
          },
        ],
        fun: function(sheet, thing) {
          sheet = Daggr.sheets[sheet];
          if(!sheet) return D.onerror('Invalid sheet id');
          
          thing = sheet.things[thing];
          if(!thing) return D.onerror('Invalid thing id');
          
          sheet.to_front(thing.el);
          
          return thing.id;
        },
      },
      
      spewtime: {
        desc: "log time since last call",
        params: [
          
        ],
        fun: function() {
          if(typeof oldtime == 'undefined') oldtime = 0; 
          newtime = new Date().getTime();    
          console.log(newtime - oldtime);
          oldtime = newtime;
        },
      },
      
      
    }
  }
});

if(window.Daggr) {
  Daggr.onerror = D.onerror;
}
