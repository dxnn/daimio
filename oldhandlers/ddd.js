// Commands for D3
// (c) dann toliver 2012

DAML.import_models({
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
          if(typeof DAML.ETC.d3[action] != 'function') return DAML.onerror('That is not a valid action');
          params.unshift(options[2]);
          params.unshift(options[1]);
          params.unshift(options[0]);
          // fix option length
          DAML.ETC.d3[action].apply(this, params);
        },
      },
    
    }
  }
});

DAML.ETC.d3 = {};