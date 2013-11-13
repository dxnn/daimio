D.import_port_flavour('dom-on-mouseout', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('mouseout', this.settings.thing, function(value) {self.enter(value)})
  }
})
