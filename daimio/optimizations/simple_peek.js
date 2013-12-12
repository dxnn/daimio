// D.import_optimizer('constant_list', 0.5, function(block) {
//   var changed  = false
//   var segments = block.segments
//   var wiring   = block.wiring
//   var new_segments = []
//   var new_wiring   = {}
//   
//   for(var i=0, l=segments.length; i < l; i++) {
//     var temp = []
//     var places = []
//     var this_segment = segments[i]
//     
//     new_segments.push(this_segment)
// 
//     if(!wiring[i]) continue    
// 
//     if(this_segment.type != 'List') {
//       new_wiring[i] = wiring[i]
//       continue
//     }
//     
//     new_wiring[i] = D.clone(wiring[i])                  // only clone if necessary
//     
//     for(var j=0, k=wiring[i].length; j < k; j++) {
//       var wire = wiring[i][j]
//       var wireseg = segments[wire]
//       if(!wireseg                                       // note that && binds tighter than ||
//        || wireseg.type != 'Number'                      // (but don't try this at home, kids)
//        && wireseg.type != 'String' ) {
//           temp.push(null)
//           places.push(j)
//           continue }
// 
//       new_wiring[i][j] = undefined
//       new_segments[wire] = null
//       temp.push(wireseg.value)
//     }
//     
//     changed  = true
//     new_wiring[i] = new_wiring[i].filter(function (x) { return x !== undefined })
//     var value = { list: temp, places: places.length ? places : false }
//     new_segments[i] = new D.Segment(value, 'OPT_constant_list', this_segment)
//   }
//   
//   return changed ? new D.Block(segments, wiring) : block
// })
// 
// 
// 
// D.SegmentTypes.OPT_simple_peek = {
//   execute: function(segment, inputs) {
//     var val = D.clone(segment.value)   // erk really?
//     
//     return val
//   }
// }
