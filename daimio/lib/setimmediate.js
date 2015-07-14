// inspired by http://dbaron.org/log/20100309-faster-timeouts

~function() {
  var later = []
  var messageName = 12345
  var gimme_a_tick = true

  function setImmediate(fn) {
    later.push(fn)

    if(gimme_a_tick) {
      gimme_a_tick = false
      window.postMessage(messageName, "*")
    }
  }

  function handleMessage(event) {
    if(event.data != messageName) return false

    event.stopPropagation()
    gimme_a_tick = true

    var now = later
    later = []

    for(var i=0, l=now.length; i < l; i++)
      now[i]()

    // OPT: put a special branch here for array messages, and then handle them like this:
    // timeouts[i][0].forEach(function(port) { port.enter(timeouts[i][1]) })  // aka ports and ship

  }

  if(typeof window != 'undefined') {
    window.addEventListener("message", handleMessage, true)
    D.setImmediate = setImmediate
  }
}();
