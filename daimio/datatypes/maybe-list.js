D.import_type('maybe-list', function(value) {
  if(value === false || !D.is_nice(value))
    return false
  else
    return D.Types['list'](value)
})

