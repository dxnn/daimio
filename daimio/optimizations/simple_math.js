D.import_optimizer('simple_math', 0.5, function(block) {
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
     || this_segment.value.handler  != 'math'
     || this_segment.value.method   != 'multiply'       // && binds tighter than ||
     && this_segment.value.method   != 'add' )          
        continue
    
    if(wiring[i].length != 2)                           // THINK: we could still opt in this case...
      continue
    
    var wire = wiring[i][0]
    var wireseg = segments[wire]

    if(!wireseg                                         // && binds tighter than ||
     || wireseg.type != 'Number' )                      // THINK: we could still opt in this case...
        continue

    changed = true
    new_wiring[i] = [wiring[i][1]]

    value = {value: wireseg.value, op: this_segment.value.method}
    new_segments[i] = new D.Segment('OPT_simple_math', value, this_segment)
  }

  return changed ? new D.Block(new_segments, new_wiring) : block
})

D.SegmentTypes.OPT_simple_math = {
  execute: function(segment, inputs) {
    var val  = inputs[0]
    var sval = segment.value.value
    var svop = segment.value.op
    
    if(typeof val == 'number')
      return svop == 'add'
           ? sval + val
           : sval * val

    val = D.Types.anything(val)

    if(svop == 'add')
      return D.Commands.math.methods.add.fun(sval, val)

    return D.Commands.math.methods.multiply.fun(sval, val)
  }
}
