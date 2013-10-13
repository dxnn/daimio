// Commands for D3
// (c) dann toliver 2012

D.import_models({
  ddd: {
    desc: "A helper for doing D3 stuff",
    help: "",
    vars: {},
    methods: {

      'do': {
        desc: 'Do something',
        help: "",
        params: [
          {
            key: 'action',
            desc: 'Some kind of js function or something',
            type: 'string',
            required: true,
          },
          {
            key: 'params',
            desc: 'A list of parameters, in order',
            type: 'list',
            required: true,
          },
          {
            key: 'options',
            desc: 'A list of options, with keys id (defaults to chart), width (800), and height (600)',
            type: 'list',
          },
        ],
        fun: function(action, params, options) {
          // FIXME: this is pretty stupid
          if(typeof D.Etc.d3[action] != 'function') return D.on_error('That is not a valid action');
          params.unshift(options[2]);
          params.unshift(options[1]);
          params.unshift(options[0]);
          // fix option length
          D.Etc.d3[action].apply(this, params);
        },
      },
    
    }
  }
});

D.Etc.d3 = {};