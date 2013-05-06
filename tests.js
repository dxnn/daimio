/*

  This is a set of js tests for ensuring various things about the daml interpreter.
  
  Todo:
  -- write string->ABlock tests
  -- fix head+block ABlocks
  -- fix head segments
  -- fix everything else

  -> build Dialects
  -> link Dialects and Spaces and PBlocks and stuff

  - write string->PBlock tests
  - fix Psegments / pipelines
  - fix function references
  - fix naming conventions
  - fix space / dialect / varset 
  
  - write string->output tests
  - ensure one active process per space
  - fix async behavior
  - fix channels / scoping
  
  - write string -> AB+RL -> PB -> string tests
  
  - do button demo
  
*/


// string->AB tests


// LE PRELUDE

var DAML = require('daml')

ERRORS = []

s2ABt = string_to_tokens_and_segments_and_block_test = function(string, result_tokens, result_segments, result_blocks) {
  var tokens = DAML.Parser.string_to_tokens(string)
    , segments = DAML.Parser.string_to_segments(string)
    , block_ref = DAML.Parser.string_to_block_segment(string)
    , ABlocks = DAML.ABLOCKS
  
  // DAML.recursive_walk(ABlocks, function(item) {return item.id}, function(item) {delete item.id})
  
  // if(JSON.stringify(ABlocks) == JSON.stringify(result))
  //   return false
    
  ERRORS.push({in: string, 
               out: {tokens: tokens, segments: segments, block_ref: block_ref, blocks: ABlocks}, 
               was: {tokens: result_tokens, segments: result_segments, blocks: result_blocks, fff: "x" + DAML.run('{(1 2 3) | math add to 4}')} })
  
  DAML.ABLOCKS = {}
}

head2pipe = function(blockhead, result) {
  // var output = DAML.blockhead_to_pipeline(blockhead, DAML.DIALECTS.top)
  
  if(JSON.stringify(output) == JSON.stringify(result))
    return false
    
  ERRORS.push({in: blockhead, out: output, was: result})
}

funtest = function(string, result) {
  // var space = DAML.SPACES.top
  //   , segment = DAML.Parser.string_to_block_segment(string)
  //   , ABlocks = DAML.ABLOCKS
  //   , block = ABlocks[segment.value.id]
  // 
  // space.execute(block, function(output) {
  DAML.run(string, function(output) {
    if(JSON.stringify(output) == JSON.stringify(result))
      return false

    ERRORS.push({in: string, out: output, was: result})
  })
}


// TESTS GO HERE!!!!
// THINK: these magic block numbers are less than satisfying...

// s2ABt('asdf', 
//   [ {segments: [{type: 'String', value: 'asdf'}], wiring: {} } ])

// s2ABt('{asdf}', 
//   {segments: [{type: 'Alias', value: 'asdf'}], wiring: {} } )
  // [ {body: [ {block: 423294921} ]}
  // , {head: [ {type: "Alias", value: "asdf"} ]} ])

// s2ABt('{(1 2 3) | math add to 4}', 
//   {segments: [{type: 'Alias', value: 'asdf'}], wiring: {} } )
  
