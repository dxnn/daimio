D.import_port_flavour('socket-add-user', {
  dir: 'in',
  settings: [
    {
      key: 'thing',
      desc: 'A dom selector for binding',
      type: 'selector'
    },
  ],
  outside_add: function() {
    var self = this
      , callback = function (ship) {
          if(!ship.user) return false
          self.enter(ship)
        }

    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')

    D.Etc.socket.on('connected', callback)
    D.Etc.socket.on('add-user', callback)
  }
})
