D.SegmentTypes.PipeVar = {
  try_lex: function(string) {
    return string // these are always created as Fancy tokens
  }
// , munge_tokens: function(L, token, R) {
//     return [L.concat(token), R]

    // if(token.value == '__') {
      // return [L.concat(token), R]
      // if(L.length || R.length)

      // __ is the last token in the pipeline
      // token.type = 'Command'
      // token.value = 'variable get name "__in" type :pipeline' // THINK: this is pretty weird
      // return [L, [token].concat(R)]
    // }

    // ceci n'est pas une pipe magique

    /*

      We have to munge this here instead of during Fancyization because we need L and R to distinguish the following cases (which we aren't doing yet but should).

      CASE 1: {(1 2 3) | >_a | (_a _a _a)}
        --> TODO: compile _a into the wiring

      CASE 2: {* (:a 1 :b 2) | merge block "{_a} x {_b}"}
        --> have to use {var get} to collect the values at runtime instead of compiling them into the wiring,
            because this use reflects the shape of the data rather than an arbitrary intermediate label


    ACTUALLY...
      { 111 | *>a | (*a *a *a) }

      { 111 | __pipe }                          | > these both are shortened to __
      { (1 1 1) | each block "{__in}" }         | > but they mean different things

      so what IS a pipeline var?
      --> the above becomes [{N: 111}, {LIST}], {1: [0,0,0]} for segments,wiring
      - what about the "{__}" case?   does [{PLACEHOLDER}], {0: [__in]} make sense? is this crazy?
        or [{scope: __in}] or something? we can wire it from the scope, but... oh, yeah. placeholder. oy.
        this: {* (:a 1 :b 2) | (__) | map block "{_a}"} is actually pretty viable...
      - but how do we keep them from being mutated?
        ... maybe stringify, then compare the var to the cached stringified version each time... still painful, but slightly less allocating? yuck yuck yuck. if we knew *which* commands mutated this wouldn't be an issue -- can we do that? it's only an issue if the command mutates AND the value is piped to multiple places (and if only one mutates you could in theory do that last). maybe we can do that. put a 'mutates' flag on the param...
      - this is going to be REALLY painful...

    */



//    var name = token.value.slice(1)
//
//    token.type = 'Variable'
//    token.value = {type: 'pipeline', name: name}
//    // token.type = 'Command'
//    // token.value = 'variable get name "' + name + '" type :pipeline'
//
//    return [L.concat(token), R]
//    // return [L, [token].concat(R)]
  // }
, token_to_segments: function(token) {
    return [new D.Segment(token.type, token.value, token)]
  }
, munge_segments: function(L, segment, R) {
    var my_key = segment.key
      , new_key = segment.prevkey || '__in'

    // handles cases like "{__}"
    if(  segment.value == '__in'
      || (!R.length && segment.prevkey == '__in')
      || (!R.length && !segment.prevkey))
        { segment.type = 'Variable'
          segment.value = {type: 'pipeline', name: '__in'}
          return [L.concat(segment), R] }

    R.forEach(function(future_segment) {
      var pipe_index = future_segment.names.indexOf('__pipe__')
        , this_key = new_key
        , key_index

      // this is to handle our strangely done aliases           // THINK: really only for those?
      if(    new_key    != '__in'                               // not 'first'
          && pipe_index != -1                                   // is piped
          && my_key     != future_segment.inputs[pipe_index])   // and not piped to this pipevar (?)
        this_key = future_segment.inputs[pipe_index]            // then keep on piping

      while((key_index = future_segment.inputs.indexOf(my_key)) != -1)
        future_segment.inputs[key_index] = this_key

      // handles the weird case of {(1 2 3) | map block "{__ | __}"}
      // and the case of {( 0 1 ) | map block "{__ | then 1 else 0}"}
      if(future_segment.type == 'PipeVar' && future_segment.prevkey == my_key)
        future_segment.prevkey = new_key
    })

    return [L, R]


    // D.replumb(R, new_key, function(future_segment, input) {
    // })


    //   , outputs = R.filter(function(segment) {
    //                         return segment.inputs.indexOf(my_key) != -1
    //                       })
    //
    // if(!segment.prevkey) { // first in our class
    //   // console.log(segment, 'yo!!!')
    //   new_key = '__in'
    // }

    // this is a magic pipe

    /*
      CASES:
        1: {__ | ...}

        2: {2 | __}

        3: {3 | __ | ...}

        4: {__}

        5: {(__)}

        NOPE: 1, 4 and 5 are all the same case -- they access the process input. 2 and 3 are the normal case of passing along the previous segment value.

        NEW RULES!
        2, 3 and 5 always grab the previous segment value
        1 and 4 are process input IF they're in quotes, otherwise psv

    */


    // if(!outputs.length) { // nothing to do
    //   return [L, R]
    // }

    // else {
    //   // get the previous *top* segment's key
    //   for(var i=L.length-1; i >= 0; i--) {
    //     if(L[i].top) {
    //       new_key = L[i].key
    //       break
    //     }
    //   }
    //
    //   if(new_key === segment.value) {
    //     if(L.length) {
    //       new_key = L[L.length-1].key // THINK: first segment doesn't get marked as top, so we grab it here anyway
    //     } else {
    //       new_key = '__in' // nothing prior to __ so we give it __in for Process operating context
    //     }
    //   }
    // }

    // then replace our key with the previous key
//    outputs.forEach(function(future_segment) {
//      var pipe_index = future_segment.names.indexOf('__pipe__')
//        , this_key = new_key
//        , key_index
//
//      if(    new_key    != '__in'    // not 'first'
//          && pipe_index != -1       // is piped
//          && my_key     != future_segment.inputs[pipe_index])  // not piped to pipevar
//      {
//        this_key = future_segment.inputs[pipe_index]            // then keep on piping (mostly for aliases)
//      }
//
//      while((key_index = future_segment.inputs.indexOf(my_key)) != -1) {
//        future_segment.inputs[key_index] = this_key
//        // segment.inputs[key_index] =  new_key
//      }
//
//      // TODO: make this work for multiple connections (can those exist? [yes they can])
//    })

    // OPT: do this in a single pass, dude
  }
, execute: function(segment) {}
}
