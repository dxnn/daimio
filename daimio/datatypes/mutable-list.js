D.import_type('mutable-list', function(value) {
  if(value && typeof value === 'object') 
    return D.shallow_copy(value.type == 'Block' ? [value] : value)
  return D.shallow_copy(D.to_array(value))
})
