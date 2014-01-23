// Seems like a better name for this flavour might be `http-get`, but I'll keep it `xhr-send` in
// deference to the current naming convention of the ajax sending functions.
D.import_port_flavour('xhr-send', {
    dir: 'out',
    outside_exit: function (ship) {
	xhr_get(ship, D.noop)
    }
})
