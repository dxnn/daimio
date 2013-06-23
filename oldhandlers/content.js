// content commands... these might be katsu specific, maybe we should move them.

DAML.import_models({
  content: {
    desc: "Some content-like things",
    methods: {
      
      'get': {
        desc: 'Get a piece of content from Katsu',
        params: [
          {
            key: 'value',
            desc: 'A content item key',
            type: 'string',
            required: true
          },
        ],
        fun: function(value) {
          // THINK: maybe make this poke content into DAML.content instead of Katsu.content...
          return Katsu.content[value];
        },
      },
      
    }
  }
});