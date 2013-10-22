D.import_port_flavour('from-js', {
  dir: 'in',
  // TODO: this currently works with a space seed instead of an individual space -- should be per-space instead
  pairup: function(port) {
    var self = this
      , eventname = port.space.seed.id + '-' + this.name
    
    var callback = function(ship) {
      var value = 1
      
      if(self.settings.all.length > 2)
        value = self.settings.thing
      
      if(ship.detail !== undefined)
        value = ship.detail

      self.enter(value)
    }

    document.addEventListener(eventname, callback)

    this.pair = port
    port.pair = this
  }
})