// s2ABt('x{asdf}y', 
//   [ {body: [ "x", {block: 423294921}, "y" ]}
//   , {head: [ {type: "Alias", value: "asdf"} ]} ])
// 
// s2ABt('x{asdf}y{foo}z', 
//   [ {body: [ "x", {block: 423294921}, "y", {block: 870984491}, "z" ]}
//   , {head: [ {type: "Alias", value: "asdf"} ]} 
//   , {head: [ {type: "Alias", value: "foo"} ]} ])
//   
// s2ABt('{asdf 2}', 
//   [ {body: [ {block: 3631929967} ]}
//   , {head: [ {type: "Alias", value: "asdf", params: {"__alias__": {type:"Number", value:2}} } ]} ])
//   
// s2ABt('{asdf lala 2}', 
//   [ {body: [ {block: 3966142309} ]}
//   , {head: [ {type: "Alias", value: "asdf", params: {"lala": {type:"Number", value:2}} } ]} ])
//   
// s2ABt('{math add}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])
// 
// s2ABt('{math add value 2}', 
//   [ {body: [ {block: 2720656261} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"}, params: {value: {type:"Number", value:2}} } ]} ])
// 
// s2ABt('{math add value 2 to 5}', 
//   [ {body: [ {block: 2753018361} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"}, params: {value: {type:"Number", value:2}, to: {type:"Number", value:5}} } ]} ])
// 
// s2ABt('{5 | math add}', 
//   [ {body: [ {block: 3471145687} ]}
//   , {head: [ {type: "Number", value: 5, outs: [1]}, 
//              {type: "Command", value: {Handler:"math", Method:"add"}, ins: {"__pipe__": 1}, params: {"__pipe__": null}} ]} ])
// 
// s2ABt('{5 | math add to 2}', 
//   [ {body: [ {block: 1134101991} ]}
//   , {head: [ {type: "Number", value: 5, outs: [1]}, 
//              {type: "Command", value: {Handler:"math", Method:"add"}, 
//               params: {to: {type:"Number", value:2}, "__pipe__": null}, ins: {"__pipe__": 1}} ]} ])
// 
// s2ABt('{(1 2 3)}', 
//   [ {body: [ {block: 684287387} ]}
//   , {head: [ {type:"List", value: [ {type:"Number", value:1}
//                                   , {type:"Number", value:2}
//                                   , {type:"Number", value:3} ]} ]} ])
// 
// s2ABt('{(1 (2 4) 3)}', 
//   [ {body: [ {block: 2143384289} ]}
//   , {head: [ {type:"List",value:[ {type:"Number",value:2}, {type:"Number",value:4} ], "outs":["0-1"]}
//            , {type:"List",value:[ {type:"Number",value:1}
//                                 , {type:"Null",value:""}
//                                 , {type:"Number",value:3} ], "ins":{"1":"0-1"} } ]} ])
//   
// 
// // TODO: all of these are wrong, because they repeat 0-1 as an out. the outs HAVE to be exclusive, because they can be picked up again at any point in the pipeline. [especially if we add dedicated pipeline vars.]  
//   
//   
// s2ABt('{(1 (2 (3 4) (5 6) 7) 8)}', 
//   [ {body: [ {block: 2853555593} ]}
//   , {head: [ {type:"List",value:[ {type:"Number",value:3}, {type:"Number",value:4} ], "outs":["0-1"]} 
//            , {type:"List",value:[ {type:"Number",value:5}, {type:"Number",value:6} ], "outs":["1-2"]}
//            , {type:"List",value:[ {type:"Number",value:2}, {type:"Null",value:""}
//                                 , {type:"Null",value:""},  {type:"Number",value:7} ]
//                                 , "outs":["0-1"], "ins":{"1":"0-1","2":"1-2"}}
//            , {type:"List",value:[ {type:"Number",value:1}, {type:"Null",value:""}
//                                 , {type:"Number",value:8} ], "ins":{"1":"0-1"}} ]} ])
//   
//   
// s2ABt('{(1 {asdf} 3)}', 
//   [ {body: [ {block: 4145493638} ]}
//   , {head: [ {"type":"Alias","value":"asdf","outs":["0-1"]}
//            , {"type":"List","value":[{"type":"Number","value":1}
//                                     ,{"type":"Null","value":""}
//                                     ,{"type":"Number","value":3}],"ins":{"1":"0-1"}} ]} ])
// 
// s2ABt('{(1 (2 {asdf}) 3)}', 
//   [ {body: [ {block: 397202077} ]}
//   , {head: [ {"type":"Alias","value":"asdf","outs":["0-1"]}
//            , {"type":"List","value":[{"type":"Number","value":2}
//                                     ,{"type":"Null","value":""}],"outs":["0-1"],"ins":{"1":"0-1"}}
//            , {"type":"List","value":[{"type":"Number","value":1}
//                                     ,{"type":"Null","value":""}
//                                     ,{"type":"Number","value":3}],"ins":{"1":"0-1"}}]} ])
// 
// s2ABt('{"{x}"}', 
//   [ {body: [ {block: 3914678910} ]}
//   , {head: [ {"type":"Block","value":1209581963} ]} 
//   , {body: [{"block":822001503}],"adjunct":true} 
//   , {head: [{"type":"Alias","value":"x"}], "adjunct":true} ])
// 
// // THINK: should probably strip out the adjuncts at some point... but where?
// 
// s2ABt('{"{x}" | asdf}', 
//   [ {body: [ {block: 448126997} ]}
//   , {head: [ {"type":"Block","value":1209581963,"outs":[1]}
//            , {"type":"Alias","value":"asdf","ins":{"__pipe__":1},"params":{"__pipe__":null}} ]} 
//   , {body: [{"block":822001503}], "adjunct":true} 
//   , {head: [{"type":"Alias","value":"x"}], "adjunct":true} ])
// 
// s2ABt('{asdf {x}}', 
//   [ {body: [ {block: 3525083354} ]}
//   , {head: [ {"type":"Alias","value":"x","outs":[0]}
//            , {"type":"Alias","value":"asdf","params":{"__alias__":null},"ins":{"__alias__":0}} ]} ])
// 
// s2ABt('{begin foo}asdf{end foo}', 
//   [ {body: [ {block: 536339701} ]}
//   , {head: [ {"type":"Block","value":3171660288} ]}
//   , {"body":["asdf"],"adjunct":true} ])
// 
// s2ABt('{begin foo}as{begin baz}qqq{end baz}df{end foo}', 
//   [ {"body":[{"block":1369631471}]}
//   , {"head":[{"type":"Block","value":3811656590}]}
//   , {"body":["as",{"block":1237117008},"df"],"adjunct":true}
//   , {"head":[{"type":"Block","value":3775770175}],"adjunct":true}
//   , {"body":["qqq"],"adjunct":true} ])
// 
// 
// // PBlock tests!
// 
// head2pipe([ { type: "Command"
//             , value: {Handler:"math", Method:"add"} } ],
// 
//           [ { type: "Command"
//             , value: {Handler:"math", Method:"add"} 
//             , method: DAML.models.math.methods.add
//             , paramlist: [null,null] } ])
// 
// 
// head2pipe([ { type: "Command"
//             , value: {Handler:"math", Method:"add"}
//             , params: { value: {type:"Number", value:2}
//                       , to: {type:"Number", value:4} } } ],
//                       
//           [ { type: "Command"
//             , value: {Handler:"math", Method:"add"} 
//             , params: { value: {"type":"Number","value":2}
//                       , to: {"type":"Number","value":4} }
//             , method: DAML.models.math.methods.add
//             , paramlist: [{"type":"Number","value":2},{"type":"Number","value":4}] } ])
//     
//     
// head2pipe([ { type:"Number", value:2, "outs":[0]}
//           , { type: "Alias", value: 'add', "params":{"__pipe__":null}, "ins":{"__pipe__":0} } ],
//           
//           [ {type:"Number", value:2, "outs":[0]}
//           , { type: "Command"
//             , value: {Handler:"math", Method:"add"} 
//             , params: {"value":null,"__pipe__":null}
//             , ins: {"__pipe__":0}
//             , method: DAML.models.math.methods.add
//             , paramlist: [{"type":"Input","value":0},null] } ])
// 
// 
// fun tests!

