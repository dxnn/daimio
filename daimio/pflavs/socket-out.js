D.import_port_flavour('socket-out', {
  dir: 'out',
  outside_exit: function(ship) {
    var channel = 'bounce'
    
    if(this.settings.all.length > 2)
      channel = this.settings.thing // explicit third param only -- no sugar
    
    if(socket)
      socket.emit(channel, ship)
  }
})
