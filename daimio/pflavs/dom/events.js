D.import_port_type('dom-on-click', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('click', this.settings.thing, function(value) {self.enter(value)})
  }
})
    
D.import_port_type('dom-on-blur', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('blur', this.settings.thing, function(value) {self.enter(value)})
  }
})
    
D.import_port_type('dom-on-change', {
  dir: 'in',
  outside_add: function() {
    var self = this
    D.track_event('change', this.settings.thing, function(value) {self.enter(value)})
  }
})

D.import_port_type('dom-on-submit', {
  dir: 'in',
  outside_add: function() {
    var self = this
    
    var callback = function(value, event) {
      var ship = {}
        , element = event.target
        
      // TODO: buckle down and have this suck out all form values, not just the easy ones. yes, it's ugly. but do it for the kittens.
      for(var i=0, l=element.length; i < l; i++) {
        ship[element[i].name] = element[i].value
      }
      self.enter(ship) 
    }
        
    D.track_event('submit', this.settings.thing, callback)
  }
})


// TODO: convert these 'set' style ports to use track_event

// THINK: can we genericize this to handle both set-text & set-value?
D.import_port_type('dom-set-text', {
  dir: 'out',
  outside_exit: function(ship) {
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    if(this.element) 
      this.element.innerText = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)
    
    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')
    
    if(!this.element.hasOwnProperty('innerText'))
      return D.set_error('That dom thing has no innerText')
  }
})

D.import_port_type('dom-set-html', {
  dir: 'out',
  outside_exit: function(ship) {
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    if(this.element) 
      this.element.innerHTML = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)

    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')

    if(!this.element.hasOwnProperty('innerHTML'))
      return D.set_error('That dom thing has no innerHTML')
  }
})

D.import_port_type('dom-set-value', {
  dir: 'out',
  outside_exit: function(ship) {
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    if(this.element) 
      this.element.value = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)

    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')

    if(!this.element.hasOwnProperty('innerHTML'))
      return D.set_error('That dom thing has no innerHTML')
  }
})


D.import_port_type('dom-do-submit', {
  dir: 'out',
  outside_exit: function(ship) {
    if(this.element)
      this.element.submit()
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)
    
    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')
    
    if(!this.element.hasOwnProperty('innerText'))
      return D.set_error('That dom thing has no innerText')
  }
})
