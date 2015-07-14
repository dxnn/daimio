D.import_port_flavour('dom-do-submit', {
  dir: 'out',
  settings: [
    {
      key: 'thing',
      desc: 'The form element id to submit',
      type: 'id'
    },
    {
      key: 'parent',
      desc: 'A dom element contain thing. Defaults to document.',
      type: 'id'
    },
  ],
  outside_exit: function(ship) {
    if(this.element)
      this.element.submit()
    // TODO: fallthrough to dynamic instead of a fixed element
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)

    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')

    if(!('submit' in this.element))
      return D.set_error('That dom thing has no submit')
  }
})
