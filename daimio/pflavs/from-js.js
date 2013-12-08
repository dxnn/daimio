D.import_port_flavour('from-js', {
  dir: 'in',
  pairup: function(port) {
    var self = this
    
    this.default_value = 1

    if(this.settings.all.length > 2)
      this.default_value = this.settings.thing

    this.pair = port
    port.pair = this
  },
  enter: function(ship, process) {
    var value = ship !== undefined ? ship : this.default_value
    D.port_standard_enter.call(this, value, process)
  }
})
