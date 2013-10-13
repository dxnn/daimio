
~function() {
  var timeouts = [];
  var messageName = 12345;

  // Like setTimeout, but only takes a function argument.  There's
  // no time argument (always zero) and no arguments (you have to
  // use a closure).
  function setImmediate(fn) {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
  }

  function handleMessage(event) {
    if(event.data == messageName) {
      event.stopPropagation();
      if(timeouts.length > 0) {
        timeouts.shift()()
      }
    }
  }
  
  if(typeof window != 'undefined') {
    window.addEventListener("message", handleMessage, true);

    // Add the one thing we want added to the window object.
    window.setImmediate = setImmediate;
  }
}();
