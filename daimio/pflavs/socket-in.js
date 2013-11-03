D.import_port_flavour('socket-in', {
  dir: 'in',
  outside_add: function() {
    var self = this
      , channel = 'bounced'
    
    if(self.settings.all.length > 2)
      channel = self.settings.thing // explicit third param only -- no sugar
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')

    D.Etc.socket.on(channel, function (ship) {
      self.enter(ship)
    })
    
  }
})
