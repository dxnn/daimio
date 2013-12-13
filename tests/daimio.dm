<div class="page-header" id="welcome">
  <h2>Preface</h2>
</div>

    This document serves as a primer, tutorial, specification, test suite and REPL for the Daimio language.

    Daimio is a framework for building programmable web applications, as well as the dataflow language used within that framework.

    On this page all Daimio statements are wrapped in braces. Any line which begins with an open brace will be processed as a Daimio statement, and the following line indicates the desired outcome. Green means it passed, red indicates failure. Output is converted to JSON for display in the REPL and the examples below.


<div class="page-header" id="pronunciation">
  <h2>Pronunciation guide</h2>
</div>

<h4>Daimio introduces as little syntax as possible, but there's a few symbols you may not be familiar with. Here's how you read them.</h4>

  <strong>&gt;</strong> reads 'put', because it looks like a sideways highway

  <strong>@</strong> reads 'port', because it looks like a wormhole

  <strong>_</strong> reads 'read', as in read-only

  <strong>$</strong> reads 'space variable', or 'spacevar'

<h4>Combo elements:</h4>

  <strong>&gt;@</strong> reads 'put port'

  <strong>&gt;$</strong> reads 'put spacevar'

  <strong>__</strong> reads 'read last'

<h5>We'll look at each of those in more detail later, but now you know how to say it!</h5>


<div class="page-header" id="id_daimio_primer">
  <h2>Daimio Primer</h2>
