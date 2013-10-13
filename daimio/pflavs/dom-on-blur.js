D.import_port_type('dom-on-blur', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('blur', this.settings.thing, function(value) {self.enter(value)})
  }
})
