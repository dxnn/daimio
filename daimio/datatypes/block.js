D.import_type('block', function(value) {
  if(D.is_block(value)) {
    // value is a block ref...
    return function(prior_starter, scope, process) {
      // TODO: check value.value.id first, because it might not be in ABLOCKS
      // TODO: how does this fit with parent processes and parallelization?
      var space = process ? process.space : D.ExecutionSpace
        , station_id = process ? process.station_id : false
      if(process && process.state && process.state.secret) { // FIXME: this seems really quite silly
        scope.parent_process = process
        scope.secret = process.state.secret
      }
      return space.real_execute(D.BLOCKS[value.value.id], scope, prior_starter, station_id)
    }
  }
  else {
    return function() {
      return value
      // return D.stringify(value) // strings just fire away // THINK: why were we stringifying here?
    }
  }
})