funtest('{math add value 7 to 13}', "20")

funtest('{math add value (7 13)}', "20")

funtest('{7 | math add to 13}', "20")

funtest('{add 7 to 13}', "20")

funtest('{2 | add 5}', "7")

funtest('{(1 2 3) | math add to 4}', "[5,6,7]")

funtest('{(1 2 3) | add 4}', "[5,6,7]")

funtest('{(1 2 3) | add (3 2 1)}', "[4,4,4]")

funtest('{(1 2 3) | add (3 2 1) | add 7}', "[11,11,11]")

funtest('{(1 2 3) | add (4 4 4) | add 7 | math subtract value (1 2 3)}', "[11,11,11]")

funtest('{add 2 to (3 4 5)}', "[5,6,7]")

funtest('{math add value "7" to "13"}', "20")

funtest('{add 2 to {77 | add 3}}', "82")

funtest('{({77 | add 3} {17 | add 3}) | add}', "100")

funtest('{((1 2) (4 5)) | union}', "[1,2,4,5]")

funtest('{union ((1 2) (4 5))}', "[1,2,4,5]")

funtest('{((1 2) (4 5)) | union (6 7)}', "[[1,2],[4,5],6,7]")

funtest('{(({1} {2 | add 3}) (8 9 (6))) | union}', "[1,5,8,9,[6]]")

funtest('{list map data (1 2 3) block "7"}', "[\"7\",\"7\",\"7\"]")

funtest('{list map data (1 2 3) block "7" | map block "13"}', "[\"13\",\"13\",\"13\"]")

funtest('{logic switch on 2 value (1 :one 2 :two 3 :three)}', "two")

funtest('{list map data (1 2 3) block "{7}"}', "[7,7,7]")

