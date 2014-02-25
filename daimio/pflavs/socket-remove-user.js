D.import_port_flavour('socket-remove-user', {
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
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')
    
    D.Etc.socket.on('disconnected', function (ship) {
      if(!ship.user) return false
      self.enter(ship)
    })
    
  }
})
