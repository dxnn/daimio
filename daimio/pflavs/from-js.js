D.import_port_flavour('from-js', {
  dir: 'in',
  outside_add: function(port) {
    this.default_value = this.settings.all.length > 2
                       ? this.settings.thing
                       : 1
  },
  enter: function(ship, process) {
    var value = ship !== undefined ? ship : this.default_value
    D.port_standard_enter.call(this, value, process)
  }
})
