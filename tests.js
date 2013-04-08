/*

  This is a set of js tests for ensuring various things about the daml interpreter.
  
  Todo:
  - write string->ABlock tests
  - fix head+block ABlocks
  - fix head segments
  - fix everything else

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

s2ABt = string_to_ABs_test = function(string, result) {
  var AB = DAML.string_to_ABlocks(string)
  
  DAML.recursive_walk(AB, function(item) {return item.id}, function(item) {delete item.id})
  
  if(JSON.stringify(AB) == JSON.stringify(result))
    return false
    
  ERRORS.push({in: string, out: AB, was: result})
}

// TESTS GO HERE!!!!
// THINK: these magic block numbers are less than satisfying...

s2ABt('asdf', [ {body: ['asdf'] } ])

s2ABt('{asdf}', 
  [ {body: [ {block: 423294921} ]}
  , {head: [ {type: "Alias", value: "asdf"} ]} ])
  
s2ABt('x{asdf}y', 
  [ {body: [ "x", {block: 423294921}, "y" ]}
  , {head: [ {type: "Alias", value: "asdf"} ]} ])

s2ABt('x{asdf}y{foo}z', 
  [ {body: [ "x", {block: 423294921}, "y", {block: 870984491}, "z" ]}
  , {head: [ {type: "Alias", value: "asdf"} ]} 
  , {head: [ {type: "Alias", value: "foo"} ]} ])
  
s2ABt('{asdf 2}', 
  [ {body: [ {block: 3941407930} ]}
  , {head: [ {type: "Alias", value: "asdf", params: {"!": {type:"Number", value:2}} } ]} ])
  
s2ABt('{asdf lala 2}', 
  [ {body: [ {block: 3966142309} ]}
  , {head: [ {type: "Alias", value: "asdf", params: {"lala": {type:"Number", value:2}} } ]} ])
  
s2ABt('{math add}', 
  [ {body: [ {block: 4138245633} ]}
  , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])

s2ABt('{math add value 2}', 
  [ {body: [ {block: 2720656261} ]}
  , {head: [ {type: "Command", value: {Handler:"math", Method:"add"}, params: {value: {type:"Number", value:2}} } ]} ])

s2ABt('{math add value 2 to 5}', 
  [ {body: [ {block: 2753018361} ]}
  , {head: [ {type: "Command", value: {Handler:"math", Method:"add"}, params: {value: {type:"Number", value:2}, to: {type:"Number", value:5}} } ]} ])

s2ABt('{5 | math add}', 
  [ {body: [ {block: 1765860203} ]}
  , {head: [ {type: "Number", value: 5, outs: [1]}, 
             {type: "Command", value: {Handler:"math", Method:"add"}, ins: {"!": 1}, params: {"!": null}} ]} ])

s2ABt('{5 | math add to 2}', 
  [ {body: [ {block: 1633836451} ]}
  , {head: [ {type: "Number", value: 5, outs: [1]}, 
             {type: "Command", value: {Handler:"math", Method:"add"}, 
              params: {to: {type:"Number", value:2}, "!": null}, ins: {"!": 1}} ]} ])

s2ABt('{(1 2 3)}', 
  [ {body: [ {block: 684287387} ]}
  , {head: [ {type:"List", value: [ {type:"Number", value:1}
                                  , {type:"Number", value:2}
                                  , {type:"Number", value:3} ]} ]} ])

s2ABt('{(1 (2 4) 3)}', 
  [ {body: [ {block: 1168461047} ]}
  , {head: [ {type:"List",value:[ {type:"Number",value:2}, {type:"Number",value:4} ], "outs":["0-1"]}
           , {type:"List",value:[ {type:"Number",value:1}, 
                                , {type:"String",value:""}
                                , {type:"Number",value:3} ], "ins":{"1":"0-1"} } ]} ])
  
s2ABt('{(1 {asdf} 3)}', 
  [ {body: [ {block: 4138245633} ]}
  , {head: [  ]} ])

s2ABt('{(1 (2 {asdf}) 3)}', 
  [ {body: [ {block: 4138245633} ]}
  , {head: [  ]} ])

// s2ABt('{"{x}"}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])
// 
// s2ABt('{"{x}" | asdf}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])
// 
// s2ABt('{asdf {x}}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])
// 
// s2ABt('{begin foo}asdf{end foo}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])
// 
// s2ABt('{math add value (1 2 3)}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])
// 
// s2ABt('{math add value {2}}', 
//   [ {body: [ {block: 4138245633} ]}
//   , {head: [ {type: "Command", value: {Handler:"math", Method:"add"} } ]} ])


/*

  {begin foo}asdf{end foo}
  hrmmm...
*/


// WRAP IT ALL UP WITH A BOW

show_errors = function(error) {
  for(key in error) {
    console.log(key + ': ' + JSON.stringify(error[key]))
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
