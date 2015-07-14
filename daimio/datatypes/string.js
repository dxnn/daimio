D.import_type('string', function(value) {
       if(D.is_block(value))                  value = value.toJSON()
  else if(typeof value == 'string')           value = value
  else if(typeof value == 'number')           value = value + ''
  else if(typeof value == 'boolean')          value = '' // THINK: we should only cast like this on output...
  else if(typeof value == 'object' && value)  value = JSON.stringify(value, function(key, value)
                                                        {return value === null ? '' : value})
                                                        // OPT: sucking nulls out here is probably costly
  else if(value && value.toString)            value = value.toString()
  else                                        value = ''

  return value
})

