
D.import_type('anything', function(value) {
  if(!D.is_nice(value)) return ""
  return value // THINK: what about blocks? 
})

