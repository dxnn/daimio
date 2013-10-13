D.import_port_type('socket-remove-user', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    socket.on('disconnected', function (ship) {
      if(!ship.user) return false
      self.enter(ship)
    })
    
  }
})