</div>
  Some basics
    numbers, natural and otherwise
      {65535}
        65535
      {4.669200}
        4.6692
      {-3.14159}
        -3.14159

    strings are double quoted for protection
      {"Help I'm trapped in a string factory"}
        Help I'm trapped in a string factory

    or colonized if they're small
      {:Liechtenstein}
        Liechtenstein

    lists use parens and whitespace
      {( 2 3 5 )}
        [2,3,5]
      {(:one 1 :two 2)}
        ["one",1,"two",2]

    sometimes lists sneak inside other lists
      {( (2 3 5 7) (4 6 8 9) )}
        [[2,3,5,7],[4,6,8,9]]
      {( () (()) (() (())) )}
        [[],[[]],[[],[[]]]]

    list can also be keyed
      {* (:a 1 :b 2)}
        {"a":1,"b":2}

    and heterogenous
      {* (:a {* (:aa 1 :ab 2)} :b 2 )}
        {"a":{"aa":1,"ab":2},"b":2}


  Commands
    commands have a handler and a method
      {list count}
        0

    and named parameters
      {list count data (13 17 19)}
        3

    parameter order is irrelevant
      {math add value 22 to 20}
        42
      {math add to 20 value 22}
        42

    pipes link commands
      {(13 17 19) | list count}
        3
      {22 | math add to 20}
        42

    aliases reduce typing
      {(13 17 19) | count}
        3
      {22 | add 20}
        42

    double underscore reads the last value
      {21 | add __}
        42
      {21 | add 21 to __}
        42
      {21 | add __ to 21}
        42
      {21 | add __ to __}
        42


  Comments
    slash comments one segment
      {/string join}

      {401 /comment | add 1}
        402

    double slash comments all remaining segments
      {401 //comment | add 1}
        401
      {// 401 | add 1}


  Blocks
    blocks are delimited by begin/end, and contain strings
      {begin foo}some string{end foo}
        some string

    or code
      {begin bar}{21 | add 21}{end bar}
        42

    or both
      {begin block} {:hello} world {end block}
        hello world

    double quotes create inline blocks
      {"{:hello} world"}
        hello world

    blocks are lambdas
      {"{__ | add 1}" | map data ( 1 2 3 )}
        [2,3,4]
      {begin block | map data ( 1 2 3 )}{__ | add 1}{end block}
        [2,3,4]

    __in reads the process input
      {( 1 2 3 ) | map block "{__in | add 1}"}
        [2,3,4]

    __ reads the last value, which is the process input here
      {( 1 2 3 ) | map block "{__ | add 1}"}
        [2,3,4]

    further inside a pipeline __ reads the previous pipeline segment
      {( 1 2 3 ) | map block "{__ | add 5 | (__ __in)}"}
        [[6,1],[7,2],[8,3]]


  More pipes
    a piped value fills the first available parameter
      {math add value 10 to 32}
        42
      {10 | math add to 32}    {// here it fills 'value'}
        42
      {32 | math add value 10} {// here it fills 'to'}
        42

    a double pipe prevents implicit param filling
      {32 || math add value 10}   {// 'to' is unfilled}
        10
      {32 || math add value 10 to __}
        42


  Labels
    pipe values can be labeled for later use
      {8 | >eight | (_eight _eight 2) | add _eight | add}
        42

    but pipeline vars only work within the same block
      {_eight}

    and can't be modified
      {2 | >two | 4 | >two | (_two)}
        [2]

  Variables
    space variables are mutable
      {2 | >$foo | ( 1 2 3 ) | >$foo}
        [1,2,3]

    and available across all blocks in the same space
      {$foo | add $foo}
        [2,4,6]


  Lists
    you can peek into data structures
      {* (:a 1 :b 2 :c 3) | list peek path :b}
        2
      {(2 4 6) | peek "#1"}
        2
      {* (:a (1 2) :b (2 3) :c (3 4)) | peek (:b "#1")}
        2

    dots are peek sugar
      {(1 2 3) | __.#2}
        2
      {* (:a (1 2) :b (2 3) :c (3 4)) | __.b.#1}
        2

    poke to push
      {(1 2 3) | list poke value 4}
        [1,2,3,4]

    or otherwise modify
      {* (:a 1 :b 2 :c 3) | poke 4 path :d}
        {"a":1,"b":2,"c":3,"d":4}

    dots are poke sugar too
      {5 | >$foo.#2}
        [1,5,3]


  And that's everything there is to know about Daimio. Well, almost. Let's explore a couple ideas in greater depth.


<div class="page-header" id="id_commands">
  <h2>In Depth: Commands</h2>
</div>

    Commands in Daimio provide all of the functionality in the language -- everything else is just for wiring commands together. In particular, control statements (like 'if' and 'cond') and looping constructs (like 'each' and 'map') are commands rather than built-in primitives.

    There's a few disadvantages to this approach in a traditional language, like awkward syntax for if-then-else (which becomes a function that takes a boolean expression and two callbacks). But we find that in a dataflow language like Daimio the convention is quite natural, and any semantic clumsiness is outweighed by the advantages:
    - no distinction between built-ins and application functionality means you can easily create new low-level control constructs.
    - "everything is a command" reduces conceptual weight: all commands return a value, all commands take named parameters, parameter evaluation timing is consistent, and so on.
    - facilities that affect commands (like aliases) can be used on anything in the system -- no special cases.

    We saw in the primer that commands have a handler, a method and named parameters, and that parameter order is irrelevant.
      {list range length 3 start 1 step 2}
        [1,3,5]
      {list range step 2 length 3 start 1}
        [1,3,5]

    We also saw that you can pipe a value in to the command, and it will fill the "first available" empty parameter slot.
      {3 | list range}
        [1,2,3]

    What does "first available" mean if parameter order is irrelevant? It means the order the parameters are given in the command definition, which also happens to mirror the order in the REPL's autocompletion dialog.
      {2 | list range length 3}
        [2,3,4]

    In the case of {list range}, the order is 'length', 'start', 'step'.
      {3 | list range start 2}
        [2,3,4]
      {3 | list range start 2 length 3}
        [2,5,8]

    Most commands only have one parameter that would generally take a pipe value. In those cases we can use an alias that is preconfigured with that parameter name.
      {3 | range}
        [1,2,3]
      {range 3}
        [1,2,3]

    The above works because the alias 'range' is replaced with 'list range length'. Aliases work by simple substitution: if the first word of a command matches something in the alias list, it is replaced.

    What if we don't supply a value for the trailing parameter name, like 'length'?
      {range}
        []

    No error -- interesting. 'add' is an alias for 'math add value'.
      {2 | add 3}
        5
      {add 2 to 3}
        5

    So what about these?
      {5 | add}
        5
      {add to 5}
        5
      {range start 3}
        []
      {3 | range start 3}
        [3,4,5]

    Ah. So it looks like the trailing param value is negated if the word after the alias is a parameter name instead of a param value. (Param names are always bare words, param values never are.) It then becomes filled in through the pipe via the natural piping process. Interesting.

    We just learned that param values are never bare words. What kinds of things can be param values?
    - numbers: 1, 0.45
    - strings: "foo" :foo
    - lists: ((1 2) (3 4))
    - pipelines: {:foo}
    - variables: _xyz $abc

    There are two things that can be pipeline segments but can't be parameter values:
    - bare commands, e.g. 'math add' doesn't work -- put it in a pipeline
    - 'put' expressions: >x >$y >@z

<!--
(:barbera :belvest :brioni)
["selvedge","balmoral","aglet","placket","plimsolls"]
-->


<div class="page-header" id="id_lists">
  <h2>In Depth: Lists</h2>
</div>

  Lists are the basic data structure of Daimio. Spaces separate items. List items can be any valid expression.
    Notice that data structures are implicitly converted to JSON when forced to take string form.

    A list of random numbers:
      {(8 6 7 5 3 0 9)}
        [8,6,7,5,3,0,9]

    A list of pleonasms:
      {("free gift" "true fact" "revert back" "hot water heater" "tired cliche")}
        ["free gift","true fact","revert back","hot water heater","tired cliche"]

    Numbers and strings:
      {(1 "a sandbox" 2 "a sandbox")}
        [1,"a sandbox",2,"a sandbox"]

    A list of lists:
      {((1 2 3) (:once :twice :thrice) (:primary :secondary :tertiary))}
        [[1,2,3],["once","twice","thrice"],["primary","secondary","tertiary"]]

    The first three ordinals:
      {( () (()) (() (())) )}
        [[],[[]],[[],[[]]]]

  Keyed lists

    A keyed list (aka hash, map, hash map, dictionary, associative array, key-value store, etc etc etc) is a function that takes keys and returns values. Every list in Daimio can take keys. There's a special command for transforming an unkeyed list into a new keyed list called 'list pair'.

    Here is the command written out:
      {list pair data (:one :first :two :second)}
        {"one":"first","two":"second"}

    And in its much more common aliased form:
      {* (:one :first :two :second)}
        {"one":"first","two":"second"}

  As you can see, the * operator (which is really just an alias for a command) uses the first value in the list as a key, the second as its value, the third as the second key, the fourth as its value, and so on. While this seems a bit messy on a single line, with proper whitespacing it's very easy to read.

    Lists -- including keyed lists -- are always sorted, so we can use the #N notation on them:
      {* (:one :first :two :second) | >$x || $x.#2}
        second

    [Integer keys in maps can mess up the sorting in the JS implementation]

    a list of hashes:
      {( {* (:one 1 :two 2)}  {* (:three 3 :four 4)} )}
        [{"one":1,"two":2},{"three":3,"four":4}]

    a nested hash:
      {* (:A {* (:one 1 :two 2)} :B {* (:three 3 :four 4)})}
        {"A":{"one":1,"two":2},"B":{"three":3,"four":4}}

  ---- talk about what can go in a list

    A list can have commands in it
      {({string split value "shantung weft repp slub" on " "} 1 2 4 8)}
        [["shantung","weft","repp","slub"],1,2,4,8]


<div class="page-header" id="id_pipes">
  <h2>In Depth: Pipes</h2>
</div>

  You can use the pipe (<code>|</code>) to pass the output of one command into an input of another.

    Split, then join:
      {string split value "shantung weft repp slub" on " " | string join on ", "}
        shantung, weft, repp, slub

    Split, filter, join:
      {string split value "shantung weft repp slub" on " " | string grep on :s | string join on ", "}
        shantung, slub


  In some ways the pipe is syntactic sugar for <strong>commands as parameter values</strong>, though the two differ slightly in implementation. The following commands are essentially equivalent to the above pipelines.

    Split, then join:
      {string join on ", " value {string split value "shantung weft repp slub" on " "}}
        shantung, weft, repp, slub

    Split, filter, join:
      {string join on ", " value {string grep on :s value {string split value "shantung weft repp slub" on " "}}}
        shantung, slub

  Pipelines can make complicated Daimio statements much easier to read, and lend themselves to dataflow-style programming. They're generally preferred over embedded commands.

    You can also pipe parameters, which sometimes improves readability:
      {(:bebop :hardbop :cool :swing) | string join on ", "}
        bebop, hardbop, cool, swing

    A single pipe at the end of a command passes the value through:
      {:mypipes|}
        mypipes

    A double pipe in a command squelches the pipe value:
      {:doublepipes ||}


    Which is equivalent to:
      {:asdf | ""}


    Squelching is useful sometimes, when you want to continue a pipeline without passing the previous value:
      {:asdf | string join value (:one :two)}
        oneasdftwo
      {:asdf || string join value (:one :two)}
        onetwo

    Though you could also do that like this:
      {:asdf ||}{string join value (:one :two)}
        onetwo

      the <code>__</code> is pronounced "magic," because "double underscore" is a mouthful.
      the add command is powerful.
        {21 | (__ __) | add}
          42
        {20 | (__ __) | add 1 | add}
          42
        {10 | (__ __) | add __ | add 1 | add}
          42

  Magic Pipe Tests

    The magic pipe has two uses: to explicitly connect two segments, and to access the Process's input value

    Case 1: explicit connection. Each of these also has an implicit connection, but only the first example uses it because the others have no additional param space (add only takes two params).
      {21 | add __}
        42
      {21 | add 21 to __}
        42
      {21 | add __ to 21}
        42
      {21 | add __ to __}
        42

    Case 1a: blocking implicit connection. The double pipe doesn't pass values implicitly, but you can still use the magic pipe to explicitly link them. Useful for commands that have multiple parameters.
      {42 || add __}
        42
      {21 || add 21 to __}
        42

    Case 1b: carry along. You can use a pipe to carry the value through segments.
      {42 | __}
        42
      {42 | __ | __}
        42

    Case 1c: duplication. You can use pipes in lists to duplicate the previous value
      {42 | (__)}
        [42]
      {42 | (__ __)}
        [42,42]
      {42 | (:x __ __)}
        ["x",42,42]
      {42 | (__ :x __)}
        [42,"x",42]
      {42 | (__ __ :x)}
        [42,42,"x"]

      {21 | add (__)}
        [42]
      {21 | add (__ __)}
        [42,42]
      {21 | add (-1 __ __)}
        [20,42,42]
      {21 | add (__ -1 __)}
        [42,20,42]
      {21 | add (__ __ -1)}
        [42,42,20]

  Case 2: process input
    -- "{__}" links to process input
    --  {__}  links to previous value
    so: if it's in a string, it's input.
        if it's in a list or param value it's previous value.

      {(1 2 3) | map block "{__ | add 4}"}
        [5,6,7]
      {(1 2 3) | map block "{add __ to 4}"}
        [5,6,7]
      {(1 2 3) | map block "{add __ to __}"}
        [2,4,6]
      {(1 2 3) | map block "{__}"}
        [1,2,3]
      {(1 2 3) | map block "{__ | __}"}
        [1,2,3]
      {(1 2 3) | map block "{__ | __ | add 1}"}
        [2,3,4]
      {(1 2 3) | map block "{__ | add 1 | __ | add 1}"}
        [3,4,5]

    Case 2a: block-level access. Multiple pipelines in a block can each access the process input.
      {begin foo | each data (1 2 3)} {__ | add 3} x {__ | add 7} ::{end foo}
        4 x 8 :: 5 x 9 :: 6 x 10 ::
      {begin foo | each data (1 2 3)} {add 3 to __} x {add __ to 7} ::{end foo}
        4 x 8 :: 5 x 9 :: 6 x 10 ::

    You can reframe the above like this:
      {(1 2 3) | each block "{__ | (" " {__in | add 3} " x " {__in | add 7} " ::") | join}"}
        4 x 8 :: 5 x 9 :: 6 x 10 ::

    Notes:
    To connect to the process input you must explicitly add the magic pipe to the first segment.
      {(1 2 3) | map block "{__ | add to 4}"}
        [5,6,7]
      {(1 2 3) | map block "{add to 4}" // bad}
        [4,4,4]
      {(1 2 3) | map block "{__ | add 4}"}
        [5,6,7]
      {(1 2 3) | map block "{add 4}" // bad}
        [4,4,4]


      {20 | add {__ | add 2}}
        42
      {20 | add {__ | add 2} to __}
        42

      {21 | join (__ " " __) on ""}
        21 21
      {21 | ( {__ | add 1} " " {__ | add 2} ) | join}
        22 23
      {21 | ( {add 1 to __} " " {add __ to 2} ) | join}
        22 23
      {21 | >a | ( {_a | add 1} " " {_a | add 2} ) | join}
        22 23

      {40 | add {__} to 2}
        42
      {21 | add {__} to __}
        42
      {21 | add __ to {__}}
        42
      {21 | add {__} to {__}}
        42
      {20 | ( {__} 2 __ ) | add}
        42
      {20 | ( __ 2 {__} ) | add}
        42
      {20 | ( {__} 2 {__} ) | add}
        42

    Double pipes are also used to squelch output from a pipeline:
      {42 ||}

      {(1 2 3) | map block "{__ | add 1 ||}"}
        ["","",""]


<div class="page-header" id="id_variables">
  <h2>In Depth: Variables</h2>
</div>

    &gt; implies movement -- putting data somewhere always implies shuffling a copy to somewhere else.

    references (in-pipeline mutation, copy-on-write, $foo and _foo (copy-on-read)

    ----- talk about pipeline vars, injected vars, imported vars, and then space vars

    (so pipelines are actually DAGs)
    (those labels are only valid inside the block)
    (and can only be set once)

    Set a space var like this:
      {(:one :two :three) | >$bar}
        ["one","two","three"]
      {* (:one 1 :two 2 :three 3) | >$foo}
        {"one":1,"two":2,"three":3}

    Reference like so:
      {$bar}
        ["one","two","three"]

    Reach inside:
      {$foo.one}
        1
      {$foo | list peek path :one}
        1

    Use an octothorp to find the Nth value in a list:
      {$bar.#2}
        two
      {$bar | list peek path "#2"}
        two

    Negative indices are also supported:
      {$bar.#-1}
        three
      {$bar | list peek path "#-1"}
        three

    Works on keyed lists also:
      {$foo.#2}
        2

  We'll see some more ways to reach into variables in a bit.

<div class="page-header" id="id_blocks">
  <h2>In Depth: Blocks</h2>
</div>

    A block encloses text. [Could be a template, or some Daimio code (or a mix). they're roughly equivalent to a string join + context + var. discuss var scope]

    Note that blocks no longer set variables automatically. We may include a {begin $foo}...{end $foo} form in the future to allow automatic var setting, but scope vars should be used carefully so forcing explicit setting is probably good. (We could also consider automatically setting a pipeline var, but for now explicit and simple is better.)


    or a string [inlined for the test harness]
    [if you put in linebreaks, the output has them also, and then things get weird]
    {begin foo}some long multiline string{end foo}
      some long multiline string

    which is about the same as
      {( {:hello} " world" ) | join}
        hello world

    (except with some extra delayed-execution magic)


    Here's a simple block:
      {begin foo}Some text{end foo}
        Some text

    That just returns whatever we put in -- not particularly useful. What if we pipe it into a command?
      {begin foo | string split on " "}Some text{end foo}
        ["Some","text"]

    The block can also be stored as a variable:
      {begin foo | >$foo ||}Some text{end foo}{$foo}
        Some text
      {begin foo | >$foo | $foo}Some text{end foo}
        Some text

    We squelch the output of blocks that don't pipe the 'begin' statement as a convenience. Usually unpiped blocks are built as templates for later use.

    Using a block we've previously built:
      {$foo | string split on " "}
        ["Some","text"]

    Blocks can also contain Daimio:
      {begin foo | >$foo}x{_value}-{end foo}
        x-

    The each command invokes a Daimio string for every element of a list. These are all equivalent -- the compiler removes the extraneous braces.
      {each block "x{__}-" data (1 2 3)}
        x1-x2-x3-
      {each block {"x{__}-"} data (1 2 3)}
        x1-x2-x3-
      {each block {{"x{__}-"}} data (1 2 3)}
        x1-x2-x3-

    This one works differently, because the inner block isn't processed by 'each' and gets escaped into a string on output.
      {each block {"{"x{__}-"}"} data (1 2 3)}
        x{__}-x{__}-x{__}-

    The inner block retains its blockiness though:
      { "{ "x{__}y" }" | map data 1 | __.#1 | map data 42}
        ["x42y"]

    These works like you would expect -- each iteration returns a list, which is JSONified internally.
      {each block "{(:x {string join value {__}} "-")}" data (1 2 3)}
        ["x","1","-"]["x","2","-"]["x","3","-"]
      {each block {"{(:x {__ | join} "-")}"} data (1 2 3)}
        ["x","1","-"]["x","2","-"]["x","3","-"]

    These show the strange, sad results of trying to coerce a list into a template.
      {:hey | >$value}
        hey
      {each block (:x $value {$value} "{$value}" {"{$value}"}) data (1 2)}
        ["x","hey","hey","{$value}","{$value}"]["x","hey","hey","{$value}","{$value}"]
      {each block (:x {string join value {$value}}) data (1 2 3)}
        ["x","hey"]["x","hey"]["x","hey"]
      {each block {(:x $value "-")} data (1 2 3)}
        ["x","hey","-"]["x","hey","-"]["x","hey","-"]
      {:hey | >$value}
        hey

    Pipeline variables, including magic pipes, are reduced prior to templatization.
    --> don't use lists as templates!

//      {each block (1 __) data (7 8)}
//        ["x","hey","hey","hey","hey"]["x","hey","hey","hey","hey"]["x","hey","hey","hey","hey"]
//      {each block (:x {string join value {__}}) data (1 2 3)}
//        ["x","hey"]["x","hey"]["x","hey"]
//      {each block {(:x __ "-")} data (1 2 3)}
//        ["x","hey","-"]["x","hey","-"]["x","hey","-"]

      {({:8} {8})}
        ["8",8]

    [TODO: upgrade the test suite to allow blocks to spread over lines.]

    These two things are almost equivalent:
      {begin foo}One{"1 2 3" | string split on " "}Two{end foo}
        One["1","2","3"]Two

      {string join value (:One {"1 2 3" | string split on " "} :Two)}
        One["1","2","3"]Two

    Quick 2: Embedded blocks

    I put a block in a block for you:
      {begin outer}qq {begin inner | add 321}123{end inner} pp {end outer}
        qq 444 pp

    (Blocks with the same name can't be nested. That would just be weird.)

    Quotes in braces

    If the nested quotes are in braces, you don't need to use a block:
      {string split on " " value {("inside" "here") | string join on " "}}
        ["inside","here"]

    Sometimes nesting quotes in braces and braces in quotes works well:
      {join {string split on " " value {"{("Much" "nesting") | string join on " "} is divinest sense" | run}} on " "}
        Much nesting is divinest sense

    But of course this is prettier
      {"{("Much" "nesting") | string join on " "} is divinest sense" | run | split on " " | join on " "}
        Much nesting is divinest sense


<div class="page-header" id="id_scope">
    <h2>In Depth: Scope</h2>
</div>

    so.... blocks don't have a private scope. there's currently pipeline vars and space vars. pipeline vars are single-assignment and can bleed through blocks (but not into called subblocks).

    space vars are mutable and persistent. they model state within the space. you should only use them when necessary, and maybe not even then.

    TODO: fix this section!

//    A pipeline variable created in a block goes away when that block ends:
//      {begin block ||}{123 | >$foo}{end block}{foo}
//        123
//
//    Variables beginning with '@' are global:
//      {begin block}{123 | >$foo}{end block}{$foo}
//        123
//
//    Blocks create a new variable:
//      {begin block}Hey there{end block}{$block}
//        Hey there
//
//    Nested blocks are only accessible inside their parent block:
//      {begin outer}{begin inner}123{end inner}{end outer}{$inner}
//
//
//    Use a global if you need access to it later:
//      {begin outer}{begin inner | >$inner}123{end inner}{end outer}{$inner}
//        123
//
//    Variables created in the outermost scope (outside of any blocks) can be accessed anywhere:
//      {123 | >$x ||}{begin foo}{$x}{end foo}{$x}
//      123
//
//    But they aren't actually globals:
//      {123 | >$x ||}{begin foo |}{456 | >$x ||}{$x}{end foo}{$x}
//      456123
//
//  See what happened there? We overwrote the variable in the inner scope, but when the block ended that scope vanished, leaving behind the original variable value.
//
//    Contrast that with a global:
//      {123 | >$x ||}{begin foo |}{456 | >$x ||}{$x}{end foo}{$x}
//      456456
//
//  Changing a global changes it everywhere, regardless of scope.
//
//  Note: you may have heard tell of evil, unhygienic globals afflicting general purpose programming languages. Fortunately, Daimio isn't general purpose. In Daimio globals are cute and cuddly and always floss.
//
//    Blocks establish a new variable scope:
//      {"asdf" | >$x}{begin foo}{123 | >$x || $x}{end foo}{$x}
//
//    But variables starting with '@' are global:
//      {"asdf" | >$@x}{begin foo}{123 | >$@x || @x}{end foo}{@x}


<div class="page-header" id="id_peek">
    <h2>In Depth: Peek</h2>
</div>

    This is a section all about how my list searching got flipped turned upside down. It includes the majority of the peek tests.

    {* (:one :one :two :two :three :three) | >$numbers ||}

    {* (:one :hashly :two :bashly :three :crashly) | >$hash ||}

    {* (:one :local :two "surprise local!" :foo :bar :bar :hello :hash $hash) | >$locals ||}

    {( {* (:one :first :two "surprise array!" :locals $locals)} {* (:one :second :two "surprise number also!" :locals $locals)} {* (:one :third :two "surprise me too!" :locals $locals)} ) | >$data ||}


    {$hash.one}
      hashly

    // replacement with command parsing
    {$data.{"1"}.one}
      second

    {$data.{1}.{$numbers.one}}
      second

    // careful with numerical tests!
    {$data.1.one}
      second

    {$data.#1.one}
      first

    {$data.#-1.one}
      third

    {$data.#12.one}

    {$data.#-33.one}

    // check iteration
    {$data.*.one}
      ["first","second","third"]

    {$data.*.locals.hash.one}
      ["hashly","hashly","hashly"]

    {$data.*.locals.foo}
      ["bar","bar","bar"]

    {$data | eq $data.* | then :true else :false}
      true
    {$data.one | eq $data.*.one | then :true else :false}
      false

    NOTE ON STARS
      $data and $data.* return exactly the same result, but $data.one and $data.*.one return different results. Why is that?
      The * pathfind operator lifts the 'guts' of a list up one level, and exposes those items to future pathfinders. So while $data.one finds nothing -- because $data has no key of 'one' -- $data.*.one finds three things, because each item in $data has a key of 'one'.
      If however you merely return those lifted results without further operation then this is equivalent to simply removing the keys from the list -- and in $data's case it has no keys, so the two are equal.

      {(1 2) | __.*}
        [1,2]
      {* (:a 1 :b 2) | __.*}
        [1,2]

    // check stars
    {$data | list count}
      3

    {$data.* | list count}
      3

    {$data.*.* | list count}
      9

    {$data.*.*.* | list count}
      15

    {$data.*.*.*.* | list count}
      9

    {$data.one}

    {$data.*.one}
      ["first","second","third"]

    {$data.*.*.one}
      ["local","local","local"]

    {$data.*.*.*.one}
      ["hashly","hashly","hashly"]

    {$data.*.*.*.*.one}
      []


  MORE NOTES ON STARS
    Since * exposes its inputs internals to the next operator, you can think of it as a map over the list with the rest of the operators as the block for that map, or the identity block if there are no further operators. This occasionally leads to counterintuitive results like the following, and generally means that * and #N don't play nicely together.

    Note that the positional pathfinder #N coerces scalar items into a singleton list, so #1 will continue returning a valid value. This differs from '0' -- the key-based pathfinder -- for unkeyed lists, as 0 does no coercion.
      {(1 2 3) | __.0}
        1
      {(1 2 3) | __.0.0}

      {(1 2 3) | __.#1}
        1
      {(1 2 3) | __.#1.#1}
        1
      {(1 2 3) | __.#1.#1.#1}
        1

      {$data.*.*.*.* | ( {__ | unique} {__ | count} )}
        [["hashly","bashly","crashly"],9]

    Remember, the star operator exposes the list internals to future operators in parallel, so #1 here eats nine scalar values.
      {$data.*.*.*.*.#1 | ( {__ | unique} {__ | count} )}
        [["hashly","bashly","crashly"],9]
      {$data.*.*.*.* | __.#1}
        hashly

    With star boxing you don't have to split the segments, but remember that the output is always wrapped in a list.
      {$data.{(("*" "*" "*" "*"))}.#1}
        ["hashly"]

      {$data.*.*.*.#1}
        ["local","surprise local!","bar","hello","hashly","local","surprise local!","bar","hello","hashly","local","surprise local!","bar","hello","hashly"]
      {$data.*.*.* | __.#1}
        local

      {$data.*.*.#1}
        ["first","surprise array!","local","second","surprise number also!","local","third","surprise me too!","local"]
      {$data.*.* | __.#1}
        first

      {$data.*.#1}
        ["first","second","third"]
      {$data.* | __.#1}
        {"one":"first","two":"surprise array!","locals":{"one":"local","two":"surprise local!","foo":"bar","bar":"hello","hash":{"one":"hashly","two":"bashly","three":"crashly"}}}


    STILL MORE NOTES ON STARS
      If you use a * or () pathfind operator, the result will ALWAYS be a list.

      {$data.*.*.*.*.*}
        []
      {$data.*.*.*.*.*.#1}
        []
      {$data.foo.*}
        []
      {$data.*.one.foo}
        []
      {$data.*.one.#1.foo}
        []

<h3>Tree climbing</h3>

  {* (:name "Awesome John" :age :alpha) | >$a-john ||}

  {* (:name "Awesome Bobs" :age :beta) | >$a-bobs ||}

  {* (:name "Awesome Mary" :age :gamma) | >$a-mary ||}

  {* (:name "Awesome Stev" :age :delta) | >$a-stev ||}

  {($a-john $a-bobs $a-mary $a-stev) | >$awesome_people ||}

  {* (:name "Cool John" :age :alpha) | >$c-john ||}

  {* (:name "Cool Bobs" :age :beta) | >$c-bobs ||}

  {* (:name "Cool Mary" :age :gamma) | >$c-mary ||}

  {* (:name "Cool Stev" :age :delta) | >$c-stev ||}

  {($c-john $c-bobs $c-mary $c-stev) | >$cool_people ||}

  {* (:name "Neat John" :age :alpha) | >$n-john ||}

  {* (:name "Neat Bobs" :age :beta) | >$n-bobs ||}

  {* (:name "Neat Mary" :age :gamma) | >$n-mary ||}

  {* (:name "Neat Stev" :age :delta) | >$n-stev ||}

  {($n-john $n-bobs $n-mary $n-stev) | >$neat_people ||}

  {( {* (:name "awesome test co" :employees $awesome_people :boss $a-john)} {* (:name "cool test co" :employees $cool_people :boss $c-john)} {* (:name "neat test co" :employees $neat_people :boss $n-john)} ) | >$companies ||}

  NOW QUERY IT

    Find by position, then by property names:
      {$companies.#-2.boss.name}
        Cool John

    All employees, grouped by employer
      {$companies.*.employees}
        [[{"name":"Awesome John","age":"alpha"},{"name":"Awesome Bobs","age":"beta"},{"name":"Awesome Mary","age":"gamma"},{"name":"Awesome Stev","age":"delta"}],[{"name":"Cool John","age":"alpha"},{"name":"Cool Bobs","age":"beta"},{"name":"Cool Mary","age":"gamma"},{"name":"Cool Stev","age":"delta"}],[{"name":"Neat John","age":"alpha"},{"name":"Neat Bobs","age":"beta"},{"name":"Neat Mary","age":"gamma"},{"name":"Neat Stev","age":"delta"}]]

    A flat list of all employees
      {$companies.*.employees.*}
        [{"name":"Awesome John","age":"alpha"},{"name":"Awesome Bobs","age":"beta"},{"name":"Awesome Mary","age":"gamma"},{"name":"Awesome Stev","age":"delta"},{"name":"Cool John","age":"alpha"},{"name":"Cool Bobs","age":"beta"},{"name":"Cool Mary","age":"gamma"},{"name":"Cool Stev","age":"delta"},{"name":"Neat John","age":"alpha"},{"name":"Neat Bobs","age":"beta"},{"name":"Neat Mary","age":"gamma"},{"name":"Neat Stev","age":"delta"}]

    All employee names
      {$companies.*.employees.*.name}
        ["Awesome John","Awesome Bobs","Awesome Mary","Awesome Stev","Cool John","Cool Bobs","Cool Mary","Cool Stev","Neat John","Neat Bobs","Neat Mary","Neat Stev"]

    All employee names of the second company
      {$companies.#2.employees.*.name}
        ["Cool John","Cool Bobs","Cool Mary","Cool Stev"]

    Second employee name of each company
      {$companies.*.employees.#2.name}
        ["Awesome Bobs","Cool Bobs","Neat Bobs"]

    Second employee name over all
      {$companies.*.employees.* | __.#2.name}
        Awesome Bobs

    Star boxing gives us the second name with a single {list peek} call, but remember that it always returns a list.
      {$companies.{(("*" "employees" "*"))}.#2.name}
        ["Awesome Bobs"]

    Without star boxing it looks in all the wrong places
      {$companies.*.employees.*.#2.name}
        []
      {$companies.*.employees.*.name.#2}
        []

<h3>Dot sugar</h3>
  Pairs of commands: the dot-form and the list peek form, side by side.

    {(1 2 3) | __.#2}
      2
    {(1 2 3) | list peek path "#2"}
      2

    {( (1 2) (3 4) ) | __.#2.#1}
      3
    {( (1 2) (3 4) ) | list peek path ("#2" "#1")}
      3

    {( (1 2) (3 4) ) | __.{("#2" "#1")}.#2}
      [4,2]
    {( (1 2) (3 4) ) | list peek path ( ("#2" "#1") "#2" )}
      [4,2]

    {( (1 2) (3 4) ) | __.{("#2" "#1")}.{(1 0)} }
      [4,3,2,1]
    {( (1 2) (3 4) ) | list peek path ( ("#2" "#1") (1 0) )}
      [4,3,2,1]

    {( (1 2) (3 4) ) | __.{("#2" "#1")}.{(((1 0)))} }
      [[4,3],[2,1]]
    {( (1 2) (3 4) ) | list peek path ( ("#2" "#1") (((1 0))) )}
      [[4,3],[2,1]]

    {( (1 2) (3 4) ) | __.*.{(1 0)} }
      [2,1,4,3]
    {( (1 2) (3 4) ) | list peek path ( "*" (1 0) )}
      [2,1,4,3]

    {( (1 2) (3 4) ) | __.*.{(((1 0)))} }
      [[2,1],[4,3]]
    {( (1 2) (3 4) ) | list peek path ( "*" (((1 0))) )}
      [[2,1],[4,3]]

<h3>Series and parallel</h3>

    peek in series: first take the second element, then take its first element
      {( (1 2) (3 4) ) | list peek path ( 1 0 )}
        3

    peek in parallel: take the second element, and the first element, and stage them for further peeking
      {( (1 2) (3 4) ) | list peek path ( (1 0) )}
        [[3,4],[1,2]]

    now we've taken the second element of each of the staged items
      {( (1 2) (3 4) ) | list peek path ( (1 0) 1 )}
        [4,2]

    we've learned:
    -- the first list is processed in series
    -- sublists are processed in parallel

    now we'll see that those alternate: a sub-sub-list is processed in series.

    this takes the first element of the second element, but does it in parallel -- hence the list wrapping
      {( (1 2) (3 4) ) | list peek path ( ((1 0)) )}
        [3]

    same, but with a second serial pathway inside the parallel one
      {( (1 2) (3 4) ) | list peek path ( ((1 0) (1 1)) )}
        [3,4]

    parallel + series + parallel -- each parallel layer adds another wrapper list
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) )}
        [[[3,4],[1,2]]]

    take the second element of our list of lists
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) 1 )}
        [[1,2]]

    why is it [[1,2]] instead of [1,2]?
    once we've gone parallel (or used "*"), the results are always wrapped in a list regardless of the number of results.
    if we stay serial the whole time any matching elements are returned as-is.

    now we take the first element of the above
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) 1 0 )}
        [1]

    the second parallel pathway here is fed our forest, and reverses the reversed order -- restoring our original input
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) (1 0) )}
        [[1,2],[3,4]]

    without the extra parallel wrapping the second pathway operates on the list elements instead of the lists
      {( (1 2) (3 4) ) | list peek path ( (1 0) (1 0) )}
        [4,3,2,1]

    this time the second pathway operates serially -- same result as without the dressing
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) ((1 0)) )}
        [1]

    remember that the second pathway is seeing the lists in reversed order
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) ((1 0) (0 1)) )}
        [1,4]

    same double reversal as above, but with an extra layer of wrapping
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) (((1 0))) )}
        [[[1,2],[3,4]]]

    the star unwraps staged items and feeds them to the next pathway
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) "*" 1 )}
        [4,2]

    which is equivalent to this, for the two element case
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) (0 1) 1 )}
        [4,2]

    parallel consumption post star
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) "*" (1 0) )}
        [4,3,2,1]

    note the equivalence -- the star unwrapifies our initial double-layering
      {( (1 2) (3 4) ) | list peek path ( (1 0) (1 0) )}
        [4,3,2,1]

    which here allows us to reverse the list order, then the element order
      {( (1 2) (3 4) ) | list peek path ( (((1 0))) "*" (((1 0))) )}
        [[4,3],[2,1]]

    and the simpler equivalent
      {( (1 2) (3 4) ) | list peek path ( (1 0) (((1 0))) )}
        [[4,3],[2,1]]


<div class="page-header" id="id_poke">
    <h2>In Depth: Poke</h2>
</div>
  Poking is a lot like peeking, except it sets a value instead of reading it and fills any gaps it encounters with empty lists.

  no path is like push
    {(1 2 3) | list poke value 999}
      [1,2,3,999]

  three ways to push a new value on a list
    {(1 2 3 4) | >$ints}
      [1,2,3,4]
    {5 | >$ints.{$ints | count}}  {// (BUG) //}
      5
    {$ints | poke 6}
      [1,2,3,4,5,6]
    {$ints | union 6}
      [1,2,3,4,5,6]

  by key:
    {(1 2 3) | list poke path (1) value 999}
      [1,999,3]
    {(1 2 3) | list poke path (1 :a) value 999}
      [1,{"a":999},3]
    {* (:a 1 :b 2 :c 3) | list poke path (:d) value 999}
      {"a":1,"b":2,"c":3,"d":999}
    {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path (:b 1) value 999}
      {"a":[2,1],"b":[3,999],"c":[4,5]}
    {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path (:b 1 :d) value 999}
      {"a":[2,1],"b":[3,{"d":999}],"c":[4,5]}
    {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path (:b 1 :d :e) value 999}
      {"a":[2,1],"b":[3,{"d":{"e":999}}],"c":[4,5]}

    when you poke by key to a non-existent key in an unkeyed list, it converts it to a keyed list. (BUG)
      {(1 2 3) | list poke path (:a) value 999}
        {"0":1,"1":2,"2":3,"a":999}

    when you poke by key to a non-existent var, it borks completely. (BUG)
      {1234 | >$qwe.rty}
        {"rty":1234}

    the second set should override the first one (BUG)
      {"{:foo}x" | >$xxx || 123 | >$xxx.y | $xxx}
        {y:123}
    it works this way
      {"{:foo}x" | >$xxx || 123 | >$xxx.#3 | $xxx}
        ["{:foo}x",[],123]


  by position:
    {(1 2 3) | list poke path ("#2") value 999}
      [1,999,3]
    {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path ("#2") value 999}
      {"a":[2,1],"b":999,"c":[4,5]}
    {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path ("#2" "#2") value 999}
      {"a":[2,1],"b":[3,999],"c":[4,5]}

    the positional operator fills gaps with empty lists
      {() | list poke path ("#2") value 999}
        [[],999]
      {() | list poke path ("#-2") value 999}
        [999,[]]
      {() | list poke path ("#-2" "#3") value 999}
        [[[],[],999],[]]
      {() | list poke path ("#-2" "#3" "#-4") value 999}
        [[[],[],[999,[],[],[]]],[]]

    it mixes well with keyed lists, as long as enough elements exist.
      {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path ("#1" "#4") value 999}
        {"a":[2,1,[],999],"b":[3,4],"c":[4,5]}
      {* (:a (2 1) :b (3 4) :c (4 5)) | list poke path ("#1" "#-6") value 999}
        {"a":[999,[],[],[],2,1],"b":[3,4],"c":[4,5]}
      {* (:a {* (:aa 1 :ab 2)} :b {* (:ba 1 :bb 2)} :c {* (:ca 1 :cb 2)}) | list poke path ("#2" "#2") value 999}
        {"a":{"aa":1,"ab":2},"b":{"ba":1,"bb":999},"c":{"ca":1,"cb":2}}

    but if there are gaps in your keyed list the results might be unexpected -- the generated keys are consecutive integers (offset by one million to avoid common collisions).
    this behavior is likely to change; please don't rely on generated keys. also, the ordering is off in chrome. (BUG)
      {* (:a 1 :b 2 :c 3) | list poke path ("#5") value 999}
        {"a":1,"b":2,"c":3,"1000000":[],"1000001":999}
      {* (:a 1 :b 2 :c 3) | list poke path ("#5") value 999 | sort}
        [[],1,2,3,999]

    Sugar for poke and unshift
      {(1 2 3) | poke 4 path "#0"}
        [4,1,2,3]

      {(1 2 3) | poke 4 path "#-0"}
        [1,2,3,4]

  by star:

    {(2 3 4) | list poke path "*" value 999}
      [999,999,999]
    {((2 1) (3 4) (4 5)) | list poke path "*" value 999}
      [999,999,999]
    {((2 1) (3 4) (4 5)) | list poke path ("*" "#2") value 999}
      [[2,999],[3,999],[4,999]]
    {((2 1) (3 4) (4 5)) | list poke path ("#2" "*") value 999}
      [[2,1],[999,999],[4,5]]
    {((2 1) (3 4) (4 5)) | list poke path ("*" "*") value 999}
      [[999,999],[999,999],[999,999]]

    stars generate a new empty list for each missing (or scalar) level. (BUG)
      {() | list poke path ("*") value 999}
        []
      {() | list poke path ("*" "*") value 999}
        [[]]
      {(1 2 3) | list poke path ("*" "*") value 999}
        [[],[],[]]
      {(1 2 3) | list poke path ("*" "*" "*") value 999}
        [[[]],[[]],[[]]]
      {(1 2 3) | list poke path ("*" "*" "#2") value 999}
        [[[],999],[[],999],[[],999]]


  by list:

    {* (:a 1 :b 2 :c 3) | list poke path ( (:a :b) ) value 999}
      {"a":999,"b":999,"c":3}
    {* (:a 1 :b 2 :c 3) | list poke path ( (:d :e) ) value 999}
      {"a":1,"b":2,"c":3,"d":999,"e":999}
    {* (:a 1 :b 2 :c 3) | list poke path ( ("#1" "#3") ) value 999}
      {"a":999,"b":2,"c":999}
    {((2 1) (3 4) (4 5)) | list poke path ("*" ("#2" "#4") ) value 999}
      [[2,999,[],999],[3,999,[],999],[4,999,[],999]]

    generating a new list
      {* (:a 1 :b 2 :c 3) | list poke path ( "#2" ("#2" "#6" "#4") ) value 999}
        {"a":1,"b":[[],999,[],999,[],999],"c":3}

    generating a new list (BUG)
      {* (:a 1 :b 2 :c 3) | list poke path ( :b ("#2" "#6" "#4") ) value 999}
        {"a":1,"b":[[],999,[],999,[],999],"c":3}

    generating a new keyed list (BUG)
      {* (:a 1 :b 2 :c 3) | list poke path ( "#2" (:d :e) ) value 999}
        {"a":1,"b":{"d":999,"e":999},"c":3}

    double list all the way (BUG)
      {((2 1) (3 4) (4 5)) | list poke path ( ("#1" "#3") ("#2" "#4") ) value 999}
        [[2,999,[],999],[3,4],[4,999,[],999]]


Alias tests

  These weird tests confirm that if an alias as an explicit pipe in it the implicit pipe in the usage is ignored.
    {0 | else "{9}" | add 1}
      []
    {1 | >$ggg | then "{$ggg | add 1 | >$ggg}" else "" | $ggg}
      1
    {({1 | then :yay} {1 | not | then :boo})}
      ["yay",""]
    {({1 | then :yay} {0 | then :boo})}
      ["yay",""]

  Ensure aliases with pipes in them work as the second segment in lambdas.
  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | then 1 else 0}"}
    [0,1,0,1,1,1,0,1,1]



<!-- Aliases and bindings

This section is no longer applicable: alias creation doesn't work yet, and variable bindings are gone. We should probably just delete it, but we'll let this gel a bit more first.

// DO THIS:
//  Get all current aliases:
//    {alias find}

//  You can also create aliases at runtime. This is useful when paired with command creation.
//
//    Create a new command:
//      {daimio import block "hey {$name}!" into :string as :greet params :name}
//
//      {string greet name "yourself"}
//        hey yourself!
//
//    Alias it:
//      {daimio alias string "string greet name" as :greet}
//
//      {greet "Jacobinius"}
//        hey Jacobinius!
//
//    // TODO: it looks like this doesn't pop the var context stack like it should...

//  Make an alias yourself:
//    {alias add string "string join" as :join}
//
//  This time we'll include the param value. Notice we wrap it in a block first, to handle the nested quotes:
//    {begin j}string join on ", "{end j}{alias add string j as :stick}
//
//
//:::Bindings and such:::
//
//    {variable bind path :test block "{$count1 | add 1 | >$count1}"}
//
//    {:a | >$test}
//      a
//
//    {$count1}
//      1
//
//  The magic var var __var takes var's val. This allows each binding to reference the value of the variable at the time it was edited, without regard for other bindings.
//    {variable bind path :test block "{$count2 | add 1 | >$count2}"}
//
//    {:b | >$test}
//      b
//
//    {$count1} x {$count2}
//      2 x 1
//
//    {variable unbind path :test block "{$count1 | add 1 | >$count1}"}
//
//    {:c | >$test}
//      c
//
//    {$count1} x {$count2}
//      2 x 2
//
//    {variable bind path :testx.y.z block "{$count2 | add 2 | >$count2}"}
//
//    {:x | >$testx.y.z}
//      x
//
//    {$count1} x {$count2}
//      2 x 4
//
//  You can edit the bound var directly in the daimio -- infinite recursion is prevented.
//    {variable bind path :foox block "{__var.#1 | add 2 | >$foox.0}"}
//
//    {(7 2) | >$foox}
//      [7,2]
//
//    {$foox}
//      [9,2]
//
//  Multiple bindings can edit the var in different ways (they all receive the original value through __var).
//    {variable bind path :foox block "{__var.#1 | add __var.#2 | >$foox.1}"}
//
//    {(7 2) | >$foox}
//      [7,2]
//
//    {$foox}
//      [9,9]
//
  // THINK: make a different test suite for the dom handler and interactive stuff.
-->




<div class="page-header" id="id_logic_examples">
  <h2>Logic Commands</h2>
</div>

  <h3>OR</h3>

     ~~~ OR returns the first true value it finds ~~~

     One valued 'or' looks at each item in the list
       {($false 1 2 3) | or}
         1

       {or ($false 1 2 3)}
         1

       {or ($false 0 "" :true)}
         true

     With two values it just considers each in toto
       {5 | or 10}
         5

       {$false | or :true}
         true

       {(0 0) | or 1}
         [0,0]

       {$false | or (0 0)}
         [0,0]

     ~~~ AND only returns true or false ~~~
     // THINK: why not return the last value in the list if everything is truthy?

     One valued 'and' looks at each item in the list
       {($false 1 2 3) | and | then :true else :false}
         false

       {and ($false 1 2 3) | then :true else :false}
         false

       {and ($false 0 "" :true) | then :true else :false}
         false

       {(1 2 3) | and | then :true else :false}
         true

       // NOTE: the below fail due to faulty piping that sets 'also' to 'false'.

       {and (1 2 3) | then :true else :false}
         true

       {and ("asdf" :true) | then :true else :false}
         true

     With two values it just considers each in toto
       {5 | and 10 | then :true else :false}
         true

       {5 | and 0 | then :true else :false}
         false

       {$false | and :true | then :true else :false}
         false

       {(0 0) | and 10 | then :true else :false}
         true

       {$false | and (0 0) | then :true else :false}
         false

    and/or use standard Daimio conception of falsiness:
      {( () ) | and | then :true else :false}
        false
      {() | and () | then :true else :false}
        false
      {( () "" 0 ) | or | then :true else :false}
        false


  <h3>IF</h3>
    Note that both 'if' and 'cond' take a 'with' param, which includes pipeline variables in the block scope.
    If the 'with' param is provided the selected block will be executed. Otherwise it will be returned as is.
    The magic key __in becomes the process input, if 'with' is a keyed list. If 'with' is scalar the value is taken to be __in. If 'with' is an unkeyed list the effects are chaotic-evil.
    Note that the short form of e.g. "with __" can only be used if __ is scalar: otherwise, use "with {* (:__in __)}"

      {1 | else "{fff fff}" | add 1}
        2

      {0 | else "{10}" | run | add 1}
        11
      {10 | >a | then "{__}" | run with _a | add 1}
        11
      {10 | >a | then "{_x}" | run with {* (:x _a)} | add 1}
        11

      {10 | >x | then 1}
        1

      {if :true then :awesome}
        awesome

      {if "" then "not awesome"}

      {if $false then "not awesome"}

      {if {not ""} then :awesome}
        awesome

      {if {and ({not ""} {not $false})} then :awesome}
        awesome

      {if {and ({or ({not $false} $false)} $x)} then :awesome}
        awesome

      {if {and ({$false} {$x})} then :awesome}

      {if {and (:great "not bad!")} then :awesome}
        awesome

      {if {and (:great "not bad!" $nothing)} then "bad" else :awesome}
        awesome

      {:true | if __ then :neat}
        neat

      {:true | else "bad"}
        true

      {$false | else "good"}
        good

      {:asdf | is in (:foo :bar :asdf) | then :great}
        great

      {:asdf | is in (:foo :bar) | then "bad" else :great}
        great

      {:burgers | eq "urge" | then "uh-oh" else :super}
        super

      {:burgers | is like "/urge/" | then :super else "uh-oh"}
        super

      {:burgers | is like "/URGE/i" | then :super else "uh-oh"}
        super

      {:burgers | is like "/URGE/" | then "oh no!" else :super}
        super

      {:burgers | is like "/^urge/" | then "oh no!" else :super}
        super

      {$false | not | then :true else :false}
        true

      {:true | not | then :true else :false}
        false

      {not $false | then :true else :false}
        true

      {not :true | then :true else :false}
         false

  <h3>COND</h3>

    Ensure false values fail and the first good one passes
      {cond ($false :bad "" :bad 0 :bad () :bad 1 :good 2 :bad)}
        good

    Likewise for pre-processed pipelines
      {cond ({$false} :bad {""} :bad {0} :bad {()} :bad {1} :good {2} :bad)}
        good

    Ensure we always process the result
      {cond ({1 | subtract 1} :bad {1 | add 1} "{(:g :o :o :d)}") | run | join}
        good

      {cond ($false :bad {:true} "{:good}" $nope :bad) | run | split}
        ["g","o","o","d"]

    Ensure proper short-circuiting for results
      {0 | >$cond1 | cond (0 "{$cond1 | add 1 | >$cond1}" 1 "{$cond1 | add 2 | >$cond1}" 2 "{$cond1 | add 3 | >$cond1}") | run | $cond1}
        2

    Ensure blocks are passed properly
      {cond (0 :foo 1 "{_n | add _k}") | run with {* (:n 11 :k 2)} }
        13


  <h3>SWITCH</h3>

    Ensure we select the correct value
      {logic switch on 2 value (1 :one 2 :two 3 :three)}
        two

      {logic switch on {:asdf | string slice start 2} value (:as 1 :sd 2 :df 3)}
        3

    Ensure false values trigger the switch
      {0 | switch (1 :bad 0 :good)}
        good

    Be aware of implicit coercion
      {0 | switch ("" :good 0 :bad)}
        good
      {12 | switch ("12" :good 12 :bad)}
        good

    Ensure blocks are passed through properly
      {1 | switch (1 "{:good}") | split}
        ["{",":","g","o","o","d","}"]

      {1 | switch (1 "{:good}") | run | split}
        ["g","o","o","d"]
      {2 | switch (1 :bad 2 "{_n | add _k}") | run with {* (:n 11 :k 2)} }
        13

    Ensure proper short-circuiting for results
      {0 | >$switch1 | 1 | switch (0 "{$switch1 | add 1 | >$switch1}" 1 "{$switch1 | add 2 | >$switch1}" 2 "{$switch1 | add 3 | >$switch1}") | run | $switch1}
        2

    Conditions are never processed
      {:foo | switch ("{:boo}" :bad "{:foo}" :bad :foo :good)}
        good

      {10 | switch ("{_n | minus _k}" :bad "{_n | add _k}" :bad 10 :good) | run with {* (:n 5 :k 5)} }
        good

//    TODO: test for 'otherwise'-style default
//      {"{:foo}" | switch ("{:boo}" :bad "{:foo}" :bad)}


<div class="page-header" id="id_math_examples">
  <h2>Math Commands</h2>
</div>

  Ensure values are properly finagled.
    {1 | >$x | 2 | >$y | 3 | >$z | ($x $y $z) | add}
      6

  <h3>ADD</h3>

    {math add value 123 to 321}
      444
    {add 123 to 321}
      444
    {321 | add 123}
      444

  All basic math commands are fairly versatile.
    {math add value (1 2 3)}
      6
    {math add value 1 to (4 5 6)}
      [5,6,7]
    {math add value (4 5 6) to 1}
      [5,6,7]
    {math add value (3 2 1) to (4 5 6)}
      [7,7,7]

  <h3>SUBTRACT</h3>

    {subtract 4 from :7}
      3
    {:7 | subtract 4}
      3
    {subtract (:100 :2 3 :4 5)}
      86
    {(1 3 5 7) | subtract 3}
      [-2,0,2,4]
    {math subtract value (6 5 4) from (1 2 3)}
      [-5,-3,-1]

  <h3>MULTIPLY</h3>

    {multiply 4 by 7}
      28
    {:7 | times :4}
      28
    {multiply (:1 2 :3)}
      6
    {(1 :2 3) | times 3}
      [3,6,9]
    {math multiply value (1 2 3) by (6 5 4)}
      [6,10,12]

  <h3>DIVIDE</h3>

    (Note that this shortcut is different.)

    {divide value 7 by 4}
      1.75
    {:7 | divide by :4}
      1.75
    {divide value (:1 2 :3) | map block "{__ | round to 2}"}
      [0.17]
    {(1 2 3) | divide by 3 | map block "{__ | round to 2}"}
      [0.33,0.67,1]
    {math divide value (1 2 3) by (6 5 4) | map block "{__ | round to 2}"}
      [0.17,0.4,0.75]

  <h3>LOG</h3>
    {math log value 100}
      4.605170185988092
    {math log value 100 base 10}
      2
    {1024 | math log base 2}
      10

  <h3>MAX</h3>

    {max (1 2 3)}
      3
    {3 | max 1}
      3
    {3 | max (11 12)}
      12
    {13 | max (11 12)}
      13
    {0 | max -1}
      0

  <h3>MIN</h3>

    {min (11 22 3)}
      3
    {3 | min 11}
      3
    {13 | min (111 12)}
      12
    {13 | min (111 112)}
      13
    {0 | min 1}
      0


  <h3>MOD</h3>

    Note that this is the true modulus operation, rather than JS's default remainder operation. Checking parity over negative integers becomes easier this way, for example.

      {math mod value 7 by 2}
        1
      {math mod value -7 by 2}
        1

      {5 | mod 13}
        5
      {-5 | mod 13}
        8
      {-5 | mod -13}
        -5
      {5 | mod -13}
        -8

      {0 | mod 4}
        0


  <h3>POW</h3>

    {math pow value 2 exp 8}
      256
    {:5 | math pow exp :3}
      125
    {5 | math pow exp 0.5}
      2.23606797749979

  <h3>RANDOM</h3>

  <h3>ROUND</h3>

    {123.456 | math round}
      123
    {123.456 | math round to -2}
      100
    {123.456 | math round to 2}
      123.46

<div class="page-header" id="id_list_examples">
  <h2>List Commands</h2>
</div>


<!-- Older commands that probably won't exist anymore but we still need to handle these cases somehow

    // {((:one :row) (:second :row)) | list to_csv}
    //   one,row\nsecond,row

    // {$data | list organize command "sort:one,desc;stack:three;"}
    // {"even":{"count":2,"column":"three","value":"even","items":[{"one":"first","two":["hi","hello","hijinx","goodbye"],"three":"even"},{"one":"third","two":["hinterlands","yellow","mishmash"],"three":"even"}]},"odd":{"count":1,"column":"three","value":"odd","items":[{"one":"second","two":["hinterlands","yellow","mishmash"],"three":"odd"}]}}

    // {list prune value ({* (:one (:2 :3 :5) :two (:1 :3 :4))} {* (:one (:3 :4 :5) :two (:1 :3 :4))}) expression {this | less than :4} path "*.*"}
    //   [{"one":{"2":"5"},"two":{"2":"4"}},{"one":{"1":"4","2":"5"},"two":{"2":"4"}}]
    //
    // {list prune value ({* (:one (:2 :3 :5) :two (:1 :3 :4))} {* (:one (:3 :4 :5) :two (:1 :3 :4))}) expression {parent.parent.one.1 | is like :3} path "*.*"}
    //   [{"one":[],"two":[]},{"one":["3","4","5"],"two":["1","3","4"]}]
    //
    // {list extract value ({* (:one (:2 :3 :5) :two (:1 :3 :4))} {* (:one (:3 :4 :5) :two (:1 :3 :4))}) expression {parent.parent.one.1 | is like :3} path "*.one"}
    //   ["2","3","5"]
    //

-->


    TODO: tests for block executing in same space (re: spacevar scoping)


  Some data
    {( {* (:x 2 :y :d)} {* (:x 1 :y :d)} {* (:x 3 :y :a)} {* (:x 2 :y :c)} {* (:x 4 :y :b)} ) | >$klist}
      [{"x":2,"y":"d"},{"x":1,"y":"d"},{"x":3,"y":"a"},{"x":2,"y":"c"},{"x":4,"y":"b"}]

    {( {* (:one (2 3 5) :two (1 3 4))} {* (:one (3 4 5) :two (1 3 4))} ) | >$dlist ||}

    {* (:two {* (:one :second :two (:hinterlands :yellow :mishmash) :three :odd)} :one {* (:one :first :two (:hi :hello :hijinx :goodbye) :three :even)} :three {* (:one :third :two (:hinterlands :yellow :mishmash) :three :even)} )  | >$data ||}


  <h3>COUNT</h3>

    {(1 2 3) | list count}
      3
    {$data | list count}
      3
    {$dlist | count}
      2
    {$klist | count}
      5

  <h3>EACH</h3>

    {each data (1 2 3) block "{__}x "}
     1x 2x 3x
    {each data {* (:one 1 :two 2 :three 3)} block "{_key}x "}
      onex twox threex

    {begin loop | each data {* (:one 1 :two 2 :three 3)}} {_key}: {__} {end loop}
      one: 1  two: 2  three: 3

    {each block "x{__}-" data (1 2 3)}
      x1-x2-x3-
    {"x{__}-" | each data (1 2 3)}
      x1-x2-x3-
    {begin foo | each data (1 2 3)}x{__}-{end foo}
      x1-x2-x3-


  <h3>FILTER</h3>

    NOTE: these used to be extract, but we're going to handle that differently in the future. There's a filter function that does what it says on the tin, and a 'treewalk' function that allows you to dive into data and filter it from the inside. these two together can probably replace the old extract/prune functionality, maybe.

    {$klist | filter block "{__.x | eq 2}"}
      [{"x":2,"y":"d"},{"x":2,"y":"c"}]

    {$klist | __.*.* | filter block "{__ | eq :d}"}
      ["d","d"]

    {$dlist | __.*.*.* | filter block "{__ | less than :4}"}
      [2,3,1,3,3,1,3]


    no _parent is exposed in filter (BUG)
    {$dlist |  __.*.one | filter block "{_parent.parent.one.1 | eq :3}"}
      [2,3,5]

    {( (1 2 3) 2 3 ) | filter block "{and (1 1)}"}
      [[1,2,3],2,3]

    THINK: how do we filter out non-lists? is this actually an issue, since 3 casts to (3) whenever needed?
    {( (1 2 3) 2 3 ) | filter block "{__ | count}"}
      [[1,2,3],2,3]
    {( (1 2 3) 2 3 ) | filter block "{__ | count | eq 1}"}
      [2,3]
    {( (1 2 3) 2 3 ) | filter block "{__ | count | less than 2 | not}"}
      [[1,2,3]]

    {( {* (:x 1 :y 2)} {* (:x 11 :y 3)} {* (:x 1 :y 4)} ) | filter block "{__.x | eq 1}"}
      [{"x":1,"y":2},{"x":1,"y":4}]

    {({* (:one (2 3 5) :two (1 3 4))} {* (:one (3 4 5) :two (1 3 4))}) | __.*.*.* | filter block "{__ | less than 4}"}
      [2,3,1,3,3,1,3]


  <h3>FIRST</h3>

    {$klist | first block "{__.x | eq 2}"}
      {"x":2,"y":"d"}

    {( 1 2 3 2 3 ) | first block "{__ | eq 2}"}
      2
    {( (1 2 3) 2 3 ) | first block "{__ | count | eq 1}"}
      2
    {( (1 2 3) (2 3) 2 (1 2) 3 ) | first block "{__ | count | eq 2}"}
      [2,3]

    {( {* (:x 1 :y 2)} {* (:x 11 :y 3)} {* (:x 1 :y 4)} ) | first block "{__.x | eq 1}"}
      {"x":1,"y":2}


  <h3>GROUP</h3>

    THINK: these values are all correct, but they're keyed instead of simple arrays. and, hence, sorted poorly. (BUG)

    {(1 2 3 4 5 6) | list group by "{__ | mod 2}"}
      [[1,3,5],[2,4,6]]
    {( {* (:a 1)} {* (:a 4)} {* (:a 3)} {* (:a 1)} ) | list group by :a}
      {1:[{a:1},{a:1}],3:[{a:3}],4:[{a:4}]}
    {(1 2 3 4 5 6 7 8) | list group by "{__ | mod 4}"}
      [[1,5],[2,6],[3,7],[4,8]]
    {(1 2 3 4 5 6 7 8) | list group by "{__ | mod 4}" | list group by "{__.#1 | mod 2}"}
      [[[1,5],[3,7]],[[2,6],[4,8]]]
    {(1 2 3 4 5 6 7 8) | list group by "{__ | mod 4}" | sort by "{__.#1}" | list reverse | list group by "{__.#1 | mod 2}"}
      [[[3,7],[1,5]],[[4,8],[2,6]]]

    {( {* (:a :x :b 1)} {* (:a :z :b 2)} {* (:a :x :b 3)} {* (:a :z :b 4)} {* (:a :y :b 5)} ) | list group by :a}
      {"x":[{"a":"x","b":1},{"a":"x","b":3}],"z":[{"a":"z","b":2},{"a":"z","b":4}],"y":[{"a":"y","b":5}]}

  <h3>INTERSECT</h3>

    {( (1 2 3) (2 3 4) ) | list intersect}
      [2,3]
    {( (1 2 3) (2 3 4) (3 4 5) ) | list intersect}
      [3]
    {* (:a (1 2 3) :b (3 4 5)) | list intersect}
      [3]
    {list intersect data ($data.one.two (:hi :hello :gogo))}
      ["hi","hello"]

    {(1 2 3) | list intersect data (2 3 4)}
      [2,3]
    {(1 2 3) | list intersect also (2 3 4)}
      [2,3]
    {list intersect data (1 2 3) also (2 3 4)}
      [2,3]

    THINK: the return list is always unkeyed
    {list intersect data ($data.one {* (:one :first :four :nothing)})}
      ["first"]
    {list intersect data (1 2 3) also (3 4 5)}
      [3]


  <h3>JSON</h3>

    {begin list | list from-json}[["one","row"],["second","row"]]{end list}
      [["one","row"],["second","row"]]

    {begin list | list from-json}{"one":"row","second":"row"}{end list}
      {"one":"row","second":"row"}

    {((:one :row) (:second :row)) | list to-json}
      [["one","row"],["second","row"]]

    {{* (:one :row :second :row)} | list to-json}
      {"one":"row","second":"row"}

    {((:one :row) (:second :row)) | list to-json | list from-json}
      [["one","row"],["second","row"]]

    {{* (:one :row :second :row)} | list to-json | list from-json}
      {"one":"row","second":"row"}


  <h3>KEYS</h3>

    {(1 2 3) | list keys}
      ["0","1","2"]
    {* (:x 1 :y 2 :z 3) | list keys}
      ["x","y","z"]
    {$data | list keys}
      ["two","one","three"]
    {$dlist | list keys}
      ["0","1"]
    {$klist.#1 | list keys}
      ["x","y"]

  <h3>MAP</h3>

    TODO: add _with tests for {list ...}

      {map block "{__ | add 1}" data (1 2 3)}
        [2,3,4]
      {map block "{__}x" data (1 2 3)}
        ["1x","2x","3x"]
      {map block "{__}" data (1 2 3)}
        [1,2,3]
      {map block "x{__}" data (1 2 3)}
        ["x1","x2","x3"]

      {5 | >foo | (1 2 3) | map block "{__ | add _foo}"}
        [1,2,3]
      {5 | >foo | (1 2 3) | map block "{__ | add _foo}" with {* (:foo _foo)}}
        [6,7,8]

      {* (:a 1 :b 2 :c 3) | map block "{__ | times __}"}
        {"a":1,"b":4,"c":9}

    Ensure pipeline vars pass the value safely
      {(12 34) | map block "{__}"}
        [12,34]
      {(12 34) | map block "{__ | >foo}"}
        [12,34]
      {(12 34) | map block "{__ | >foo | add 1}"}
        [13,35]
      {(12 34) | map block "{__ | add 1 | >foo}"}
        [13,35]


  <h3>MERGE</h3>

    The merge command takes a list of keyed lists and applies a template to each one. It injects each key, which means we don't know in advance which variables are injected. This messes with our ability to do static analysis over pipeline variables. Is merge really necessary, or can {list each} do the job well enough?

    basic operation
      {({* (:name :paul)} {* (:name :john)} {* (:name :george)}) | >$names ||}

      {merge data $names block "hey {_name}! "}
        hey paul! hey john! hey george!

    in a block
      {begin block | merge data $names}hey {_name}! {end block}
        hey paul! hey john! hey george!

    and with a keyed list of keyed lists.
      {merge data {* (:one {* (:name :paul)} :two {* (:name :john)} :three {* (:name :george)})} block "hey {_name}! "}
        hey paul! hey john! hey george!

    merge issue: injected vars override imported vars.
    [THINK: change 'with' to 'import'?]
      {merge data $names block "hey {_name}! " with {* (:name :bob)}}
        hey paul! hey john! hey george!

    merge issue: injected vars can collide with pipeline vars.
    each pipeline var rewires any future references to itself, so {_name} means two different things here.
      {merge data $names block "hey {_name} how {:are | >name} you {_name}? "}
        hey paul how are you are? hey john how are you are? hey george how are you are?



  <h3>PEEK&POKE</h3>
    [see the peek&poke section above for these tests]

  <h3>RANGE</h3>

    {range 100 | add}
      5050
    {100 | range 5}
      [100,101,102,103,104]
    {list range length 5 start 100}
      [100,101,102,103,104]
    {100 | range 5 step 2}
      [100,102,104,106,108]

    {list range length 5 start 100 step -1}
      [100,99,98,97,96]


  <h3>REDUCE</h3>

    {(1 2 3) | reduce block "{add _value to _total}"}
      6
    {(1 2 3) | reduce block "{__ | add to _total}"}
      6

  <h3>REMOVE</h3>

    {(1 2 3 2 1) | list remove by_value 2}
      [1,3,1]
    {(1 2 3 2 1) | list remove by_value (2 3)}
      [1,1]
    {(1 2 3 2 1) | list remove by_key 2}
      [1,2,2,1]
    {(1 2 3 2 1) | list remove by_key (2 3)}
      [1,2,1]

    {* (:a 1 :b 2 :c 3) | list remove by_value 2}
      {"a":1,"c":3}
    {* (:a 1 :b 2 :c 3) | list remove by_value (2 3)}
      {"a":1}
    {* (:a 1 :b 2 :c 3) | list remove by_key :a}
      {"b":2,"c":3}
    {* (:a 1 :b 2 :c 3) | list remove by_key (:a :c)}
      {"b":2}

    remove sublists by value, respecting order
      {( (1 2) (3) (2 1) ) | list remove by_value ( (2 1) )}
        [[1,2],[3]]
      {( (1 2) (3) (2 1) ) | list remove by_value ( (1 2) (3) )}
        [[2,1]]

    remove sublists by value, ignoring order
      {( (1 2) (3) (2 1) ) | filter block "{__ | sort | eq (1 2) | not}"}
        [[3]]

      //   {$data | list remove path "*.two"}
      //     {"1":{"one":"first","three":"even"},"3":{"one":"third","three":"even"}}

    ensure removing doesn't change vars (BUG)
      {(1 2 3) | >x | list remove by_value 2 | _x | add}
        6
      {(1 2 3) | >$x | list remove by_value 2 | $x | add}
        6


  <h3>REKEY</h3>

    {(:x :y :z :q) | list rekey}
      {"0":"x","1":"y","2":"z","3":"q"}
    {* (:x 3 :y 2 :z 4 :q 1) | list rekey}
      {"0":3,"1":2,"2":4,"3":1}


    {$data | list rekey by "one"}
      {"second":{"one":"second","two":["hinterlands","yellow","mishmash"],"three":"odd"},"first":{"one":"first","two":["hi","hello","hijinx","goodbye"],"three":"even"},"third":{"one":"third","two":["hinterlands","yellow","mishmash"],"three":"even"}}



    {$data | list rekey by "{__.one}"}
      {"second":{"one":"second","two":["hinterlands","yellow","mishmash"],"three":"odd"},"first":{"one":"first","two":["hi","hello","hijinx","goodbye"],"three":"even"},"third":{"one":"third","two":["hinterlands","yellow","mishmash"],"three":"even"}}

    {$data | list rekey by "three"}
      {"odd":{"one":"second","two":["hinterlands","yellow","mishmash"],"three":"odd"},"even":{"one":"third","two":["hinterlands","yellow","mishmash"],"three":"even"}}


  <h3>REVERSE</h3>

    {(3 2 4 1) | list reverse}
      [1,4,2,3]

    TODO: This smashes keys currently (BUG)
    {* (:x 3 :y 2 :z 4 :q 1) | list reverse}
      {"q":1,"z":4,"y":2,"x":3}


  <h3>SORTING</h3>

    {(3 2 4 1) | list sort}
      [1,2,3,4]
    {(3 2 4 1) | list sort | list reverse}
      [4,3,2,1]

    {$klist | list sort by :x | __.*.x}
      [1,2,2,3,4]
    {$klist | list sort by :y | list reverse | __.*.y}
      ["d","d","c","b","a"]

    {$data | list sort by :one}
      [{"one":"first","two":["hi","hello","hijinx","goodbye"],"three":"even"},{"one":"second","two":["hinterlands","yellow","mishmash"],"three":"odd"},{"one":"third","two":["hinterlands","yellow","mishmash"],"three":"even"}]

    TODO: multiple keys (these don't work currently) (BUG)
      {$data | list sort by {* (:three :desc :one :asc)} | __.*.one}
        ["second","first","third"]
      {$data | list sort by {* (:three :desc :one :desc)} | __.*.one}
        ["second","third","first"]
      {$data | list sort by {* (:two.#2 :desc :one :desc)} | __.*.one}
        ["third","second","first"]
      {$data | list sort by {* (:two.#2 :desc :one :asc)} | __.*.one}
        ["second","third","first"]

    with a pipeline
      {$klist | list sort by "{(__.x __.y) | string join}" | merge block "{__.x}{__.y} "}
        1d 2c 2d 3a 4b
      {$klist | list sort by "{(__.y __.x) | string join}" | map block "{__.y}{__.x}"}
        ["a3","b4","c2","d1","d2"]

    sort by keys (BUG)
      {* (:c 3 :b 2 :a 4) | >l | list keys | sort | map block "{_l.{_value}}" with {* (:l _l)}}
        {"a":4,"b":2,"c":3}

    sort should preserve keys (BUG)
      {* (:c 3 :b 2 :a 1) | list sort}
        {"a":1,"b":2,"c":3}


  <h3>UNION</h3>

    {(1 2 3) | list union data (4 5 6)}
      [1,2,3,4,5,6]
    {(1 2 3) | list union also (4 5 6)}
      [4,5,6,1,2,3]
    {(1 2 3) | union (4 5 6)}
      [1,2,3,4,5,6]
    {union ((1 2 3) (4 5 6))}
      [1,2,3,4,5,6]
    {list union data ((1 2) (:1 :2))}
      [1,2,"1","2"]

    {list union data ( (1 2) {* (:a :1 :b :2)} )}
      {"0":1,"1":2,"a":"1","b":"2"}
    {* (:x 1 :y 2) | union {* (:z 3 :a 4)} }
      {"x":1,"y":2,"z":3,"a":4}
    {list union data ( {* (:a :1 :b :2)} {* (:a {* (:one :lovely :four :goodness)} )} )}
      {"a":{"0":"1","one":"lovely","four":"goodness"},"b":"2"}

    {1 | union (2 3)}
      [1,2,3]
    {$ffff | union (2 3)}
      [2,3]
    {(2 3) | union $ffff}
      [2,3]


  <h3>UNIQUE</h3>

    {(:hi :hi :puffy :ami :yumi) | list unique}
      ["hi","puffy","ami","yumi"]
    {* (:a :hi :b :hi :c :puffy :d :ami :e :hi :f :yumi) | list unique}
      {"a":"hi","c":"puffy","d":"ami","f":"yumi"}
    {((1) (2) (1) (3)) | list unique}
      [[1],[2],[3]]


<div class="page-header" id="id_string_examples">
  <h2>String Commands</h2>
</div>


  <h3>GREP</h3>
    {string grep value (:hello :world) on "/.llo/"}
      ["hello"]

  <h3>TRUNCATE</h3>
    {"four sixsix four" | string truncate to 10}
      four
    {"four sixsix four" | string truncate to 11}
      four sixsix
    {"foursixsixfour" | string truncate to 10}
      foursixsix
    {"four sixsix four" | string truncate to 10 add "..."}
      four...
    {"four sixsix four" | string truncate to 11 add "..."}
      four sixsix...
    {"foursixsixfour" | string truncate to 10 add "..."}
      foursixsix...


<div class="page-header" id="id_process_examples">
  <h2>Process Commands</h2>
</div>


  <h3>RUN</h3>
    Basic operation
      {"{12 | add 1}" | run}
        13
      {("{1 | add 2}" "{2 | add 7}") | map block "{__ | run}" | add 1}
        [4,10]
    
    Ensure run doesn't damage non-blocks
      {5 | run | add 1}
        6
      {(5 12) | run | add 1}
        [6,13]
    
    Simple 'with' params are passed as process input
      { "{__ | add 1}" | run with 7}
        8
        
    Keyed 'with' params inject pipeline variables into the process input
      { "{_foo | add 1}" | run with {* (:foo 91)} | add 1}
        93
    
    Calling run without a 'with' param defaults to passing the current process input
      {(1 2 3) | map block "{"{__ | add 1}" | run}" | add 1}
        [3,4,5]

<div class="page-header" id="id_app_edge">
  <h2>Edge Cases</h2>
</div>

  A section for pushing the parser and interpreter into corners.

    Ensure tail position pipeline vars don't flake out
      {2 | >two | "" | _two}
        2

    Ensure the dunder quoting works properly
      {(7 8) | each block (1 __ "{__}")}
        [1,[7,8],"{__}"][1,[7,8],"{__}"]
      {"{__}" | quote}
        {__}

notes: the block execution scope isn't being given each item, and also isn't given even the first item correctly. probably need to do this global looping manually over all matches to properly support this effect... maybe two different commands or params? or just don't worry about opt yet.
  {"12 x 34" | string transform from "/\d+/g" to "{__ | add 7}"}
    19 x 41
  {"12 x 34" | string transform from "/\d/g" to "{({__ | add 1} {__ | add 3})}"}
    [2,4][3,5] x [4,6][5,7]

Extra braces don't matter. extra quotes do, but are generally ok.
  {{{"{__ | add {"4"}}"}} | map data {(1 2)} }
    [5,6]


Tests for blocks
  make sure we're not defuncing pre-merge
    {* (:x 1) | >$qq}
      {"x":1}
    {"{:foo}x" | >$qq.ww.ee || merge data $qq block "{_ee | quote}"}
      {:foo}x
    {$qq | merge block "{__}"}
      1{"ee":"{:foo}x"}
    {$qq | merge block "{(__)}"}
      [1][{"ee":"{:foo}x"}]


Tests for stringification
  {1 | >$power || each data (1 2 3 4) block "{math pow value 2 exp $power | >$power} "}
    2 4 16 65536


Tests for pipes
  ensure we're not front-piping: the initial command segment shouldn't get pipe vars
    {math pow value 5 exp 0}
      1

    (should fail with error, no exp)
    {math pow value 5}

    (should still fail)
    // TODO: ensure we're not front-piping inside pipes
    // (this might have to wait until the big rebuild)
    {math pow value 5 | >$vvvvv}

    (ss should fail with error, so zero value)
    {3 | math pow value {string split}}
      0

  ok, but what about this?
    {begin walk | merge data ({* (:a {* (:s 1)} )}) }{_a.s}{end walk}
      1

    {begin walk | merge data ({* (:a {* (:s 1)} )}) }x{_a.s}{end walk}
      x1

    {merge data ({* (:a {* (:s 1)} )}) block "{_a.s}"}
      1


Tests for falseness
  Empty strings, lists, and keyed lists are false, as is the number zero and unset vars.
    {"" | then :true else :false}
      false
    {() | then :true else :false}
      false
    {* () | then :true else :false}
      false
    {0 | then :true else :false}
      false
    {$g | then :true else :false}
      false
    {_g | then :true else :false}
      false
    {__ | then :true else :false}
      false
// TODO: make a hash, then remove the key (the above errors, because you have to have at least two values to pair)
// OOOOOOR... allow empty hashes (and one-val'd hashes), which make an empty fillable object thing.

  The string "0", whitespace, and stuff with things in them are true.
    {" " | then :true else :false}
      true
    {"0" | then :true else :false}
      true
    {($false) | then :true else :false}
      true
    {(0) | then :true else :false}
      true
    {* (0 $false) | then :true else :false}
      true
(implicit coercion between data types is usually evil, but Daimio has no polymorphism)

0, "", and () are the (identity / falsy) values in their respective classes.
coercion mostly does exactly what you'd want, as long as you don't double jump.
list -> 0
list -> JSON
number -> "number"
number -> (number)
string -> parseFloat(string)
string -> (string)

coercion is easy: no polymorphism => no confusion
  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | add 0}
    [0,1,0,1,0,0,0,0,0]

  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | if __ then 1 else 0}"}
    [0,1,0,1,1,1,0,1,1]

  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | string lowercase}"}
    ["0","1","","1","x","[]","[]","[1]","[[],[]]"]

  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | map block "{__}" }"}
    [[0],[1],[""],["1"],["x"],["[]"],[],[1],[[],[]]]

falsy falsers:
  {0}
    0
  {(0 0)}
    [0,0]
  {0 | __}
    0



Tests for pass-by-value. Changing a Daimio variable shouldn't change other variables, either in Daimio or in the base language.
  {(1 2 3 4) | >$x}
    [1,2,3,4]
  {$x | >$y}
    [1,2,3,4]
  {$x | poke 5 | >$x}
    [1,2,3,4,5]
  {$x} x {$y}
    [1,2,3,4,5] x [1,2,3,4]

Tests for self-reference. PBV cures these ills.
Poke should be returning the poked value, not the whole tree. (BUG)
  {* (:a 1 :b 2) | >$x | >$x.c}
    {"a":1,"b":2}
  {$x | >$x.d}
    {"a":1,"b":2,"c":{"a":1,"b":2}}
  {$x}
    {"a":1,"b":2,"c":{"a":1,"b":2},"d":{"a":1,"b":2,"c":{"a":1,"b":2}}}

  {(1 2 3) | >$x | poke $x | >$x}
    [1,2,3,[1,2,3]]

Tests for list compilation:
  {"{add ($counter 1) | >$counter}" | >$countblock}
    1
  {$countblock}
    2
  {$countblock | run | $counter}
    3

Tests for bad chars
  {+foo | >$ok}

  {123 | >$_foo | "" | $_foo}

  {123 | >_foo | "" | __foo}


STRINGS

  -- internal strings containing Daimio are considered 'alive'
    - live strings are eventually processed
    - except when they're inside a list (they'll suffocate if not released)
  -- data coming from outside the processed string (db, user, etc) is 'dead'
    - dead strings won't ever be processed
  -- any string without daimio code is always dead
  -- the 'quote' command kills a live string
  -- the 'unquote' command resuscitates a dead string
  -- you can put a live string in a variable, and reference it many different times; each will be processed according to the customs of its time
  -- the 'run' command fully processes (and kills) a live string
  -- string transformation commands (of any kind) kill live strings

when a block is coerced into a string it isn't processed
  {"{:hello} world" | string split on " "}
    ["{:hello}","world"]

so you have to do that manually
  {"{:hello} world" | run | string split on " "}
    ["hello","world"]
(any string containing valid Daimio code is converted to a block at compile time)
(strings from the outside world aren't compiled unless you explicitly request it)


Strings from foreign sources (db, user input, etc) aren't processed unless explicitly instructed. Also, any string transformations taint the source string, coercing it from live code into a normal string.

  For reference, this is how you immediately run tainted strings:
    {:z | >$z | "x{$key}y{$z}" | string transform from "{$key}" to 123}
      x123y{$z}
    {:z | >$z | "x{$key}y{$z}" | string transform from "{$key}" to 123 | unquote | run}
      x123yz

  And this is how you prep them for running eventually. (Here 'eventually' comes at the end of the pipeline.)
    {:z | >$z | "x{$key}y{$z}" | string transform from "{$key}" to 123 | unquote}
      x123yz

  And these are all transformed, hence tainted:
    {"KEY" | >$key}
      KEY
    {"x{$key}y{$z}" | string transform from "{$key}" to 123}
      x123y{$z}
    {begin block | >$block | string transform from "{$key}" to 123}x{$key}y{$z}{end block} {// from a block}
      x123y{$z}
    {$block | string transform from "{$key}" to 123}
      x123y{$z}
    {"x{$key}y{$z}" | >$x | string transform from "{$key}" to 123} {// from a string}
      x123y{$z}
    {string transform value "x{$key}y{$z}" from "{$key}" to 123}
      x123y{$z}
    {string transform value {"x{$key}y{$z}"} from "{$key}" to 123}
      x123y{$z}
    {string transform value {{"x{$key}y{$z}"}} from "{$key}" to 123}
      x123y{$z}
    {string transform value $x from "{$key}" to 123}
      x123y{$z}
    {string transform value {$x} from "{$key}" to 123}
      x123y{$z}
    {string transform value {{$x}} from "{$key}" to 123}
      x123y{$z}
    {string transform value $block from "{$key}" to 123}
      x123y{$z}
    {string transform value {$block} from "{$key}" to 123}
      x123y{$z}
    {string transform value {{$block}} from "{$key}" to 123}
      x123y{$z}

  ensure we can fully process if necessary
    {string transform value {$x | run} from "{$key}" to 123}
      xKEYyz
    {string transform value {$block | run} from "{$key}" to 123}
      xKEYyz

  ensure we can also access it as a function
    {"x{_key}y{$z}" | each data (1 2)}
      x0yzx1yz
    {begin block | >$block | each data (1 2)}x{_key}y{$z}{end block}
      x0yzx1yz
    {$block | each data (1 2)}
      x0yzx1yz
    {"x{_key}y{$z}" | >$x | each data (1 2)} {// as a var}
      x0yzx1yz
    {"x{_key}y{$z}" | >$x1 | each data (1 2)} {// var via pipe}
      x0yzx1yz
    {each block "x{_key}y{$z}" data (1 2)}
      x0yzx1yz
    {each block {"x{_key}y{$z}"} data (1 2)}
      x0yzx1yz
    {each block {{"x{_key}y{$z}"}} data (1 2)}
      x0yzx1yz
    {each block $x data (1 2)}
      x0yzx1yz
    {each block {$x} data (1 2)}
      x0yzx1yz
    {each block {{$x}} data (1 2)}
      x0yzx1yz
    {each block $block data (1 2)}
      x0yzx1yz
    {each block {$block} data (1 2)}
      x0yzx1yz
    {each block {{$block}} data (1 2)}
      x0yzx1yz


// other stuff

{:dann | >$name}
  dann

Quoting a string passes the Daimio through unscathed.
  {"hi {$name}" | quote}
    hi {$name}

Additional braces are irrelevant. (Internal braces are merely for grouping.)
  {{"hi {$name}"} | quote}
    hi {$name}

Running the Daimio first changes the output.
  {"hi {$name}" | run | quote}
    hi dann

  {{"hi {$name}" | run} | quote}
    hi dann

The quote command also works on lists.
  {"hi {$name}" | string split on " " | quote}
    ["hi","{$name}"]



---> inside a parameter, braces around quotes are redundant.

{123 | >$foo}
123

{"{$foo} ~" | >$string_foo}
123 ~

{ {"~ {$foo}"} | >$run_foo}
~ 123

{$string_foo}{$run_foo}
123 ~~ 123

{:asdf | >$foo}
asdf

{$string_foo}{$run_foo}
asdf ~~ asdf


Here's the use cases, from the user's perspective:
{123 | >$foo}
  123

- I put a simple string in, I want the same string out.
  {"simple"}
    simple
  {begin x}blockguts{end x}
    blockguts
  {begin x | >$x | $x}asdf{end x}
    asdf

- I put a simple string in, do some regex substitution, and get the evolved string out.
  {string transform value "asdf" from "d" to "x"}
    asxf
  {string transform value "asdf" from "/[d]/" to "x"}
    asxf
  {string transform value "asdfdd" from "/[d]/" to "x"}
    asxfdd
  {string transform value "asdfdd" from "/[d]/g" to "x"}
    asxfxx

- transformations can accept a block. it is run for each match, replacing the contents with its output.
  {"food mood wood" | string transform from "/oo/g" to "{__ | string uppercase}"}
    fOOd mOOd wOOd

- I put a Daimio string in with escape characters, and want the raw Daimio string out.
  ---- WELL ACTUALLY: Daimio doesn't have escape characters anymore.
  {// {"\{asdf\}"} //}


- I pass/pipe a Daimio string in to the quote command, and want the raw Daimio string out.
  {process quote value "{$asdf}"}
    {$asdf}
  {"{$asdf}" | process quote}
    {$asdf}

- I put a Daimio string in, and want the processed output.
  {"{$foo}x"}
    123x

- I put a Daimio string in, get the processed output, and put that in a variable.
  {"{$foo}x" | run | >$x}
    123x
  {$x}
    123x
  {321 | >$foo}
    321
  {$x}
    123x

- I put a Daimio string in to a variable, then invoke that variable later (getting the processed output in each new context).
  {"{$foo}x" | >$x}
    321x
  {$x}
    321x
  {123 | >$foo}
    123
  {$x}
    123x

- I put a Daimio string in to a variable, then use that variable as a template for merging.
  {"~{__}~" | >$z}
    ~~
  {each block $z data (1 2 3)}
    ~1~~2~~3~

- I pass a Daimio string in as a template for merging.
  {each block "~{__}~" data (1 2 3)}
    ~1~~2~~3~

- I create a Daimio string, do substitutions on it, and then pass it in as a template for merging.
-----> this one is weird, because the inner command should *fully* process the string.
---- note the 'unquote' command, which processes the tainted strings.
  {each block {string transform value "~{__}~" from "~" to "!" | unquote} data (1 2 3)}
    !1!!2!!3!
  {string transform value "~{__}~" from "~" to "!" | unquote | each data (1 2 3)}
    !1!!2!!3!
  {"~{__}~" | string transform from "~" to "!" | unquote | each data (1 2 3)}
    !1!!2!!3!

- ensure all strings get fully processed
  {"{"{"{1} 2"} 3"} 4"}
    1 2 3 4

  {{"{"{"{1} 2"} 3"} 4"}}
    1 2 3 4

  {"{"{"{1} 2"} 3"} 4" | quote}
    {"{"{1} 2"} 3"} 4





BLOCK APPLICATION AND ORDER OF OPERATIONS

  Inside the list we're evaluating {2 | >$a} before the next call to $a
    {1 | >$a | ( $a {2 | >$a} $a )}
      [1,2,2]

  Same here -- the braces around $a have no effect
    {2 | >$a | ( {$a} {4 | >$a} {$a} )}
      [2,4,4]

  Block processing comes later, or sometimes not at all
    {4 | >$a | ( "{$a}" {8 | >$a} {$a} ) | unquote}
      ["8",8,8]
    {4 | >$a | ( "{$a}" {8 | >$a} {$a} )}
      ["{$a}",8,8]

  Set up a block that changes the value in $value
    {:x | >$x || :y | >$y || :xylo | >$value}
      xylo
    {begin x_to_y | >$x_to_y}{string transform value $value from $x to $y}{end x_to_y}
      yylo
    {:xyzzy | >$value || $x_to_y}
      yyzzy

  Anything we apply it to is stringified (and blocks in lists aren't executed by default)
    {"{(:tex :mex)}" | >$value | ($value $x_to_y {$value | run} {$x_to_y | run})}
      ["{(:tex :mex)}","{string transform value $value from $x to $y}",["tex","mex"],"{(:tey :mey)}"]

  Even itself
    {$x_to_y | >$value | $x_to_y | run}
      {string transform value $value from $y to $y}

  But we can explicitly unquote it
// THINK: what are we really doing here? this is completely demented.
//    {$x_to_y | >$value | $x_to_y | run | >y_to_y | "/[y{__}]/" | >$y | _y_to_y | unquote | run}
//      asdlkfjasldkfj


  alternately:
    {$x_to_y | string transform from :x to :z | string transform from :y to :x | string transform from :z to :y | >$y_to_x}
      {string transform value $value from $y to $x}

    {"axy fix hex hoax" | >$value || :x | >$x || :y | >$y || $y_to_x}
      {string transform value $value from $y to $x}


  run the process instantly
    {"axy fix hex hoax" | >$value || :x | >$x || :y | >$y || $y_to_x | unquote | run}
      axx fix hex hoax

    {$y_to_x | unquote | run | quote}
      axx fix hex hoax


  unquote the string to create a block
    {$y_to_x | unquote | >$y_to_x_block}
      axx fix hex hoax

    {$y_to_x | unquote | quote}
      {string transform value $value from $y to $x}

    {"axy faxy foxy" | >$value || $y_to_x_block}
      axx faxx foxx

  Let's examine strings in strings in braces etc
    {:z | >$z | :a | >$y}
      a

  test for fully processing each nested block
    {"1 {$z} {"2 {$z} {"3 {$z}"}"}"}
      1 z 2 z 3 z

  this test shows that we process elements in the outer block before processing the inner block -- i.e., the last $y is processed before the earlier ones.
    {"1 {"{$y} 2 {$z | >$y} 3"} {$y}"}
      1 a 2 z 3 a

  this time we're explicitly running the inner block
    {"1 {"{$y} 2 {:x | >$y} 3" | run} {$y}"}
      1 z 2 x 3 x

  testing order of operations.
    {1 | >$x | ({"{$x}" | >$asdf} "zxcv" {"{$x}"} $asdf) | string join on " "}
      {$x} zxcv {$x} {$x}
    {1 | >$x | ({"{$x}" | >$asdf} "zxcv" {"{$x}"} $asdf) | string join on " " | unquote}
      1 zxcv 1 1

  notice that the block inside the list isn't processed until after the pipelines in the list.
    {1 | >$x | "{$x}dog" | >$asdf | ($asdf {8 | >$x} $asdf) | string join on " "}
      {$x}dog 8 {$x}dog
    {1 | >$x | "{$x}dog" | >$asdf | ($asdf {8 | >$x} $asdf) | string join on " " | unquote}
      8dog 8 8dog
    {1 | >$x | "{$x}dog" | >$asdf | ($asdf "{8 | >$x}" $asdf) | string join on " " | unquote}
      1dog 8 8dog

  When the list is processed by {string join} it quotes any blocks.
    {:bebop | >$genre | ($genre {:modal | >$genre} $genre {"{"渋谷系" | >$genre}"} $genre) | string join on " {$genre} "}
      bebop {$genre} modal {$genre} modal {$genre} {"渋谷系" | >$genre} {$genre} modal

  Unquoting after finishes the processing.
    {:bebop | >$genre | ($genre {:modal | >$genre} $genre {"{"渋谷系" | >$genre}"} $genre) | string join on " {$genre} " | unquote}
      bebop modal modal modal modal modal 渋谷系 渋谷系 modal

  Blocks inside vars suffer the same fate.
    {({"{$x}dog" | >$asdf} $asdf {8 | >$x} $asdf) | string join on " {$x} "}
      {$x}dog {$x} {$x}dog {$x} 8 {$x} {$x}dog
    {1 | >$x | ({"{$x}dog" | >$asdf} $asdf {8 | >$x} $asdf) | string join on " {$x} " | unquote}
      8dog 8 8dog 8 8 8 8dog




  // next up: coffee, jazz, obscure sports, obscure holidays, autological (anti, homo, etc), deep sea creatures, church/kleene/turing etc, russell/conway/tarski etc, singularity/bingularity/tringularity, murray gell-mann, pynchon&co, funny parts of the eye, shakespearean neologisms, joycean neologisms, carrollean neologisms, other biology, music theory, strange foods, topological space organization (T1), the lambda cube [posets&dags], ways of making numbers, mermaid > duck > bunny > manatee,



  {(:One {"1 2 3" | string split on " "} :Two)}
    ["One",["1","2","3"],"Two"]

  {begin foo | >$foo | $foo}One{"1 2 3" | string split on " "}Two{end foo}
    One["1","2","3"]Two

  {begin foo | >$foo ||}One{"1 2 3" | string split on " "}Two{end foo}{$foo}
    One["1","2","3"]Two

  {"{:asdf}"} bax
    asdf bax

  {"{:asdf}" | quote} bax
    {:asdf} bax

  {"{"{:asdf}"} bax"}
    asdf bax

  {"{"{:asdf}"} bax" | quote}
    {"{:asdf}"} bax

  {"{"{:asdf}" | quote} bax"}
    {:asdf} bax

  {"{"{:asdf}"} bax" | quote | unquote}
    asdf bax

  {(1 {:asdf} 3)}
    [1,"asdf",3]

  {(1 {"{:asdf}"} 3)}
    [1,"{:asdf}",3]

  {(1 "{:asdf}" 3)}
    [1,"{:asdf}",3]

  {(1 {:asdf | string split} 3)}
    [1,["a","s","d","f"],3]

this becomes a string of a list of a string because of the quotes
  {(1 "{:asdf | string split}" 3)}
    [1,"{:asdf | string split}",3]

  {(1 {"{:asdf | string split}"} 3)}
    [1,"{:asdf | string split}",3]

  {"{(1 "{:asdf | string split}" 3)} bax"}
    [1,"{:asdf | string split}",3] bax


Tests for command + string
  {foo asdf} bax
    bax

  {string split value "foo bat" on " "} baz
    ["foo","bat"] baz

Basic blocks and vars:
  {begin foo | string split on " " | grep :h}hello how are you?{end foo}
    ["hello","how"]

  {begin foo | >$foo ||}hello{end foo}{$foo | grep :llo}
    ["hello"]

  {(:foo :buzz :bizz :bazz) | >$x | grep :zz value $x}
    ["buzz","bizz","bazz"]

  {begin foo | string split on " " | >$x ||}hello hey zebra squid{end foo}{$x | grep :h}
    ["hello","hey"]




BASIC SYNTAX TESTS

  sundry null-value checks
    {}

    {{}}

    {|}

    {||}

    { }

    {abra}

    {""}

  comments and brace matching
    {/a}y
      y
    {/a {b} c}y
      y
    {/a {b{c | d}e} f}y
      y
    {/a {b} {c} d}y
      y
    {/a {b{c}d} {e | f} g}y
      y

  single slash removes one segment; double slash kills everything after.
    {/a | 123}y
      123y
    {122 / a | add 1}y
      123y
    {//a | 123}y
      y
    {123 //a | 123}y
      123y

  tests for quote and brace matching
    {* ("bar" "{$x}") | >$x}
      {"bar":"{$x}"}

    {* ("one" "local" "two" "surprise local!" "foo" "bar" "yum" $x) | >$x}
      {"one":"local","two":"surprise local!","foo":"bar","yum":{"bar":"{$x}"}}

    {{"ok"}} y
      ok y
    {"ok {$x.one}"} y
      ok local y
    {"{"ok"} {$x.one}"} y
      ok local y
    {"{"ok {$x.one}"} {$x.one}"} y
      ok local local y
    {"{"ok {"{$x.one}"}"} {$x.one}"} y
      ok local local y
    {"{"ok {"{$x.one} {$x.two}"}"} {$x.one}"} y
      ok local surprise local! local y
    {"{"ok {"{$x.one} {$x.two} {$x.bogus.foo}"}"} {$x.one}"} y
      ok local surprise local!  local y

  The value in $x is "flat" -- it doesn't contain a pointer to itself. It does contain a block that points to $x, though, and you can explicitly unquote that block and reach inside it.
    {$x.yum}
      {"bar":"{$x}"}
    {$x.yum.bar}
      {$x}
    {$x.yum.bar | unquote}
      {"one":"local","two":"surprise local!","foo":"bar","yum":{"bar":"{$x}"}}
    {$x.yum.bar | unquote | run | __.yum.bar}
      {$x}
    {$x.yum.bar | unquote | run | __.yum.bar | unquote}
      {"one":"local","two":"surprise local!","foo":"bar","yum":{"bar":"{$x}"}}

  quote, unquote, and run:
    {"{__ | add 1}" | map data (1 2)}
      [2,3]

    {"{__ | add 11}" | quote}
      {__ | add 11}

    {"{__ | add 11}" | quote | map data (1 2)}
      ["{__ | add 11}","{__ | add 11}"]

    {"{__ | add 1}" | unquote // does nothing}
      1

    {"{__ | add 1}" | quote | unquote}
      1

    {"{__ | add 1}" | quote | unquote | map data (1 2)}
      [2,3]



<div class="page-header" id="id_app_numbers">
  <h2>Numbers</h2>
</div>

  We use IEEE floating point under the hood (same as JS, among other languages), which has its pros and wats.

    Naturals:
      {0}
        0
      {1}
        1
      {65535}
        65535

    Floats:
      {3.141591}
        3.141591
      {4.669200}
        4.6692
      {2.685451}
        2.685451

    Negatives:
      {-0}
        0
      {-65535}
        -65535
      {-3.14159}
        -3.14159

    Exponential (using this notation is not recommended):
      {3e10}
        30000000000
      {3e+10}
        30000000000
      {3e-3}
        0.003
      {3e80}
        3e+80

    Some IEEE implications:
      {11111111111111111111111}
        1.1111111111111111e+22
      {3.141592653589793238}
        3.141592653589793
      {1e53 | add 1}
        1e+53

    Hex happens to convert, because we're using JS coercion under the hood. Don't use this, don't rely on it, don't try it at home.
      {0x777}
        1911

    Octal doesn't even work to begin with.
      {0777}
        777


<div class="page-header" id="id_app_known">
  <h2>Known Bugs</h2>
</div>

    Keyed lists with positive integer keys are not ordered correctly. All keyed lists should be ordered by insertion order by default, and retain their sort order if sorted. Even once this is fixed imports from JSON will still have this problem (for the initial import, not once sorted) unless we write our own JSON parser.
      {* (:xyz :z 10 :z 3 :z 1 :z :a :z)}
        {"xyz":"z","10":"z","3":"z","1":"z","a":"z"}
      {* (:xyz :9z 10 :8z 3 :6z 1 :4z :a :2z) | sort}
        {"a":"2z","x1":"4z","x3":"6z","x10":"8z","xyz":"9z"}

    Blocks inside lists that get cloned become quoted. This might be considered a *feature* in some circles, but it makes a fairly valid use case (sticking blocks inside a keyed list as quasi-object methods) more difficult.
      {("foo" "{2 | add 7}") | map block "{__ | run}"}
        ["foo",9]
      {("foo" "{2 | add 7}") | >$foo | map block "{__ | run}"}
        ["foo",9]
      {("foo" "{2 | add 7}") | >$foo || $foo | map block "{__ | run}"}
        ["foo",9]

    Most list commands eat keys:
      sort, reverse, etc

    The {logic is} command doesn't coerce internally
      {"2" | is in (2) | then :true else :false}
        true

    Two problems here with peek/poke
    1. you shouldn't have to preload with x:1 (BUG)
    2. setting a subitem returns the full spacevar, not just the subitem value (BUG)
      {* (:x 1) | >$hash}
        {"x":1}

      {:ash | >$hash.{"two"}} {$hash}
        ash {"x":1,"two":"ash"}

      {:ash | >$hash.{"two"}.monkey.flu} {$hash}
        ash {"x":1,"two":{"monkey":{"flu":"ash"}}}

      {:ash | >$hash.{"two"}.monkey.{(:x :y :z)}.flu} {$hash}
        ash {"x":1,"two":{"monkey":{"x":{"flu":"ash"},"y":{"flu":"ash"},"z":{"flu":"ash"}}}}

    Double pipe leaks values if next segment is an error
      {123 | >foo || __foo}

    Pipeline vars shouldn't be mutated by mutating commands:
      {(1 2) | >x | list poke value 39 | _x | add}
        3

    Unfilled vars and non-existent params are different. 
    They should probably behave the same for pipeline vars and space vars, but don't. 
    The reason they don't make sense if you know the underlying theory, but it's an abstraction leak...
      {5 | >foo | (1 2 3) | map block "{__ | subtract _o}"}
        [1,2,3]
      {5 | >foo | (1 2 3) | map block "{__ | subtract $o}"}
        [1,2,3]
      {5 | >foo | (1 2 3) | map block "{__ | range $o}"}
        [[],[],[]]
      {5 | >foo | (1 2 3) | map block "{__ | range _o}"}
        [[],[],[]]
      {(1 2 3) | subtract _zxcv}  {// subtraction and division are weird for this internally //}
        [1,2,3]
      {(1 2 3) | subtract $jklj}
        [1,2,3]
      {9 | range _asdf}
        []
      {9 | range $asdf}
        []


    Weird quote results due to synonymization. The weirdness is beget by equivalent blocks above.
      {"{123}" | quote}
        {123}

      {"{777}" | quote}
        {777}

      {"{xxx}" | quote}
        {xxx}

    // {"{_x | run with {* (:x _x)} }" | >x | run with {* (:x _x)} }
    // (leads to immediate stack overflow... maybe that's an ok solution for infinite recursion? just let it blow up?)

    // also this: {"{__ | run}" | run with __}
