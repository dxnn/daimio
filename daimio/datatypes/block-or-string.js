D.import_type('either:block,string', function(value) {
  if(D.is_block(value)) {
    return D.blockify(value)
  } else {
    return D.stringify(value)
  }
})
