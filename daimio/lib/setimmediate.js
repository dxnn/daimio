
~function() {
  var timeouts = D.get_queue();
  var messageName = 12345;

  // http://dbaron.org/log/20100309-faster-timeouts
  // Like setTimeout, but only takes a function argument.  There's
  // no time argument (always zero) and no arguments (you have to
  // use a closure).
  function setImmediate(fn) {
    timeouts(fn);
    window.postMessage(messageName, "*");
  }

  function handleMessage(event) {
    if(event.data == messageName) {
      event.stopPropagation();
      var timeout = timeouts()
      if(timeout !== undefined)
        timeouts.shift()()
    }
  }
  
  if(typeof window != 'undefined') {
    window.addEventListener("message", handleMessage, true)
    window.setImmediate = setImmediate
  }
}();


// special branch for port exits
// pure time&space optimization... can maybe delete.
~function() {
  var deliveries = D.get_queue()
  var messageName = 'deliverme!';

  function setImmediate(ports, ship) {
    deliveries([ports, ship]);
    window.postMessage(messageName, "*");
  }

  function handleMessage(event) {
    if(event.data == messageName) {
      event.stopPropagation();

      var delivery = deliveries()
      if(delivery === undefined) return
      
      var ports = delivery[0]
        , ship = delivery[1]

      ports.forEach(function(port) { port.enter(ship) })
    }
  }
  
  if(typeof window != 'undefined') {
    window.addEventListener("message", handleMessage, true)
    D.port_exit_next_tick = setImmediate
  }
}();