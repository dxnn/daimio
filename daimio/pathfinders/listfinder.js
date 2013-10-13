
D.import_pathfinder('list', {
  keymatch: function(key) {
    if(Array.isArray(key))
      return 'many'
  },
  gather: function(value, key) {
    var output = []

    for(var i=0, l=key.length; i < l; i++) {
      var this_key = key[i]
      if(Array.isArray(this_key)) { // outer list is parallel, inner list is serial, etc
        output.push(D.peek(value, key[i] ))
      } else { // scalar needs wrapping... why?
        output.push(D.peek(value, [key[i]] ))
      }
    }
    
    return output
  },
  create: function(value, key) {
    var output = []

    for(var i=0, l=key.length; i < l; i++) {
      var this_key = key[i]
      if(Array.isArray(this_key)) { // outer list is parallel, inner list is serial, etc
        output.push(D.poke(value, key[i], []))
      } else { // scalar needs wrapping... why?
        output.push(D.poke(value, [key[i]], []))
      }
    }
    
    return output
  },
  set: function(value, key, new_val) {
    var output = []
      // , temp = []

    for(var i=0, l=key.length; i < l; i++) {
      var this_key = key[i]
      if(Array.isArray(this_key)) { // outer list is parallel, inner list is serial, etc
        output.push(D.poke(value, key[i], new_val))
      } else { // scalar needs wrapping... why?
        output.push(D.poke(value, [key[i]], new_val))
      }
    }
    
    // for(var i=0, l=output.length; i < l; i++) {
    //   if(output[l] == temp)
    //     output[l] = new_val
    // }
    
    return output
  }
})
