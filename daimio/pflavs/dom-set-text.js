// TODO: convert these 'set' style ports to use track_event

// THINK: can we genericize this to handle both set-text & set-value?
D.import_port_flavour('dom-set-text', {
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
