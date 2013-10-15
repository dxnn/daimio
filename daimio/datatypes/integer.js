D.import_type('integer', function(value) {
  value = D.Types['number'](value) // TODO: make a simpler way to call these
  
  return Math.round(value)
})

