D.import_port_flavour('socket-in', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')
    
    D.Etc.socket.on('bounced', function (ship) {
      if(!ship.user) return false
      self.enter(ship)
    })
    
  }
})
