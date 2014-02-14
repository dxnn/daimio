D.import_port_flavour('dom-on-mouseout', {
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
    D.track_event('mouseout', this.settings.thing, this.settings.parent, function(value) {self.enter(value)})
  }
})
