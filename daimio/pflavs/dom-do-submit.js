D.import_port_flavour('dom-do-submit', {
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
