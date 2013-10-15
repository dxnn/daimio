D.import_type('block', function(value) {
  if(D.is_block(value)) {
    // value is a block ref...
    return function(prior_starter, scope, process) {
      // TODO: check value.value.id first, because it might not be in ABLOCKS
      // TODO: how does this fit with parent processes and parallelization? 
      space = process ? process.space : D.ExecutionSpace
      if(process && process.state && process.state.secret) { // FIXME: this seems really quite silly
        scope.parent_process = process
        scope.secret = process.state.secret
      }
      return space.real_execute(D.BLOCKS[value.value.id], scope, prior_starter) 
    }
  }
  else {
    return function() {
      return D.stringify(value) // strings just fire away
    }
    // value = D.stringify(value)
    // return function(prior_starter) {
    //   return prior_starter(value) // strings just fire away
    // }
  }
})

