D.import_port_flavour('socket-in', {
  dir: 'in',
  settings: [
    {
      key: 'thing',
      desc: 'A dom selector for binding',
      type: 'selector'
    },
    {
      key: 'parent',
      desc: 'A dom element contain thing. Defaults to document.',
      type: 'id'
    },
  ],
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
