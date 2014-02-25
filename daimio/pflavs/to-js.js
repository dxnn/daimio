D.import_port_flavour('to-js', {
  dir: 'out',
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
  outside_exit: function(ship) {
    // this is very very stupid
    
    var fun = D.Etc.fun && D.Etc.fun[this.settings.thing]
    if(!fun)
      return D.set_error('No fun found')
    
    fun(ship)
  }
})
