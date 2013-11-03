D.import_port_flavour('socket-out', {
  dir: 'out',
  outside_exit: function(ship) {
    if(!D.Etc.socket)
      return D.set_error('You must place a valid socket connection in D.Etc.socket')

    D.Etc.socket.emit('bounce', ship)
  }
})
