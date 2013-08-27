// A dialect is a map of commands and another of aliases.

DAML.import_models({
  space: {
    desc: 'Commands for dialectical manipulation',
    methods: {
      
      add: {
        desc: 'Add a new dialect',
        params: [
          { key: 'dialect'
          , desc: 'I have no idea how this will work'
          , type: 'string'
          }
        , { key: 'block'
          , desc: 'Some code that runs when the space is "activated", whatever that means'
          , type: 'string' // TODO: this is stupid
          // , type: 'block'
          }
        ],
        fun: function(name, dialect, block) {
          dialect = DAML.DIALECTS.top // TODO: what should this be?
          
          block = DAML.Parser.string_to_block_segment(block)
          
          if(DAML.SPACESEEDS[name])
            return DAML.setError('That space has already been added')
          
          DAML.SPACESEEDS[name] = new DAML.Space(dialect, block)
          
          // THINK: how do we constrain which spaces have access to this gateway??
          return name
        },
      },
      
    }
  }
})