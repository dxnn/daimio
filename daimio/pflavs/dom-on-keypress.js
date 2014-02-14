D.import_port_flavour('dom-on-keypress', {
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
    // THINK: this requires binding to a particular DOM element -- is there a way to default to 'document'?
    // TODO: fix this in FFX
    var self = this
    D.track_event('keypress', this.settings.thing, this.settings.parent, function(value) {self.enter(value)})
  }
})
