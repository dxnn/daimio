D.import_port_flavour('sse-receive', {
    dir: 'in',
    outside_add: function () {
	var channel = new EventSource(this.settings.thing)
	var self = this;
	channel.onmessage = function (e) { 
	    self.enter(e.data)
	}
    }
})
