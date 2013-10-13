D.import_port_type('dom-on-click', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('click', this.settings.thing, function(value) {self.enter(value)})
  }
})
