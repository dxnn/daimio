// Ports are the only way in or out of a space

DAML.import_models({
  port: {
    desc: 'Space ports are a good deal',
    methods: {
      
      add: {
        desc: 'Add a new port',
        params: [
          { key: 'direction'
          , desc: 'One of up, down, left, or right'
          , type: 'string'
          , required: true
          }
        , { key: 'type-hint'
          , desc: "A string representing the type of the gateway. No casting is done, but sometimes it's nice to know."
          , type: 'string'
          }
        , { key: 'data'
          , desc: 'Passed in to the gateway, if there is one'
          , type: 'anything'
          }
        , { key: 'gateway'
          , desc: 'Ports with gateways might connect to the outside world, eventually'
          , type: 'string'
          }
        ],
        fun: function(direction, type, data, gateway) {
          return DAML.add_port(direction, type, data, gateway) // GUID? int for now? 
        },
      },
      
      send: {
        desc: "Send a value directly into a port",
        params: [
          {
            key: 'name',
            desc: 'A local port name',
            type: 'string',
            required: true
          },
          {
            key: 'value',
            desc: 'A value to send',
            type: 'anything',
            required: true
          },
        ],
        fun: function(name, value, prior_starter, process) {
          // var port = DAML.PORTS[id] // TODO: erp make this context(space) sensitive?
          
          // if(!port)
          //   return DAML.setError('That is not a valid port')
          // 
          // return port.sendMessage(value, prior_starter)
          
          var port = process.space.ports.filter(function(port) {return port.name == name})[0]
          if(port)
            port.enter(value, process) 
          
          return value
          // return NaN
        },
      },
      
    }
  }
})