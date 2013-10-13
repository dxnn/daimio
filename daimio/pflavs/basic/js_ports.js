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

D.import_port_type('to-js', {
  dir: 'out',
  outside_exit: function(ship) {
    // this is very very stupid
    
    var fun = D.Etc.fun && D.Etc.fun[this.settings.thing]
    if(!fun)
      return D.setError('No fun found')
    
    fun(ship)
  }
})
