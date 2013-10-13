D.import_port_type('dom-on-change', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('change', this.settings.thing, function(value) {self.enter(value)})
  }
})
