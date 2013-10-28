// Commands for network access
// (c) dann toliver 2012

D.import_models({
  network: {
    desc: "Commands for network access",
    vars: {},
    methods: {

      send: {
        desc: 'Send some things over the network',
        help: "Sends a chunk o' Daimio to the server, loads the returned values into their named variables (results.DATA -> DATA), and performs the 'then' Daimio.",
        params: [
          {
            key: 'string',
            desc: 'A string, usually of Daimio',
            type: 'string',
            required: true,
          },
          {
            key: 'then',
            desc: 'A Daimio template to perform once the data returns',
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
          //     D.execute('variable', 'set', ['this', results]);
          //     if(!_.isArray(results)) {
          //       for(var key in results) {
          //         D.execute('variable', 'set', [key, results[key]]);
          //       }
          //     }
          //     D.run(then);
          // });
        },
      },
      
      bounce: {
        desc: 'Bounce it around',
        params: [
          {
            key: 'daimio',
            desc: 'A string, usually of Daimio ',
            type: 'string',
            required: true,
          },
        ],
        fun: function(daimio) {
          if(socket) 
            socket.emit('bounce', {daimio: daimio})
        },
      },
      
      
    }
  }
});
