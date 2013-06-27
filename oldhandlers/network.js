// Commands for network access
// (c) dann toliver 2012

DAML.import_models({
  network: {
    desc: "Commands for network access",
    vars: {},
    methods: {

      send: {
        desc: 'Send some things over the network',
        help: "Sends a chunk o' DAML to the server, loads the returned values into their named variables (results.DATA -> DATA), and performs the 'then' DAML.",
        params: [
          {
            key: 'string',
            desc: 'A string, usually of DAML',
            type: 'string',
            required: true,
          },
          {
            key: 'then',
            desc: 'A DAML template to perform once the data returns',
            type: 'block',
          },
          {
            key: 'context',
            desc: 'A hash, sent as POST variables',
            type: 'list',
          },
        ],
        fun: function(string, then, context) {
          // jDaimio.process(
          //   string, 
          //   context, 
          //   function(results) {
          //     DAML.execute('variable', 'set', ['this', results]);
          //     if(!_.isArray(results)) {
          //       for(var key in results) {
          //         DAML.execute('variable', 'set', [key, results[key]]);
          //       }
          //     }
          //     DAML.run(then);
          // });
        },
      },
      
      bounce: {
        desc: 'Bounce it around',
        params: [
          {
            key: 'daml',
            desc: 'A string, usually of DAML',
            type: 'string',
            required: true,
          },
        ],
        fun: function(daml) {
          if(socket) 
            socket.emit('bounce', {daml: daml})
        },
      },
      
      
    }
  }
});