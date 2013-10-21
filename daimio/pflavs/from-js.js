D.import_port_flavour('from-js', {
  dir: 'in',
  // TODO: this currently works with a space seed instead of an individual space -- should be per-space instead
  pairup: function(port) {
    var self = this
      , eventname = port.space.seed.id + '-' + this.settings.thing
    
    var callback = function(ship) {
      self.enter(ship.detail)
    }

    document.addEventListener(eventname, callback)

    this.pair = port
    port.pair = this
  }
})
