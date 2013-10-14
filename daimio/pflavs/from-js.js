D.import_port_type('from-js', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    var callback = function(ship) {
      self.enter(ship.detail)
    }

    document.addEventListener(this.settings.thing, callback)
  }
})
