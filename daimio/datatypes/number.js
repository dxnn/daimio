D.import_type('number', function(value) {
  if(typeof value == 'number') value = value
  else if(typeof value == 'string') value = +value
  // else if(typeof value == 'object') value = Object.keys(value).length // THINK: this is a little weird
  else value = 0

  return value
})

