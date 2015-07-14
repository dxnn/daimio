
// NOTE: this is the fallback, and has to be imported last... so if you need to import a custom pathfinder, you'll have to pop this off and push it back on after.
// TODO: find a better way to manage importee ordering
D.import_pathfinder('key', {
  keymatch: function(key) {
    if(typeof key == 'string')
      return 'one'
  },
  gather: function(value, key) {
    return (value && value.hasOwnProperty(key))
           ? [value[key]]
           : []
  },
  create: function(value, key) {
    if(value.hasOwnProperty(key) && (typeof value[key] == 'object') )
      return [value[key]]

    value[key] = {}   // THINK: this line creates a swack of undefineds...
    return [value[key]]
  },
  set: function(value, key, new_val, parent) {
    // TODO: this can't work until we have access to the parent object...
    // if(Array.isArray(value) && !/^\d+$/.test(key)) { // proper array and non-N key
    //   // convert the array into an object so the key will stick
    //   var value_object = {}
    //   for(var i=0, l=value.length; i < l; i++)
    //     value_object[i] = value[i]
    //   value = value_object
    // }

    // TODO: array + numeric key -> sparse array. fill in the blanks with "" (all Daimio lists are dense)

    // if(!value.length && Array.isArray(value))
    //   value = // oh crap we can't convert [] to {} w/o hosing the pointer

    value[key] = new_val
  }
})
