D.import_port_flavour('dom-on-submit', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    var callback = function(value, event) {
      var ship = {}
        , element = event.target
        
      // TODO: buckle down and have this suck out all form values, not just the easy ones. yes, it's ugly. but do it for the kittens.
      for(var i=0, l=element.length; i < l; i++) {
        if(element[i].type == 'checkbox')
          ship[element[i].name] = element[i].checked ? element[i].value : false
        else
          ship[element[i].name] = element[i].value
      }
      self.enter(ship) 
    }
        
    D.track_event('submit', this.settings.thing, callback)
  }
})
