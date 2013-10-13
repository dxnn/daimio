D.import_port_type('socket-add-user', {
  dir: 'in',
  outside_add: function() {
    var self = this
      , callback = function (ship) {
          if(!ship.user) return false
          self.enter(ship)
        }
      
    socket.on('connected', callback)
    socket.on('add-user', callback)
    
  }
})
