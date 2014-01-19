D.import_port_flavour('dom-on-keypress', {
  dir: 'in',
  outside_add: function() {
    // THINK: this requires binding to a particular DOM element -- is there a way to default to 'document'?
    var self = this
    D.track_event('keypress', this.settings.thing, function(value) {self.enter(value)})
  }
})
