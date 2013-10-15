D.import_type('list', function(value) {
  if(value && typeof value === 'object') 
    return value.type == 'Block' ? [value] : value
  return D.to_array(value)
})

