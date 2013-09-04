// Commands for button counts
// (c) dann toliver 2013

D.import_models({
  count: {
    desc: "Buttony counting commands",
    methods: {

      'get': {
        desc: 'Request the current button value from the server',
        params: [],
        fun: function(prior_starter) {
          
          // THINK: maybe make these gateways also???
          
          D.db.collection('presses', function(err, c) {
            c.find({_id: 'global'}).toArray(function(err, items) {
              prior_starter(items[0]['count'])
            })
          })
          
          return NaN // signal that we've "gone async"
        },
      },

      inc: {
        desc: 'Increase the current button value on the server',
        params: [],
        fun: function(name, type, data) {

          D.db.collection('presses', function(err, c) {
            c.update({'_id': 'global'}, {'$inc': {'count': 1}}, {}, function(err, result) {});
          })
          
          return true // we don't care about the return value of the above call, so we don't actually "go async"
        },
      },

    }
  }
})