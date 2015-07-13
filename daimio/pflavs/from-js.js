D.import_port_flavour('from-js', {
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
    this.default_value = this.settings.all.length > 2
                       ? this.settings.thing
                       : 1
  },
  enter: function(ship, process) {
    var value = ship !== undefined ? ship : this.default_value
    D.port_standard_enter.call(this, value, process)
  }
})
