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
  var AB = DAML.string_to_ABlock(string)
  delete AB.id
  
  if(JSON.stringify(AB) == JSON.stringify(result))
    return false
    
  ERRORS.push({in: string, out: AB, expected: result})
}

// TESTS GO HERE!!!!

s2ABt('asdf', {body:['asdf']} )
s2ABt('{asdf}', {body:[ {head:[ {Alias: "asdf"} ]} ]} )
s2ABt('{math add}', {body:[ {head:[ {Handler:"math", Method:"add"} ]} ]} )



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
