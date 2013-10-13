// A channel has some inports, some outports, and can have values manually pushed on to it. they connect gateways to gateways

D.import_models({
  channel: {
    desc: 'Commands for channel manipulation',
    methods: {
      
      bind: {
        desc: 'Composite channel command that does too much too well',
        params: [
          { 
            key: 'from',
            desc: 'A list of starting gateways',
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
        fun: function(from, to, prior_starter, process) {
          
          // TODO: make a real gateway type, and then type: list[gateway]
          var make_me_a_gateway = function(maybe_gateway) {
            // THINK: what is an @gateway var thing? is it just an id?
            
            if(D.GATEWAYS[maybe_gateway])
              return maybe_gateway

            // so maybe_gateway is a block, but it's unfuncified... so func it.
            // var block = D.Types['block'](maybe_gateway)
            
            // erm... block gets space.execute'd so keep it as a segment...
            // except what if it's just a string?
            
            return D.add_gateway(null, 'spaceship', {block: maybe_gateway, space: process.space}).name
          }
          
          from = from.map(make_me_a_gateway)
          
          to = to.map(make_me_a_gateway)
          
          // herp derp merp berp
          
          var channel_name = 'channel:' + Math.random()
            , channel = D.Commands.channel.methods.add.fun(channel_name)
          
          from.forEach(function(gateway_name) {
            D.Commands.channel.methods['attach-to-start'].fun(channel_name, gateway_name)
          })
          
          to.forEach(function(gateway_name) {
            D.Commands.channel.methods['attach-to-end'].fun(channel_name, gateway_name)
          })
          
          console.log(to)
          
          return to
        },
      },
      
      add: {
        desc: 'Add a new channel',
        params: [
          { key: 'name'
          , desc: 'The name for the channel -- currently needs to be unique systemwide'
          , type: 'string'
          , required: true
          }, // THINK: mix/match with commas first is weird, but it's all a hack to get around needing commas in the first place.
        ],
        fun: function(name) {
          D.CHANNELS[name] = {
            name: name,
            startpoints: [],
            endpoints: []
          }
          
          // THINK: how do we constrain which spaces have access to this channel??
          return name
        },
      },
      
      'attach-to-start': {
        desc: 'Connect a gateway to the beginning of a channel',
        params: [
          {
            key: 'name',
            desc: 'The channel name',
            type: 'string',
            required: true
          },
          // {
          //   key: 'side',
          //   desc: 'Either start or end', 
          //   type: 'string',
          // },
          {
            key: 'gateway',
            desc: 'The gateway name',
            // TODO: modify the type system: 
            // type: Either('start', 'end')
            // type: ListOf('number')
            // type: ListOf('anything')
            // golly...
            type: 'string',
          },
        ],
        fun: function(name, gateway_name) {
          var channel = D.CHANNELS[name]
            , gateway = D.GATEWAYS[gateway_name]
          
          if(!channel) {
            D.set_error('That is not a valid channel')
            return name
          }
          
          if(!gateway) {
            D.set_error('That is not a valid gateway')
            return name
          }
          
          channel.startpoints.push(gateway)
          
          var cb = function(value, callback) {
            channel.endpoints.forEach(function(end_gateway) {
              end_gateway.sendMessage(value, callback)
            })
          }
          
          gateway.addListener(cb)
          
          return name
        },
      },
      
      'attach-to-end': {
        desc: 'Connect a gateway to the end of a channel',
        params: [
          {
            key: 'name',
            desc: 'The channel name',
            type: 'string',
            required: true
          },
          {
            key: 'gateway',
            desc: 'The gateway name',
            type: 'string',
          },
        ],
        fun: function(name, gateway_name) {
          var channel = D.CHANNELS[name]
            , gateway = D.GATEWAYS[gateway_name]
          
          if(!channel) {
            D.set_error('That is not a valid channel')
            return name
          }
          
          if(!gateway) {
            D.set_error('That is not a valid gateway')
            return name
          }
          
          channel.endpoints.push(gateway)
          
          return name
        },
      },
      
      send: {
        desc: "Send a value directly onto a channel",
        params: [
          {
            key: 'name',
            desc: 'A channel name',
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
        fun: function(name, value, callback) {
          var channel = D.CHANNELS[name]
          
          if(!channel) {
            D.set_error('That is not a valid channel')
            return name
          }
          
          // THINK: should we consider an option for blocking channels that wait for an endpoint to 'be ready to receive'?
            
          channel.endpoints.forEach(function(end_gateway) {
            end_gateway.sendMessage(value, callback)
          })
        
          return value
        },
      },
      
    }
  }
})