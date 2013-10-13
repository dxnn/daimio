
D.import_pathfinder('star', {
  keymatch: function(key) {
    if(key == '*')
      return 'many'
  },
  gather: function(value, key) {
    if(value && typeof value == 'object')
      return D.toArray(value)

    return []
  },
  create: function(value, key) {
    value = D.toArray(value) // TODO: this is wrong, but we need parent to fix it (right?)
    
    for(var i=0, l=value.length; i < l; i++)
      if(typeof value[i] != 'object')
        value[i] = []
    
    return value
  },
  set: function(value, key, new_val) {
    for(var k in value) {
      value[k] = new_val
    }
  }
})
