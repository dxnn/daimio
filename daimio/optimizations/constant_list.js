D.import_optimizer('constant_list', 0.5, function(block) {
  var changed  = false
  var segments = block.segments
  var wiring   = block.wiring
  var new_segments = []
  var new_wiring   = {}
  
  for(var i=0, l=segments.length; i < l; i++) {
    var temp = []
    var places = []
    var this_segment = segments[i]
    
    new_segments.push(this_segment)

    if(!wiring[i]) continue    

    if(this_segment.type != 'List') {                   // capture the wiring 
      new_wiring[i] = wiring[i]
      continue
    }
    
    new_wiring[i] = D.clone(wiring[i])                  // or clone it if necessary
    
    for(var j=0, k=wiring[i].length; j < k; j++) {
      var wire = wiring[i][j]
      var wireseg = segments[wire]
      if(!wireseg                                       // note that && binds tighter than ||
       || wireseg.type != 'Number'                      // (but don't try this at home, kids)
       && wireseg.type != 'String' ) {
          temp.push(null)
          places.push(j)
          continue }

      new_wiring[i][j] = undefined
      // new_segments[wire] = null
      temp.push(wireseg.value)
    }
    
    changed  = true
    
    new_wiring[i] = new_wiring[i].filter(function (x) { return x !== undefined })
    if(!new_wiring[i].length) delete new_wiring[i]

    var value = { list: temp, places: places.length ? places : false }
    new_segments[i] = new D.Segment('OPT_constant_list', value, this_segment)
  }
  
  return changed ? new D.Block(new_segments, new_wiring) : block
})



D.SegmentTypes.OPT_constant_list = {
  execute: function(segment, inputs) {
    var val = segment.value.list.slice()        // TODO: fix this when the new datastructure becomes
    var places = segment.value.places
    
    for(var i=0, l=places.length; i < l; i++)
      val[places[i]] = inputs[i]

    return val
    
    // TODO: blend null vals with inputs or have a flag in value to indicate we need to do that
  }
}
