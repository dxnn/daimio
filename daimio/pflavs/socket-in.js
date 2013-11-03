D.import_port_flavour('socket-in', {
  dir: 'in',
  outside_add: function() {
    var self = this
      , channel = 'bounced'
    
    if(self.settings.all.length > 2)
      channel = self.settings.thing // explicit third param only -- no sugar
    
    socket.on(channel, function (ship) {
      // if(!ship.user) return false
      self.enter(ship)
    })
    
  }
})
