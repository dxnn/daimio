// Seems like a better name for this flavour might be `http-get`, but I'll keep it `xhr-send` in
// deference to the current naming convention of the ajax sending functions.
D.import_port_flavour('xhr-send', {
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
    outside_exit: function (ship) {
	    xhr_get(ship, D.noop)
    }
})
