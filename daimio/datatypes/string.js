D.import_type('string', function(value) {
  if(D.is_block(value))
    return D.block_ref_to_string(value)
  
       if(typeof value == 'string')           value = value
  else if(typeof value == 'number')           value = value + ""
  else if(typeof value == 'boolean')          value = "" // THINK: we should only cast like this on output...
  else if(value && typeof value == 'object')  value = JSON.stringify(value, function(key, value) 
                                                {if(value===null) return ""; return value}) 
                                                // OPT: sucking nulls out here is probably costly
  else if(value && value.toString)            value = value.toString()
  else                                        value = ''
  
  return value
})

