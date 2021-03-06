D.SegmentTypes.PortSend = {
  // THINK: surely there's some other way to do this -- please destroy this segtype
  try_lex: function(string) {
    return string // this is never lexed
  }
, munge_tokens: function(L, token, R) {
    if(L.length)
      token.inputs = [L[L.length-1].key]
    return [L.concat(token), R]
  }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, execute: function(segment, inputs, dialect, prior_starter, process) {
    var to  = segment.value.to
    var my_station = process.station_id
    var port = D.filter_ports(process.space.ports, my_station, to)

    // TODO: check not only this station but outer stations as well, so we can send to ports from within inner blocks. but first think about how this affects safety and whatnot

    if(port) {
      if(my_station === undefined) { // HACK
        port.enter(inputs[0], process) // weird hack for exec spaces
      } else {
        port.exit(inputs[0], process)
      }
    }
    else {
      D.set_error('Invalid port "' + to + '" detected')
    }

    return inputs[0]
  }
}
