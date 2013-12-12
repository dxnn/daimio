Spacial tests and other fun stuff!

  In port to out port
    outer
      @init from-js 
      @out  assert  1
      @init -> @out
    
  Anonymous station
    outer
      @init from-js start
      @out  assert  START
      @init -> {__ | string uppercase} -> @out
    
  Named station
    outer
      @init from-js start
      @out  assert  FOO
      station {"FOO"}
      @init -> station -> @out
    
  Subspace
    inner!!!
      @in
      @out
      @in -> {"FOO"} -> @out
    outer
      @init from-js start
      @out  assert  FOO
      @init -> inner.in
      inner.out -> @out

  Two anon stations
    outer
      @init from-js 123
      @out  assert  42
      @init -> {41} -> {__ | add 1} -> @out

  Two named stations
    outer
      @init from-js 123
      @out  assert  42
      thing-one {41}
      thing-two {__ | add 1}
      @init -> thing-one -> thing-two -> @out

  One of each
    outer
      @init from-js 123
      @out  assert  42
      thing-two {__ | add 1}
      @init -> {41} -> thing-two -> @out

  Two subspaces
    inner1!!!
      @in
      @out
      @in -> {"FOO"} -> @out
    inner2
      @foo in
      @bar out
      @foo -> {__ | string lowercase} -> @bar
    outer
      @init from-js start
      @out  assert  foo
      @init -> inner1.in
      inner1.out -> inner2.foo
      inner2.bar -> @out
    
  Subspace and anon station
    inner!!!
      @in
      @out
      @in -> {__ | times 2} -> @out
    outer
      @init   from-js   20
      @out    assert    42
      @init     -> inner.in
      inner.out -> {__ | add 2} -> @out
  
  Subspace and named station
    inner!!!
      @in
      @out
      @in -> {__ | times 2} -> @out
    outer
      @init   from-js   20
      @out    assert    42
      add2    {__ | add 2}
      @init   -> inner.in
      inner.out -> add2 -> @out
    
  Subspace with named station
    inner!!!
      @in
      @out
      times2 {__ | times 2}
      @in -> times2 -> @out
    outer
      @init   from-js   20
      @out    assert    42
      add2    {__ | add 2}
      @init   -> inner.in
      inner.out -> add2 -> @out
    
  Subsubspace
    inner-inner!!!
      @inin  in
      @outin out
      add2 {__ | add 2}
      @inin -> add2 -> @outin
    inner
      @in
      @out
      times2 {__ | times 2}
      @in -> times2 -> inner-inner.inin
      inner-inner.outin -> @out
    outer
      @init   from-js   20
      @out    assert    42
      @init   -> inner.in
      inner.out -> @out
      
  Subsubspace with like named ports
    inner-inner!!!
      @in
      @out
      add2 {__ | add 2}
      @in -> add2 -> @out
    inner
      @in
      @out
      times2 {__ | times 2}
      @in -> times2 -> inner-inner.in
      inner-inner.out -> @out
    outer
      @init   from-js   20
      @out    assert    42
      @init   -> inner.in
      inner.out -> @out
      
  Four levels deep
    innermost!!!
      @in
      @out
      @in -> {__ | times 2} -> @out
    innerer
      @in
      @out
      @in -> {__ | times 2} -> innermost.in
      innermost.out -> @out
    inner
      @in
      @out
      @in -> {__ | times 2} -> innerer.in
      innerer.out -> @out
    outer
      @init   from-js   1
      @out    assert    8
      @init   -> inner.in
      inner.out -> @out

  Four levels deep with multiple like anonymous stations per level
    innermost!!!
      @in
      @out
      @in -> {__ | times 2} -> @out
    innerer
      @in
      @out
      @in -> {__ | times 2} -> innermost.in
      innermost.out -> {__ | times 2} -> @out
    inner
      @in
      @out
      @in -> {__ | times 2} -> innerer.in
      innerer.out -> {__ | times 2} -> @out
    outer
      @init   from-js   1
      @out    assert    32
      @init   -> inner.in
      inner.out -> @out

  Four levels deep with multiple like named stations per level
    innermost!!!
      @in
      @out
      times2 {__ | times 2}
      @in -> times2 -> @out
    innerer
      @in
      @out
      times2 {__ | times 2}
      times2-2 {__ | times 2}
      @in -> times2 -> innermost.in
      innermost.out -> times2-2 -> @out
    inner
      @in
      @out
      times2 {__ | times 2}
      times2-2 {__ | times 2}
      @in -> times2 -> innerer.in
      innerer.out -> times2-2 -> @out
    outer
      @init   from-js   1
      @out    assert    32
      @init   -> inner.in
      inner.out -> @out

  Two like subspaces in series
    A!!!
      @in
      @out
      @in -> {__ | times 2} -> @out
    B
      @in
      @out
      @in -> {__ | times 2} -> @out
    outer
      @init   from-js   3
      @out    assert    12
      @init   -> A.in
      A.out -> B.in
      B.out -> @out
      
  Station with named out ports
    outer
      @init   from-js   3
      @out    assert    9
      tester
        {__ | times 3 | >@foo | ""}
      @init -> tester
      tester.foo -> @out
      
  Splitter station -> consolidator station
    outer
      $total
      @init   from-js   1
      @out    assert    5
      splitter
        {__}
      consolidator
        {__ | add $total | >$total | less than 5 | else "{$total | >@done}" | run}
      @init -> splitter -> {__ | add 1} -> consolidator
               splitter -> {__ | add 2} -> consolidator
                                           consolidator.done -> @out
      
  Splitter station -> consolidator subspace
  (Note that names are intentionally awful to test for collisions)
    consolidator!!!
      $one 0
      $two 0
      @one in
      @two in
      @out
      consolidator
        {$one | and $two | then "{$one | add $two | >@done}" | run}
      @one -> {__ | >$one} -> consolidator
      @two -> {__ | >$two} -> consolidator
      consolidator.done -> @out
    outer
      @init   from-js   1
      @out    assert    4
      splitter {__}
      @init -> splitter -> {__ | add 1} -> consolidator.one
               splitter -> {__ | add 1} -> consolidator.two
                                           consolidator.out -> @out
  
  Testing PutPort side effectfulness
    catcher!!!
      $count 0
      @in
      @out
      catcher
        {$count | less than 6 | not | then "{123 | >@done}" | run}
      @in -> {__ | add $count | >$count} -> catcher
      catcher.done -> @out
    outer
      @init   from-js   1
      @out    assert    123
      sender 
        {__ | >@out1 | 2  | >@out2 | 3 | >@out3 | ""}
      @init -> sender
      sender.out1 -> catcher.in
      sender.out2 -> catcher.in
      sender.out3 -> catcher.in
      catcher.out -> @out
  
  Same but different
    catcher!!!
      $count 0
      @in
      @out
      catcher
        {$count | less than 6 | not | then "{123 | >@done}" | run}
      @in -> {__ | add $count | >$count} -> catcher
      catcher.done -> @out
    outer
      @init   from-js   1
      @out    assert    123
      sender 
        {__ | >@out | 2  | >@out | 3 | >@out | ""}
      @init -> sender
      sender.out  -> catcher.in
      sender.out  -> catcher.in
      sender.out  -> catcher.in
      catcher.out -> @out
  
  
  Exec ports / virtual spaces
  move this test suite into daimio
  parallel execution like {__ | add $total | wait | $>total} times 2 or 3
  Two same subspaces with different state [?]

  Define subspace after referencing it (BUG)
  Data structure in port creation (BUG)
