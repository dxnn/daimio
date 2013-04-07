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

var app = require('http')
    
var DAML = require('daml')


s2ABt = string_to_ABs_test = function(string, result) {
  var AB = DAML.string_to_ABlock(string)
  if(JSON.stringify(AB) == JSON.stringify(result))
    return false
    
  console.log({in: string, out: AB, expected: result})
}