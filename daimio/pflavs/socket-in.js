D.import_port_type('socket-in', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    socket.on('bounced', function (ship) {
      if(!ship.user) return false
      self.enter(ship)
    })
    
  }
})
