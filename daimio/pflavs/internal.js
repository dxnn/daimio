

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
  exit: function(ship, process, callback) {
    // go down, then return back up...
    // THINK: is the callback param the right way to do this?? it's definitely going to complicate things...
    
    var self = this
    setImmediate(function() { 
      // THINK: ideally there's only ONE route from a downport. can we formalize that?
      // self.outs.forEach(function(port) { 
      //   port.enter(ship) 
      // }) 
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


