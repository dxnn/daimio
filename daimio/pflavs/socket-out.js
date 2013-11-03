D.import_port_flavour('socket-out', {
  dir: 'out',
  outside_exit: function(ship) {
<<<<<<< HEAD
    var channel = 'bounce'
    
    if(this.settings.all.length > 2)
      channel = this.settings.thing // explicit third param only -- no sugar
    
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')

    D.Etc.socket.emit(channel, ship)
  }
})
