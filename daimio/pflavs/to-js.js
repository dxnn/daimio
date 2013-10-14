D.import_port_type('to-js', {
  dir: 'out',
  outside_exit: function(ship) {
    // this is very very stupid
    
    var fun = D.Etc.fun && D.Etc.fun[this.settings.thing]
    if(!fun)
      return D.set_error('No fun found')
    
    fun(ship)
  }
})
