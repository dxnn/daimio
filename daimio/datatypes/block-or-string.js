D.import_type('either:block,string', function(value) {
  if(D.is_block(value)) {
    return D.Types['block'](value)
  } else {
    return D.Types['string'](value)
  }
})
