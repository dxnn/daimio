/*

  Spacial template testing
  
  Todo:
  - make a template
  - make another
  - turn them into spaces
  
*/


// string->AB tests


// LE PRELUDE

var D = require('daimio')

ERRORS = []

template = function(template) {
  var foo = D.spaceseed_add(template)

  console.log(foo, JSON.stringify(D.SPACESEEDS, null, 2))
}

dialect = function(dialect) {
  return D.dialect_add(dialect)
}

// TESTS GO HERE!!!!

var dialect = dialect({commands: {math: {add: true}}, aliases: {add: "math add value"}})

template({ id: 'quux'
         , dialect: dialect
         , stations: [423294921]
         , spaces: ['foo']
         , ports: [ {space: 'quux', name: 'quux-in', flavour: 'space-in', typehint: 'string'}
                  , {space: 'quux', name: 'quux-out', flavour: 'space-out', typehint: 'string'}
                  , {space: 'quux', station: 1, name: '_in', flavour: 'station', typehint: 'string'}
                  , {space: 'quux', station: 1, name: '_out', flavour: 'station', typehint: 'string'}
                  , {space: 'quux', station: 1, name: '_error', flavour: 'station', typehint: 'string'}
                  , {space: 'foo', name: 'foo-in', flavour: 'space-in', typehint: 'string'}
                  , {space: 'foo', name: 'foo-out', flavour: 'space-out', typehint: 'string'}
                  ]
         , routes: [[1,3], [4,6], [7,2]]
        })

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
