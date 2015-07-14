
D.import_pathfinder('position', {
  keymatch: function(key) {
    if( (typeof key == 'string') && /#-?\d/.test(key) )
      return 'one'
  },
  gather: function(value, key) {
    var safe_value = (typeof value == 'object') ? value : [value]
      , vkeys = Object.keys(safe_value)
      , position = +key.slice(1)
      , index = (position < 0) ? (vkeys.length + position) : position - 1
      , output = safe_value[ vkeys[ index ] ]

    return output ? [output] : []
  },
  create: function(value, key) {
    var vkeys = Object.keys(value)

    // special case for push / unshift
    if(key == '#0')
      key = '#-' + (vkeys.length + 1)
    if(key == '#-0')
      key = '#' + (vkeys.length + 1)

    var first_position = +key.slice(1)
    var abs_first_position = Math.abs(first_position)
    var position = first_position - (first_position / abs_first_position) // offset by one

    if(vkeys.length < abs_first_position) { // not enough items
      var this_key
        , excess = abs_first_position - vkeys.length

      for(var i=0; i < excess; i++) {

        if(!Array.isArray(value)) { // object
          // this_key = Math.random() // herp derp merp berp
          this_key = i + 1000000
          value[this_key] = []
          // THINK: ok, we're using integers here instead, but that means this will collide with existing keys with high probability. maybe an offset? ok, an offset. this is really really stupid.
          // THINK: using random keys here is super stooopid, but honestly what else can you do? there's no reasonable way to extend a keyed list by position. is there?
          // THINK: also note that negative positions are sorted last in keyed lists in this case, which is also weird. we'll need the parent to fix it, though, because it requires making a whole new list (you can't just delete everything and repopulate because of implementation-specific oddness in object ordering post deletion&repopulation).
        }
        else if(first_position < 0) { // backwards
          this_key = 0
          value.unshift([])
        }
        else { // forwards
          this_key = value.length
          value.push([])
        }
      }

      return [value[this_key]]
    }

    if(first_position < 0) { // negative index
      vkeys.reverse()
      position *= -1
    }

    if(typeof value[ vkeys[ position ] ] != 'object')
      value[ vkeys[ position ] ] = []

    return [ value[ vkeys[ position ] ] ]

    // value = D.to_array(value)
    // var position = Math.abs(+key.slice(1)) // THINK: if |value| < N for #-N then do this backward...
    //
    // for(var i=0, l=position; i <= l; i++)
    //   if(typeof value[i] == 'undefined')
    //     value[i] = []
    //
    // return [value[position]]
  },
  set: function(value, key, new_val) {
    // THINK: the default value of [] is a little weird on the set side... but maybe it's best for consistency?
    var vkeys = Object.keys(value)
      , position = +key.slice(1)
      , index = (position < 0) ? (vkeys.length + position) : position - 1
      , weird = false

    if(value[ vkeys[ index ] ]) {
      value[ vkeys[ index ] ] = new_val
      return
    }

    if(typeof value == 'object')
      if(D.is_empty(value))
        weird=value,value=[]


    var selected = this.create(value, key)[0]

    // at this point we've created all the dummy values, so we just need to figure out where 'selected' is...
    for(var k in value) {
      if(value[k] == selected) {
        value[k] = new_val
        continue
      }
    }

    if(weird)
      D.extend(weird, value)                        // TODO: come up with a better way to merge {} and []
  }
})
