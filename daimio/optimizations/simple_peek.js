D.import_optimizer('simple_peek', 0.4, function(block) {
  if(!D.Etc.OPT_simple_peek)                            // oh hai have some fun
    D.Etc.OPT_simple_peek =
      { pos : D.Pathfinders.filter(function(pf) {return pf.name == "position"})[0].gather
      , key : D.Pathfinders.filter(function(pf) {return pf.name == "key"})[0].gather }

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
    new_wiring[i] = wiring[i]

    if( this_segment.type != 'Command'
     || this_segment.value.handler  != 'list'
     || this_segment.value.method   != 'peek'
     || this_segment.value.names[1] != 'path' )         // THINK: we could still opt in this case...
        continue

    var pathwire = wiring[i][1]
    var listseg = segments[pathwire]

    if( !wiring[pathwire]                               // only one item
     ||  wiring[pathwire].length != 1 )
         continue

    var wire = wiring[pathwire][0]
    var wireseg = segments[wire]

    if(!wireseg                                         // && binds tighter than ||
     || wireseg.value == '*'
     || wireseg.type  != 'Number'
     && wireseg.type  != 'String' )
        continue

    changed = true
    delete new_wiring[pathwire]
    new_wiring[i] = [wiring[i][0]]

    new_segments[i] = new D.Segment('OPT_simple_peek', wireseg.value, this_segment)
  }

  return changed ? new D.Block(new_segments, new_wiring) : block
})

D.SegmentTypes.OPT_simple_peek = {
  execute: function(segment, inputs) {
    var key  = segment.value
    var data = inputs[0]

    if(key[0] == '#') {
      var position = +key.slice(1)
      if(Array.isArray(data))
        if(position < 0)
          return data[data.length + position]
        else
          return data[position - 1]

      return D.Etc.OPT_simple_peek.pos(inputs[0], segment.value)[0]
    }

    return D.Etc.OPT_simple_peek.key(inputs[0], segment.value)[0]
  }
}
