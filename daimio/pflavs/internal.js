

D.import_port_flavour('in', {
  dir: 'in'
})

D.import_port_flavour('err', {
  dir: 'out'
  // TODO: ???
})

D.import_port_flavour('out', {
  dir: 'out'
})

D.import_port_flavour('up', {
  dir: 'up'
  // THINK: this can only live on a space, not a station
})

D.import_port_flavour('down', {
  dir: 'down',
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
  exit: function(ship, process) {
    // go down, then return back up...
    // THINK: is the callback param the right way to do this?? it's definitely going to complicate things...
    
    var self = this
    D.setImmediate(function() { 
      // self.outs.forEach(function(port) { 
      //   port.enter(ship) 
      // }) 
      
      // THINK: whether we can pass multiple ships or have to queue them depends on our routes: if they're all bidirectional we can chain the callbacks, otherwise we have to send them one at a time.

      // THINK: ideally there's only ONE route from a downport. can we formalize that?
      port = self.outs[0]
      if(port) {
        port.enter(ship, process, callback) // wat
      }
      else {
        callback(1234)
      }
    })
  }
})

D.import_port_flavour('exec', {
  dir: 'in',
  exit: function(ship) { 
    if(!this.space)
      return false
    
    // this.space.secret = ship
    this.space.execute(D.Parser.string_to_block_segment(ship.code), {secret: ship}) // TODO: ensure this is a block, not a string
  }
})


