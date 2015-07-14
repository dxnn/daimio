// TODO: convert these 'set' style ports to use track_event

// THINK: can we genericize this to handle both set-text & set-value?
D.import_port_flavour('dom-set-text', {
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
    // OPT: we could save some time by tying this directly to paint events: use requestAnimationFrame and feed it the current ship. that way we skip the layout cost between screen paints for fast moving events.
    // if(!(ship % 1000))
      if(this.element)
        this.element.textContent = D.stringify(ship)
  },
  outside_add: function() {
    this.element = document.getElementById(this.settings.thing)

    if(!this.element)
      return D.set_error('That dom thing ("' + this.settings.thing + '") is not present')

    if(this.element.textContent == undefined)
      return D.set_error('That dom thing has no text')
  }
})
