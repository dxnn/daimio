D.import_port_flavour('dom-on-submit', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    var callback = function(value, event) {                     // TODO: buckle down and have this suck out 
      var ship = {}                                             //       all form values, not just the easy ones. 
      var element = event.target                                //       yes, it's ugly. but do it for the kittens.
        
      for(var i=0, l=element.length; i < l; i++) {
        if(element[i].type == 'checkbox') {
          var name = element[i].name
          if(name.slice(-2) == '[]') {                          // yes, this is totally gross, but we need a way
            name = name.slice(0,-2)                             // to distinguish between single checkboxes and
            ship[name] = ship[name] ? ship[name] : []           // lists of checkboxes, and this is a well-known
            if(element[i].checked)                              // strategy. please someone solve this betterly!
              ship[name].push(element[i].value)
          } else {
            ship[name] = element[i].checked ? element[i].value : false
          }
        }
        else {
          ship[element[i].name] = element[i].value
        }
      }
      self.enter(ship) 
    }
        
    D.track_event('submit', this.settings.thing, callback)
  }
})
