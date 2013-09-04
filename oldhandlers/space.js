// A space contains mutable state (variables) and serializes processing. Use channels to pass information between spaces.

D.import_models({
  space: {
    desc: 'Commands for spacial manipulation',
    methods: {
      
      // {dialect: 1, stations: 1, subspaces: 1, ports: 1, routes: 1, state: 1}
      
      'add-seed': {
        desc: 'Add a new space seed',
        params: [
          { 
            key: 'dialect',
            desc: '',
            type: 'list',
            required: true
          }, 
          { 
            key: 'to',
            desc: 'A list of ending gateways',
            type: 'list',
            required: true
          }, 
        ],
        fun: function(name, dialect, block) {
          dialect = D.DIALECTS.top // TODO: what should this be?
          
          block = D.Parser.string_to_block_segment(block)
          
          if(D.SPACESEEDS[name])
            return D.setError('That space has already been added')
          
          D.SPACESEEDS[name] = new D.Space(dialect, block)
          
          // THINK: how do we constrain which spaces have access to this gateway??
          return name
        },
      },
      
    }
  }
})