funtest('{(:One {"1 2 3" | string split on " "} :Two)}', "[\"One\",[\"1\",\"2\",\"3\"],\"Two\"]")


funtest('asdf', 'asdf')

funtest('{:asdf}', 'asdf')

funtest('{"asdf"}', 'asdf')

funtest('  asdf {:asdf}  ', '  asdf asdf  ')

funtest('asdf {:asdf} asdf', 'asdf asdf asdf')

funtest('{"{:asdf}"}', 'asdf')

funtest('{"{:asdf}"} ', 'asdf ')

funtest('{"{:asdf}"} bax', 'asdf bax')

funtest('2 {2 | add 2} ', '2 4 ')

funtest('2 {2 | add 2} {2 | times 4}', '2 4 8')

funtest('{(1 {"{2}"} 3)}', "[1,\"{2}\",3]")

funtest('{(1 2 3) | map block "{__ | add 4}"}', '[5,6,7]')

funtest('{(1 2 3 4 5) | map block "{__ | times __}"}', '[1,4,9,16,25]')

funtest('{(1 2 3 4 5) | map block "{times (__ __ __)}"}', '[1,8,27,64,125]')

funtest('{(1 2 3 4 5) | map block "{(__ __ __) | times}"}', '[1,8,27,64,125]')

funtest('{(1 2 3 4 5) | map block "{__ | times __ | times __}"}', '[1,16,81,256,625]')

funtest('{begin block | map data (1 2 3) | string join on ","} asdf {end block}', ' asdf , asdf , asdf ')

funtest('{(1 2 3) | map block "{add __ to 4}"}', '[5,6,7]')

funtest('{map data (1 2 3 4) block "{__ | add 4} is ok"}', '["5 is ok","6 is ok","7 is ok","8 is ok"]')

funtest('{map data (1 2 3 4) block "ok is {__ | add 4}"}', '["ok is 5","ok is 6","ok is 7","ok is 8"]')

funtest('{begin foo | map data (1 2 3 4)}{__ | add 4}{end foo}', '[5,6,7,8]')

funtest('{begin foo | map data (1 2 3 4) | string join on " "}{__ | add 4}{__ | add 4}{end foo}', '55 66 77 88')

funtest('{begin foo | map data (1 2 3 4) | string join on " "}{__ | add 4}x{__ | add 4}{end foo}', '5x5 6x6 7x7 8x8')

funtest('{begin foo | map data (1 2 3 4) | string join on "---"}answer: {__ | add 4}{end foo}', 'answer: 5---answer: 6---answer: 7---answer: 8')

funtest('{begin foo | map data (1 2 3 4) | map block "{__ | string transform from :answer to :foo}" | string join on "---"}answer: {__ | add 4}{end foo}', 'foo: 4---foo: 4---foo: 4---foo: 4')

funtest('{begin foo | map data (1 2 3 4) | map block "{__ | string split on ": " | map block "{if {__ | is like :answer} then :foo else "{__ | add 3}" | run}" | string join on ": "}" | string join on "---"}answer: {__ | add 4}{end foo}', 'foo: 4---foo: 4---foo: 4---foo: 4')

funtest('{begin foo | string split on " " | string join on "---"}Some {a} text{end foo}', 'Some---{a}---text')

funtest('{(1 2 3) | __.#2}', '2')

funtest('{(1 2 3) | > :foo | $foo.#2}', '2')





// funtest('{begin block | merge with @bundle} {one} {end block}')
// 
// funtest('{begin foo | foo}One{"1 2 3" | string split on " "}Two{end foo}')
// 

// THINK: what should these do?
// funtest('2 {"{2}" | add 2} ', 'asdf bax')
// 
// funtest('2 {2 | add "{2}"} ', 'asdf bax')
// 
// funtest('2 {"{2}" | add "{2}"} ', 'asdf bax')
// 
// funtest('2 {{2} | add "{2}"} ', 'asdf bax')





// funtest('{math add value "{7}" to 13}', 20) 
// THINK: what should this do? maybe make add accept only numbers, and use fold/zipwith/etc to add over lists?



// WRAP IT ALL UP WITH A BOW

show_errors = function(error) {
  for(key in error) {
    console.log(key + ': ' + JSON.stringify(error[key], null, 2))
  }
  console.log("")
}

if(ERRORS.length) {
  console.log("ERRORS!\n")
  ERRORS.forEach(show_errors)
}
else {
  console.log('you win!')
}
