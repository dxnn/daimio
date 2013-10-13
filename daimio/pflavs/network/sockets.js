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

D.import_port_type('socket-out', {
  dir: 'out',
  outside_exit: function(ship) {
    if(socket)
      socket.emit('bounce', ship)
  }
})

