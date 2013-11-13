D.import_port_flavour('dom-on-mouseover', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('mouseover', this.settings.thing, function(value) {self.enter(value)})
  }
})
