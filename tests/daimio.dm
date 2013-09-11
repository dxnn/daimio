WELCOME TO DAIMIO

This document serves as a primer, tutorial, specification, test suite and repl for the Daimio language.

Daimio is a framework for building programmable web applications, as well as the dataflow language used within that framework. 

On this page all Daimio statements are wrapped in braces. Any line which begins with an open brace will be processed as a Daimio statement, and the following line indicates the desired outcome. Green means it passed, red indicates failure. All output is converted to JSON for display.

REPL notes: click code below to put it in the repl. use space or enter to activate autocomplete if the menu is up. start with a '{' when writing daimio commands. use up and down to cycle through your history. history is saved between sessions. use esc to toggle autocomplete on or off. 

---- Daimio Primer ----

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
  
  double underscore is magical
    {21 | add __}
      42
    {21 | add 21 to __}
      42
    {21 | add __ to 21}
      42
    {21 | add __ to __}
      42

  more magic
    {21 | (__ __) | add}
      42
    {20 | (__ __) | add 1 | add}
      42
    {10 | (__ __) | add __ | add 1 | add}
      42

  pipe values can be labeled for later use
    {8 | >eight | (_eight _eight 2) | add _eight | add}
      42
    
  (so pipelines are actually DAGs)
  (those labels are only valid inside the block)
  (and can only be set once)
  
  
  
  a block contains some Daimio code
    {begin foo}{21 | add 21}{end foo}
      42
    
  or a string [inlined for the test harness]
    [if you put in linebreaks, the output has them also, and then things get weird]
    {begin foo}some long multiline string{end foo}
      some long multiline string
    
  or both
    {begin block}
      {:hello} world
    {end block}
      hello world
  
  which is about the same as
    {( {:hello} " world" ) | join}
      hello world
  
  (except with some extra delayed-execution magic)
  
  pipe a block to capture its value
    {begin block | each data 1} 
      {:hello} world 
    {end block}
      hello world
    
  inline blocks look a bit like strings
    {"{:hello} world" | each data 1}
      hello world
    {1 | each block "{:hello} world"}
      hello world
    

  __in is the process input
    {( 1 2 3 ) | map block "{__in | add 1}"}
      [2,3,4]
  
  as sugar __ defaults to __in at the top of a block
    {( 1 2 3 ) | map block "{__ | add 1}"}
      [2,3,4]
  
  but not anywhere else
    {( 1 2 3 ) | map block "{__ | add 5 | (__ __in)}"}
      [[6,1],[7,2],[8,3]]
  
      
  double pipe prevents implicit connection
    {21 | add __}
      42
    {42 || add __}
      42
    {21 || add 21 to __}
      42
  
  
  a space var -- mutable, stores state, encapsulated in a single space
  (this test framework does everything in one space)
    {( 1 2 3 ) | $>foo}
      [1,2,3]
    {$foo | add $foo}
      [2,4,6]
  
  a keyed list (converted to JSON on output)
    {* (:a 1 :b 2 :c 3)}
      {"a":1,"b":2,"c":3}
    
  peek at internal values
    {* (:a 1 :b 2 :c 3) | list peek path :b}
      2
    {(2 4 6) | list peek path "#1"}
      2
    {* (:a (1 2) :b (2 3) :c (3 4)) | list peek path (:b "#1")}
      2

  sugar for peek
    {(1 2 3) | __.#2}
      2
    {* (:a (1 2) :b (2 3) :c (3 4)) | __.b.#1}
      2
    


[todo: appendix this]
when a block is coerced into a string it isn't processed
  {"{:hello} world" | string split on " "}
    ["{:hello}","world"]

so you have to do that manually 
  {"{:hello} world" | run | string split on " "}
    ["hello","world"]
(any string containing valid Daimio code is converted to a block at compile time)
(strings from the outside world aren't compiled unless you explicitly request it)



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

  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | then 1 else 0}"}
    [0,1,0,1,1,1,0,1,1]
  
  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | string lowercase}"}
    ["0","1","","1","x","[]","[]","[1]","[[],[]]"]

  {( 0 1 "" "1" "x" "[]" () (1) (() ()) ) | map block "{__ | map block "{__}" }"}
    [[0],[1],[""],["1"],["x"],["[]"],[],[1],[[],[]]]







<!--

This document servers as a primer, tutorial, reference, test suite and specification for future implementations of the Daimio language.

Daimio is a thin, narrow, safe language designed as a container for your application's functionality, to allow scripting and templating by people who aren't you. It's thin in the sense that the base language is right under the surface, narrow in that it only has five elements (strings, numbers, lists, commands, and pipes), and safe as in untrusted code can be run on your server.

All Daimio commands are wrapped in braces. Within this test document the line directly beneath a Daimio command is the expected output, and a test will fail if it isn't matched.

At one point in the development of Daimio I managed to reduce the entire language to numbers, strings, and commands. Blocks, pipes, and variables were all parse-equivalent to commands: string join, process pipe and variable get, respectively. I've since brought those features further down into the parsing/interpreting process for efficiency's sake, but there's nothing in the language definition itself that would require that, and in fact it's a fairly quick way to get Daimio running on another platform.

// TODO:
 - have an 'event' tag for commands, which pushes the command (plus date, user, etc) into the history: this can be replayed later to rebuild the entire application state. Only things that record their own history (audit answers, maybe) and things that don't change state (find commands) should not have this. Could record it like {house paint hue 128 saturation 100} ==> {h: "house", m: "paint", p: {hue: 128, saturation: 100}} ... [can imported commands have tags? like, for marking a sequence of actions as a 'composite' in some sense, or like a transaction... because you might add a new thing, with a lot of content, but each item of content is added as a separate command. so you might want to 'cluster' that somehow...]
 - blessing happens at the content level, probably... which makes content pretty important.
 
 To notebook: use space+key as meta, pointless programming (no variables), help dictionary for keybindings (emacs), more recursive combinators in daimio, monads in daimio for guarding variables etc?, virtual edge when you click a port that tracks your mouse, ...
 
Keyed lists: the position of an item in the list is not a key. Items can always be retrieved by positional index. Items can also be keyed. Sorting, grouping, and other such operations preserve keys. Remember to use #N to access by position. @foo.{"#{pos}"} works also. @foo.(:#2 :#4 :alpha 7) also works, though this also means you can never key a list with '#N' where N is an integer, so... actually, that's probably fine.

Schema: a list of collections and the mechanical fields (ie non-attr, non-perm) fields inside them. used by the mongo layer to do automatic type conversion. maybe used to verify validity of objects. also for data migrations (much easier to see if it's all in one place, and may even be possible to automate sometimes). prevents weird string->int->string casting bugs. so a pretty convenient thing for larger apps. might not be mandatory... but really, with all soft data in attrs, there's almost no reason not to always use it: you have to have a schema somewhere, either scattered through your code or in one place. so stick it one place.

orthogonal setters vs unified add: always use empty add + validator. data schema may help with that.

/ {let :plural on :value be "{value | is like :1 | not | then :s}"}
let -> daimio import into :etc key 
plus aliasing...
/ {@count | plural}

// or... {let :plural be "{__ | eq :1 | not | then :s}"}
// (what about pipeline var collisions?)
// {let :pp be "{__ | eq :1 | >foo | not | then :s else _foo}"}
// {44 | >foo | pp} 
// then... the inner _foo and the outer _foo are two totally different things, right? yeah. ok!

// what about:

/ {123 | >foo | add 1 | $$>foo | add _foo | $$>foo | add $foo}
just to *really* reinforce the ugliness of space vars and the niceness of pipeline vars?
[every time someone complains about this i add another dollar sign]

// what about:

/ {begin | >foo}
/     (:single :pipeline :form)
/   | join on " "
/   | split on "i"
/ {end}

hmmmm. it's a little quirky... is it better than:
/ {>foo "{
/     (:single :pipeline :form)
/   | join on " "
/   | split on "i"
/ }"}
?
not really. but that {>foo "..."} syntax is really weird. maybe don't do that.


did i mention that fancy handlers return a function that takes into account the local scope, var name/path, etc and that a call to this fancy function is placed in the block but then it could be pre-run in the stack? 

/ {(1 2 3) | >(:a :b :c)}
/ {(1 2 3 4 5) | > (:first "..." :last)}
/ {(1 2 3 4 5) | > (:head "...tail")}
---- look up more destructuring examples



maybe you can bind something to errors in a space, so if ERROR is triggered it sort of inserts some code into the pipeline right there? like you could send a message to a different space, or write it into the console. maybe you can tap into the ERRORS var -- oh, maybe that's at the Space level. and you can check it to see if anything has changed, or something.

pattern matching over trees... i have a tree of this shape, and if you find it while you're DFSing you should do X. like only leaves, or only branches, or only branches whose children are all leaves. that kind of thing. 



Tests in Daimio:
- are end-to-end integration tests
- unit test your methods
- serve as documentation
- run on client and server
- serve as scaffolding for building models
  [write Daimio first]
- can be tested for coverage
- 


-->



<!--

/       Variable Cases:
/       
/       1. Pipeline vars
/         {(1 2 3) | _>foo | (_foo _foo)}
/          - convert to wiring by compiler
/          - SSA (re-setting throws compile error)
/       
/       2. Space vars
/         {(1 2 3) | $>foo | ($foo $foo) | $>foo}
/          - shared by different stations and blocks within the space
/          - encapsulated by space boundaries
/          - can be reset to a different value
/          - persist through execution lifetime
/          
/       3. __pipe, AKA __
/         {(1 2 3) | (__ __)}
/          - value of previous segment
/          - compiled down to wiring
/       
/       4. __in, AKA __
/         {__ | (__ __)}
/         {(1 2 3) | map block "{__ | add 1}"}
/          - points to process input
/          - compiled down to wiring
/          - only applies to "first segment of a block"
/          
/       5. injected vars
/         {(1 2 3) | map block "{_value | add 1}"}
/         
/         { ( {* (:a 1 :b 2)} 
/             {* (:a 3 :b 4)} ) 
/         | merge block "{_a | add _b}"}
/         
/          - merge, each, reduce etc need to provide more than one input value
/          - know ahead of time? 
/          - conflicts with imported?
/         
/       6. imported vars -:::: what about "scoped vars"?
/         {5 | _>a | (1 2 3) | map block "{_value | add *a}" with {* (:a _a :b _a)}}
/         - pulled into a block from the local scope
/       

------ conclusions:

- Use $ for mutable vars (space) and _ for immutable vars (everything else)
- Add __in but keep using __ as an alias [YAGNI?]
- Block vs pipeline is really confusing scope-wise... this might be a terminology problem, though (because 'pipeline' vars are actually block-scoped, as there are no real 'pipeline's per-se)
- merge is bad because it injects random vars, but maybe that's ok... or get rid of it.
- non-merge injected/scoped/pipeline var collisions are compile time errors -- that's handy
- denote injected vars in commands always (so drop merge?)
- make scoping really really easy to understand
- aggressively eliminate boilerplate

------ to-dos:

- add "scoped vars" via 'with' param to each, reduce, map, merge, etc.
- denote injected vars on those commands
- add {list poke} for $>foo.x.y.z
-- add __in, just because we can
-- kill __* other than __in (parse error)
-- switch to >foo instead of _>foo
- {list peek} handles $foo.{_x}.{_y} (the dots are just sugar)

 

- ensure you can save and load data from the repl over multiple sessions (like bash's history)

-->






:::The Five Elements of Daimio:::

Element 1: Numbers

  Wrap a number in braces and you've got a Daimio number. We use IEEE floating point under the hood (same as JS, among other languages), which has its pros and wats. [move all that to an appendectomy]
  Note that while hex number formating works, it isn't required in the spec. Avoid it where possible.

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
    
    IEEE implications:
      {11111111111111111111111}
        1.1111111111111111e+22
      {3.141592653589793238}
        3.141592653589793
  
    Exponential notation:
      {3e10}
        30000000000
      {3e+10}
        30000000000
      {3e-3}
        0.003
      {3e80}
        3e+80
    
    Hex converts: 
      {0x777}
        1911
    Octal doesn't:
      {0777}
        777
    

Element 2: Strings

  Primitive strings are quite simple. We'll see a way of handling complicated strings (with embedded quotes, e.g.) later.
  
    Strings are enclosed in double-quotes:
      {"hello world"}
        hello world
    A single word can be colon-quoted:
      {:xyzzy}
        xyzzy


Element 3: Lists
  
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
  

Element 4: Commands

  The essence of Daimio is commands. Every command has a model (the first word) and a function (the second).

    The simplest command would look like this:
      {fruit slice}
  
  But because we haven't published the 'fruit' model into this Daimio dialect that won't do anything.
  
  Most commands take parameters, which are named. A parameter value can be a string, a number, a list or a command. [THINK: can it be a block??]

    A slightly fancier (but still non-functional) command:
      {fruit slice with :katana}

  The following commands use models that are published by default.
  
    Join a list of strings:
      {string join value (:barbera :belvest :brioni)}
        barberabelvestbrioni
  
    With the optional 'on' parameter:
      {string join value (:barbera :belvest :brioni) on ", "}
        barbera, belvest, brioni
  
    Parameter order is arbitrary:
      {string join on " > " value (:barbera :belvest :brioni)}
        barbera > belvest > brioni
  
    We can split things, too:
      {string split value "selvedge balmoral aglet placket plimsolls" on " "}
        ["selvedge","balmoral","aglet","placket","plimsolls"]


Element 5: The pipe operator

  You can use the pipe ('|') to pass the output of one command into an input of another.
  
    Split, then join:
      {string split value "shantung weft repp slub" on " " | string join on ", "}
        shantung, weft, repp, slub
  
    Split, filter, join:
      {string split value "shantung weft repp slub" on " " | string grep on :s | string join on ", "}
        shantung, slub
  
  
  In some ways the pipe is syntactic sugar for *commands as parameter values*, though the two differ slightly in implementation. The following commands are essentially equivalent to the above pipelines.
  
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
  

:::Quick Notes:::

If you're familiar with other programming languages you'll notice that Daimio seems to be missing many basic necessities: control statements like if-then-else, loop statements, function declaration, variable assignment, and the list goes on. These facilities exist within Daimio as commands. This means that for-loops, for example, return a value (as do all commands). It also means that you can add new basic concepts to the language just by publishing new commands.


:::Sugary Snacks:::

Daimio provides some syntactic sugar for simplifying certain common operations.

Snack 1: Variables

    Set a space var like this:
      {(:one :two :three) | $>bar}
        ["one","two","three"]
      {* (:one 1 :two 2 :three 3) | $>foo}
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
  

Snack 2: Blocks

  A block encloses text. [Could be a template, or some Daimio code (or a mix). they're roughly equivalent to a string join + context + var. discuss var scope]
  
  Note that blocks no longer set variables automatically. We may include a {begin $foo}...{end $foo} form in the future to allow automatic var setting, but scope vars should be used carefully so forcing explicit setting is probably good. (We could also consider automatically setting a pipeline var, but for now explicit and simple is better.)
  
    Here's a simple block:
      {begin foo}Some text{end foo}
        Some text
  
    That just returns whatever we put in -- not particularly useful. What if we pipe it into a command?
      {begin foo | string split on " "}Some text{end foo}
        ["Some","text"]
    
    The block can also be stored as a variable:
      {begin foo | $>foo ||}Some text{end foo}{$foo}
        Some text
      {begin foo | $>foo | $foo}Some text{end foo}
        Some text

  We squelch the output of blocks that don't pipe the 'begin' statement as a convenience. Usually unpiped blocks are built as templates for later use.
  
    Using a block we've previously built:
      {$foo | string split on " "}
        ["Some","text"]
    
    Blocks can also contain Daimio:
      {begin foo | $>foo}x{_value}-{end foo}
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
      {:hey | $>value}
        hey
      {each block (:x $value {$value} "{$value}" {"{$value}"}) data (1 2)}
        ["x","hey","hey","{$value}","{$value}"]["x","hey","hey","{$value}","{$value}"]
      {each block (:x {string join value {$value}}) data (1 2 3)}
        ["x","hey"]["x","hey"]["x","hey"]
      {each block {(:x $value "-")} data (1 2 3)}
        ["x","hey","-"]["x","hey","-"]["x","hey","-"]
      {:hey | $>value}
        hey
    
    Pipeline variables, including magic pipes, are reduced prior to templatization. 
    --> don't use lists as templates!
    
    TODO: fix the double-double-underscore issue (probably by using a placeholder segment) (BUG)
      {(7 8) | each block (1 __ "{__}")}
        [1,[7,8],"{__}"][1,[7,8],"{__}"] 
        
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

Snack 3: Aliases

  Many commands have a shorter form that can be used in their place.
    
  
  Aliases work by simple substitution: if the first word of a command matches something in the alias list, it is replaced. (Here "word" is fairly liberal, and includes symbols but not whitespace.)
  
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
    

:::Quick Notes 2:::

A few small tidbits that don't fit elsewhere.

Quick 1: Comments

    Comments are like this:
      {/string join}

    This works too:
      {/{hey now}}

    You can get fancy:
      {// {hey now} //}

Quick 2: Embedded blocks

    I put a block in a block for you:
      {begin outer}qq {begin inner | add 321}123{end inner} pp {end outer}
        qq 444 pp

  (Blocks with the same name can't be nested. That would just be weird.)

Quick 3: Commands in lists

    A list can have commands in it
      {({string split value "shantung weft repp slub" on " "} 1 2 4 8)}
        [["shantung","weft","repp","slub"],1,2,4,8]

Quick 4: Quotes in braces

    If the nested quotes are in braces, you don't need to use a block:
      {string split on " " value {("inside" "here") | string join on " "}}
        ["inside","here"]
        
    Sometimes nesting quotes in braces and braces in quotes works well:
      {join {string split on " " value {"{("Much" "nesting") | string join on " "} is divinest sense" | run}} on " "}
        Much nesting is divinest sense

    But of course this is prettier
      {"{("Much" "nesting") | string join on " "} is divinest sense" | run | split on " " | join on " "}
        Much nesting is divinest sense

:::In Depth:::

We've seen the 5 elements of Daimio (three primitive types, commands, and the pipe operator). We've also seen 3 types of sugar that can be applied (variables, blocks, and aliases). Here we'll examine some of those areas in more depth.

Depth 1: Blocks and scope

  so.... blocks don't have a private scope. there's currently pipeline vars and space vars. pipeline vars are single-assignment and can bleed through blocks (but not into called subblocks). 
  
  space vars are mutable and persistent. they model state within the space. you should only use them when necessary, and maybe not even then.

    TODO: fix this section!

//    A pipeline variable created in a block goes away when that block ends:
//      {begin block ||}{123 | $>foo}{end block}{foo}
//        123
//  
//    Variables beginning with '@' are global:
//      {begin block}{123 | $>foo}{end block}{$foo}
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
//      {begin outer}{begin inner | $>inner}123{end inner}{end outer}{$inner}
//        123
//    
//    Variables created in the outermost scope (outside of any blocks) can be accessed anywhere:
//      {123 | $>x ||}{begin foo}{$x}{end foo}{$x}
//      123
//    
//    But they aren't actually globals:
//      {123 | $>x ||}{begin foo |}{456 | $>x ||}{$x}{end foo}{$x}
//      456123
//  
//  See what happened there? We overwrote the variable in the inner scope, but when the block ended that scope vanished, leaving behind the original variable value.
//  
//    Contrast that with a global:
//      {123 | $>x ||}{begin foo |}{456 | $>x ||}{$x}{end foo}{$x}
//      456456
//  
//  Changing a global changes it everywhere, regardless of scope. 
//  
//  Note: you may have heard tell of evil, unhygienic globals afflicting general purpose programming languages. Fortunately, Daimio isn't general purpose. In Daimio globals are cute and cuddly and always floss.
//  
//    Blocks establish a new variable scope:
//      {"asdf" | $>x}{begin foo}{123 | $>x || $x}{end foo}{$x}
//  
//    But variables starting with '@' are global:
//      {"asdf" | $>@x}{begin foo}{123 | $>@x || @x}{end foo}{@x}


Depth 2: Keyed lists
  TODO: this whole section needs changing to conform with the new 'list' data type.

  A keyed list (aka hash, map, hash map, dictionary, associative array, key-value store, etc etc etc) is a function that takes keys and returns values. Every list in Daimio can take keys. There's a special command for transforming an unkeyed list into a new keyed list called 'list pair'.
  
    Here is the command written out:
      {list pair data (:one :first :two :second)}
        {"one":"first","two":"second"}
      
    And in its much more common aliased form:
      {* (:one :first :two :second)}
        {"one":"first","two":"second"}
    
  As you can see, the * operator (which is really just an alias for a command) uses the first value in the list as a key, the second as its value, the third as the second key, the fourth as its value, and so on. While this seems a bit messy on a single line, with proper whitespacing it's very easy to read. 

    Lists -- including keyed lists -- are always sorted, so we can use the #N notation on them:
      {* (:one :first :two :second) | $>x || $x.#2}
        second
    
    [Integer keys in maps can mess up the sorting in the JS implementation]
  
    a list of hashes:
      {( {* (:one 1 :two 2)}  {* (:three 3 :four 4)} )}
        [{"one":1,"two":2},{"three":3,"four":4}]
        
    a nested hash:
      {* (:A {* (:one 1 :two 2)} :B {* (:three 3 :four 4)})}
        {"A":{"one":1,"two":2},"B":{"three":3,"four":4}}
  

Depth 3: Further fun with variables
  
    Dot values. You can reach inside variables in a variety of ways. Here's a list.

      A named parameter:
        {* (:one 1 :two 2 :three 3) | $>x | $x.two}
          2

      A numbered parameter (notice numbering is 1-indexed):
        {$x.#1}
          1
        {$x.#5}

      You can also go negative:
        {$x.#-2}
          2
        
        {$x.#-5}

    You can use the magic character ('__') to access the pipe value.

      ex1: single pipe
      ex2: double pipe -- both params
      ex3: param -> pipe scrape

    And back to vars:

      Reaching into a list of hashes brings back a list:
        {( {* (:one 1 :two 2)}  {* (:one 10 :two 20)} ) | __.*.one}
          [1,10]


      //  {($bar $hash) | $>bundle}
      //    alkdfj
      //  {begin block | merge block $bundle} {_one} {end block}


      ex: double dipping, like __.companies.employees

      ex: using .*. formation

      ex: using .{}. notation
      {$bundle.{$bar.one}.one | eq :1}

      // test Daimio path setting
      two problems here: 
      1. you shouldn't have to preload with x:1 (BUG)
      2. setting a subitem returns the full spacevar, not just the subitem value (BUG)

      {* (:x 1) | $>hash}
        {"x":1}

      {:ash | $>hash.{"two"}} {$hash}
        ash {"x":1,"two":"ash"}

      {:ash | $>hash.{"two"}.monkey.flu} {$hash}
        ash {"x":1,"two":{"monkey":{"flu":"ash"}}}

      {:ash | $>hash.{"two"}.monkey.{(:x :y :z)}.flu} {$hash}
        ash {"x":1,"two":{"monkey":{"x":{"flu":"ash"},"y":{"flu":"ash"},"z":{"flu":"ash"}}}}


Depth 4: Creating commands
  
Depth 5: Creating aliases

FIX ME!!!!!

//  Get all current aliases: 
//    {alias find}
//  
//  Make an alias yourself:
//    {alias add string "string join" as :join}
//
//  This time we'll include the param value. Notice we wrap it in a block first, to handle the nested quotes:
//    {begin j}string join on ", "{end j}{alias add string j as :stick}
//
//
//:::Bindings and such:::
//
//    {variable bind path :test block "{$count1 | add 1 | $>count1}"}
//      
//    {:a | $>test}
//      a
//      
//    {$count1}
//      1
//    
//  The magic var var __var takes var's val. This allows each binding to reference the value of the variable at the time it was edited, without regard for other bindings.
//    {variable bind path :test block "{$count2 | add 1 | $>count2}"}
//      
//    {:b | $>test}
//      b
//      
//    {$count1} x {$count2}
//      2 x 1
//      
//    {variable unbind path :test block "{$count1 | add 1 | $>count1}"}
//  
//    {:c | $>test}
//      c
//      
//    {$count1} x {$count2}
//      2 x 2
//    
//    {variable bind path :testx.y.z block "{$count2 | add 2 | $>count2}"}
//    
//    {:x | $>testx.y.z}
//      x
//    
//    {$count1} x {$count2}
//      2 x 4
//    
//  You can edit the bound var directly in the daimio -- infinite recursion is prevented.
//    {variable bind path :foox block "{__var.#1 | add 2 | $>foox.0}"}
//    
//    {(7 2) | $>foox}
//      [7,2]
//    
//    {$foox}
//      [9,2]
//  
//  Multiple bindings can edit the var in different ways (they all receive the original value through __var).
//    {variable bind path :foox block "{__var.#1 | add __var.#2 | $>foox.1}"}
//
//    {(7 2) | $>foox}
//      [7,2]
//    
//    {$foox}
//      [9,9]
//      
  // THINK: make a different test suite for the dom handler and interactive stuff.




SOME STUFF THAT'S HERE FOR NOW


MAGIC PIPE TESTS

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


  Rethinking Case 2. Having two different meanings of __ is probably overly complicated. I still like the idea of imagining the process input peeking in through the beginning of the pipeline, and I'd like to use that some day for things like {(1 2 3) | map "{add 1}"} but if we're going to be explicit about it why not use a different symbol? 
  [well, for one reason, some aliases have pipes in them: {(1 0 3) | map "{then :ham else :foo}"} -> (:ham :foo :ham) via front-pipes]
  maybe... maybe having ({__} {__}) freak out and do stupid things is reasonable, in the same way that other languages give syntax errors for stupid things. it's hard making a language with no real errors!
  and it's not like that construct is really that stupid -- if you really want the process input maybe that should give it to you? or... no, it's really stupid. it's inside another pipeline, so it can't be the outermost thing in the process. it should probably just return nothing, or "". Probably ("{__}" "{__}") -> ("" "") also. 
  BUT, {(1 2 3) | map "{__}"} -> (1 2 3). We really need an identity block. It's just that in the above it's getting the identity of nothing. 
  



  Case 2: access to process input. These are simple cases involving a single pipeline. Notice that the magic pipe must be in the first segment to access the process's input value. Magic pipes in later segments will reference the previous segment value.
  
    ----- thoughts on this:
    - if we made 'process input' a different symbol we wouldn't have embedded pipeline reference issues 
      - referencing the previous segment from inside a list is an important case
      - is it the only case??
    - starting a pipeline with __ is beautifully simple
      - it clearly indicates the intention of pulling in outside input
      - it demonstrates the linear nature of a pipeline: one thing in, one thing out
      - we lose this if we allow references inside a pipeline (oh we're doing that already oh dear)
    - the block case with multiple pipelines each referencing input is important, because
      - we want those to be able to run in parallel
      - a given pipeline should work the same regardless of context
      - so we can't just rely on 'first use' of __ and alias it after
    
    so it sounds like a different symbol is in order to refer universally to the input.
    OR we do something fiddly like {__} means input if it's outermost but embedded it never does (yuck).
    //   {__ | add 1}
    //   {_in | add 1}
    //   {*in | add 1}
    //   {___ | add 1}
    
    er... if it's inside a string, it maps to '*in'.
    if it's inside a list, it maps to prevval.
    is it that simple?
    
    
    
  
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
// THINK: is this a bug or just a bad test?
//  {(1 2 3) | each block "{__ | (" " {__ | add 3} " x " {__ | add 7} " ::") | join}"}
//     4 x 8 :: 5 x 9 :: 6 x 10 ::
  
  Notes:
    To connect to the process input you must explicitly add the magic pipe to the first segment:
      {(1 2 3) | map block "{__ | add to 4}"}
        [5,6,7]
      {(1 2 3) | map block "{add to 4}" // bad}
        [4,4,4]
      {(1 2 3) | map block "{__ | add 4}"}
        [5,6,7]
      {(1 2 3) | map block "{add 4}" // bad}
        [4,4,4]
    
    
////    //The first segment of an inline pipeline also grab the process input instead of the previous segment value -- this is almost certainly not what you want. 
////THINK: how does this square off with __.foo? that essentially becomes {__ | list peek path (:foo)} and could be a param value or in a list. so {1 | ({__} {__})} should be (1 1) by that logic. what was the issue with that?
////If, while using a pipeline as a param value, you want access to the previous pipe segment's value, then you should either refactor the pipeline to do the processing beforehand (as above), or assign the value to a pipeline var.


    NEW RULES!
    - "{__}" links to process input
    - {__} links to previous value
    so: if it's in a string, it's input.
        if it's in a list or param value it's previous value.


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
  
  
  
  
falsy falsers:
  {0}
    0
  {(0 0)}
    [0,0]
  {0 | __}
    0

notes: the block execution scope isn't being given each item, and also isn't given even the first item correctly. probably need to do this global looping manually over all matches to properly support this effect... maybe two different commands or params? or just don't worry about opt yet.
  {"12 x 34" | string transform from "/\d+/g" to "{__ | add 7}"}
    19 x 41

Extra braces don't matter. extra quotes do, but are generally ok.
  {{{"{__ | add {"4"}}"}} | map data {(1 2)} }
    [5,6]
    

Tests for switch
  ham?
    {logic switch on 2 value (1 :one 2 :two 3 :three)}
      two
    
    {logic switch on {:asdf | string slice start 2} value (:as 1 :sd 2 :df 3)}
      3

Tests for blocks
  the second set should override the first one (BUG)
    {"{:foo}x" | $>xxx || 123 | $>xxx.y | $xxx}
      {y:123}
  works this way
    {"{:foo}x" | $>xxx || 123 | $>xxx.#3 | $xxx}
      ["{:foo}x",[],123]
  
  make sure we're not defuncing pre-merge
  // NOTE: needing the x:1 is a bug (BUG)
    {* (:x 1) | $>qq}
      {"x":1}
    {"{:foo}x" | $>qq.ww.ee || merge data $qq block "{_ee | quote}"}
      {:foo}x
    {$qq | merge block "{__}"}
      1{"ee":"{:foo}x"}
    {$qq | merge block "{(__)}"}
      [1][{"ee":"{:foo}x"}]
        

Tests for stringification
  {1 | $>power || each data (1 2 3 4) block "{math pow value 2 exp $power | $>power} "}
    2 4 16 65536

Tests for strings
  truncate
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
    
    
Tests for pipes
  ensure we're not front-piping: the initial command segment shouldn't get pipe vars
    {math pow value 5 exp 0}
      1
    
    (should fail with error, no exp)
    {math pow value 5}
    
    (should still fail)
    // TODO: ensure we're not front-piping inside pipes
    // (this might have to wait until the big rebuild)
    {math pow value 5 | $>vvvvv}
    
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


Tests for pass-by-value. Changing a Daimio variable shouldn't change other variables, either in Daimio or in the base language.
  {(1 2 3 4) | $>x}
    [1,2,3,4]
    
  {$x | $>y}
    [1,2,3,4]
    
//  {5 | > {"x.{$x | count}" | run}}
//    5
    
//  yuck -- should be 
//  {5 | $>x.{$x.count}}
//    5

//  {$x | list poke path {$x | count} value 5 | $>x}

  {$x | union 5 | $>x}
    [1,2,3,4,5]
    
  {$x} x {$y}
    [1,2,3,4,5] x [1,2,3,4]


Tests for self-reference. PBV cures these ills.
  {* (:a 1 :b 2) | $>x | $>x.c}
    {"a":1,"b":2,"c":{"a":1,"b":2}}
    
  {$x | $>x.d}
    {"a":1,"b":2,"c":{"a":1,"b":2},"d":{"a":1,"b":2,"c":{"a":1,"b":2}}}
    
  {$x}
    {"a":1,"b":2,"c":{"a":1,"b":2},"d":{"a":1,"b":2,"c":{"a":1,"b":2}}}


Tests for list compilation:
  {"{add ($counter 1) | $>counter}" | $>countblock}
    1
  
  {$countblock}
    2
  
  {$countblock | run | $counter}
    3


Tests for weird variables and stuff: 
  return nothing, as it's not a shortcut or variable.
    {+foo | $>ok}
  
  leading underscores are ok
  [no, no, they really aren't]
//    {12 | $>_foo | _foo}
//      12

// other stuff

{:dann | $>name}
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

{123 | $>foo}
123

{"{$foo} ~" | $>string_foo} 
123 ~

{ {"~ {$foo}"} | $>run_foo}
~ 123

{$string_foo}{$run_foo}
123 ~~ 123

{:asdf | $>foo}
asdf

{$string_foo}{$run_foo} 
asdf ~~ asdf


Here's the use cases, from the user's perspective:
{123 | $>foo}
  123

- I put a simple string in, I want the same string out.
  {"simple"}
    simple
  {begin x}blockguts{end x}
    blockguts
  {begin x | $>x | $x}asdf{end x}
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

- transformations can accept daimio, also. the 'this' variable is loaded with matches.
  {"food mood wood" | string transform from "/oo/g" to "{__ | string uppercase}"}
    fOOd mOOd wOOd

- I put a Daimio string in with escape characters, and want the raw Daimio string out.
  ---- WELL ACTUALLY: Daimio doesn't have escape characters anymore.
  {// {"\{asdf\}"} //}
    

- I pass/pipe a Daimio string in to the quote command, and want the raw Daimio string out.
  {daimio quote value "{$asdf}"}
    {$asdf}
  {"{$asdf}" | daimio quote}
    {$asdf}

- I put a Daimio string in, and want the processed output.
  {"{$foo}x"}
    123x

- I put a Daimio string in, get the processed output, and put that in a variable.
  {"{$foo}x" | run | $>x}
    123x
  {$x}
    123x
  {321 | $>foo}
    321
  {$x}
    123x

- I put a Daimio string in to a variable, then invoke that variable later (getting the processed output in each new context).
  {"{$foo}x" | $>x}
    321x
  {$x}
    321x
  {123 | $>foo}
    123
  {$x}
    123x

- I put a Daimio string in to a variable, then use that variable as a template for merging.
  {"~{__}~" | $>z}
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
  
- I take a Daimio string, get its ptree, do some mangling (macros), then get the processed output.
------> THINK: do we want this in here? I'm taking it out for now because it's kind of silly.
//  {daimio parse string "x{foo}y"}
//    {"m":"string","f":"join","p":{"value":["x",{"m":"variable","f":"get","p":{"path":"foo"}},"y"]}}
//  {variable set path :xy value {daimio parse string "x{foo}y"}}
//    {"m":"string","f":"join","p":{"value":["x",{"m":"variable","f":"get","p":{"path":"foo"}},"y"]}}
//  {variable set path :xy.p.value.#3 value "z"}
//    z
//  {xy}
//    x123z

- I take a Daimio string, pass it to the server, capture the (possibly object) return value and use it.

  

- ensure all strings get fully processed
  {"{"{"{1} 2"} 3"} 4"}
    1 2 3 4
  
  {{"{"{"{1} 2"} 3"} 4"}}
    1 2 3 4

  {"{"{"{1} 2"} 3"} 4" | quote}
    {"{"{1} 2"} 3"} 4
  
- ensure strings stay as strings:
//  {> :z value "z"}
//    z
//  {> :key value "KEY"}
//    KEY
  {:z | $>z}
    z
  {:KEY | $>key}
    KEY

  ---- this section highlights the new 'tainting' aspect of Daimio. Strings from foreign sources (db, user input, etc) aren't processed unless explicitly instructed. Also, string transformations taint the source string, and will only process when requested. 
  
  For reference, this is how you immediately run tainted strings:
    {"x{$key}y{$z}" | string transform from "{$key}" to 123 | unquote | run}
      x123yz

  And this is how you prep them for running eventually:
    {"x{$key}y{$z}" | string transform from "{$key}" to 123 | unquote}
      x123yz

  And these are all transformed, hence tainted:

  {"x{$key}y{$z}" | string transform from "{$key}" to 123}
    x123y{$z}
  {begin block | $>block | string transform from "{$key}" to 123}x{$key}y{$z}{end block}
    x123y{$z}
  {$block | string transform from "{$key}" to 123}
    x123y{$z}
  {"x{$key}y{$z}" | $>x | string transform from "{$key}" to 123} {// as a var}
    x123y{$z}
  {"x{$key}y{$z}" | $>x1 | string transform from "{$key}" to 123} {// through a pipe}
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
  {string transform value $x1 from "{$key}" to 123}
    x123y{$z}
  {string transform value {$x1} from "{$key}" to 123}
    x123y{$z}
  {string transform value {{$x1}} from "{$key}" to 123}
    x123y{$z}
  {string transform value $block from "{$key}" to 123}
    x123y{$z}
  {string transform value {$block} from "{$key}" to 123}
    x123y{$z}
  {string transform value {{$block}} from "{$key}" to 123}
    x123y{$z}
  
- ensure we can fully process if necessary
  {string transform value {$x | run} from "{$key}" to 123}
    xKEYyz
  {string transform value {$x1 | run} from "{$key}" to 123}
    xKEYyz
  {string transform value {$block | run} from "{$key}" to 123}
    xKEYyz
  
- ensure we can also access it as a function
  // THINK: these tests rely on implicit integer keys for lists. do we really want that? is there a downside?

  {"x{_key}y{$z}" | each data (1 2)}
    x0yzx1yz
  {begin block | $>block | each data (1 2)}x{_key}y{$z}{end block}
    x0yzx1yz
  {$block | each data (1 2)}
    x0yzx1yz
  {"x{_key}y{$z}" | $>x | each data (1 2)} {// as a var}
    x0yzx1yz
  {"x{_key}y{$z}" | $>x1 | each data (1 2)} {// var via pipe}
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
  {each block $x1 data (1 2)}
    x0yzx1yz
  {each block {$x1} data (1 2)}
    x0yzx1yz
  {each block {{$x1}} data (1 2)}
    x0yzx1yz
  {each block $block data (1 2)}
    x0yzx1yz
  {each block {$block} data (1 2)}
    x0yzx1yz
  {each block {{$block}} data (1 2)}
    x0yzx1yz

----- Loading value into the value variable creates a self-referencing block, which affects us later... 
// what we want to show here is that editing a block changes it back into just a regular 'dead' string.
{:hey | $>value}
  hey
{begin x_to_y | $>x_to_y}{string transform value $value from $x to $y}{end x_to_y}
  hey
{$x_to_y}
  hey

{"axy fix hex hoax" | $>value || :x | $>x || :y | $>y || $x_to_y}
  ayy fiy hey hoay

{$x_to_y | $>value | $x_to_y | run | $>modded_block}
  {string transform value $value from $y to $y}

{$modded_block}
  {string transform value $value from $y to $y}

// and then show you can 'rez' a dead string by unquoting it. (unquoting is dark, necromantic magic.)

{$x_to_y | $>value | run}
  {string transform value $value from $y to $y}

// alternately:
{$x_to_y | string transform from :x to :z | string transform from :y to :x | string transform from :z to :y | $>y_to_x}
  {string transform value $value from $y to $x}
  
{"axy fix hex hoax" | $>value || :x | $>x || :y | $>y || $y_to_x}
  {string transform value $value from $y to $x}


// run the process instantly
{"axy fix hex hoax" | $>value || :x | $>x || :y | $>y || $y_to_x | unquote | run}
  axx fix hex hoax

{$y_to_x | unquote | run | quote}
  axx fix hex hoax


// unquote the string to create a block
{$y_to_x | unquote | $>y_to_x_block}
  axx fix hex hoax

{$y_to_x | unquote | quote}
  {string transform value $value from $y to $x}

{"axy faxy foxy" | $>value || $y_to_x_block}
  axx faxx foxx
  

// make the above into a command, with proper parameters


-- let's examine strings in strings in braces etc

{:z | $>z}
  z
{"" | $>y}

// this one's pretty easy -- just make sure you fully process before you finish
{"1 {$z} {"2 {$z} {"3 {$z}"}"}"}
  1 z 2 z 3 z

// this one's a bit harder -- once it starts running, the first command should fully proc before the next one
// THINK: bug or bad test?
//{"1 {"{$y} 2 {$z | $>y} 3"} {$y}"}
//  1  2 z 3 z

// ho ho ho
{1 | $>x}
  1

{({"{$x}" | $>asdf} "zxcv" {"{$x}"} $asdf) | string join on " "}
  {$x} zxcv {$x} {$x}
{({"{$x}" | $>asdf} "zxcv" {"{$x}"} $asdf) | string join on " " | unquote}
  1 zxcv 1 1

{({"{$x}dog" | $>asdf} $asdf {8 | $>x} $asdf) | string join on " "}
  {$x}dog {$x}dog 8 {$x}dog
// THINK: bug or bad test?
// {1 | $>x | ({"{$x}dog" | $>asdf} $asdf {8 | $>x} $asdf) | string join on " " | unquote}
//   1dog 1dog 8 8dog


-- note here that the entire list gets processed before the 'on' param's Daimio is processed. this is due to the internal mechanics of 'string join': some commands may behave differently. 
{($asdf {"{$x}" | $>asdf} "zxcv" {"{$x}"} $asdf) | string join on " {$asdf} "}
  {$x}dog {$asdf} {$x} {$asdf} zxcv {$asdf} {$x} {$asdf} {$x}
// THINK: bug or bad test?
// {1 | $>x | ($asdf {"{$x}" | $>asdf} "zxcv" {"{$x}"} $asdf) | string join on " {$asdf} " | unquote}
//   1dog 1 1 1 zxcv 1 1 1 1

{({"{$x}dog" | $>asdf} $asdf {8 | $>x} $asdf) | string join on " {$x} "}
  {$x}dog {$x} {$x}dog {$x} 8 {$x} {$x}dog
// THINK: bug or bad test?
// {1 | $>x | ({"{$x}dog" | $>asdf} $asdf {8 | $>x} $asdf) | string join on " {$x} " | unquote}
//   1dog 8 1dog 8 8 8 8dog
    
END STUFF


  
  
  
  // next up: coffee, jazz, obscure sports, obscure holidays, autological (anti, homo, etc), deep sea creatures, church/kleene/turing etc, russell/conway/tarski etc, singularity/bingularity/tringularity, murray gell-mann, pynchon&co, funny parts of the eye, shakespearean neologisms, joycean neologisms, carrollean neologisms, other biology, music theory, strange foods, topological space organization (T1), the lambda cube [posets&dags], ways of making numbers, mermaid > duck > bunny > manatee, 
  


{(:One {"1 2 3" | string split on " "} :Two)}
  ["One",["1","2","3"],"Two"]

{begin foo | $>foo | $foo}One{"1 2 3" | string split on " "}Two{end foo}
  One["1","2","3"]Two

{begin foo | $>foo ||}One{"1 2 3" | string split on " "}Two{end foo}{$foo}
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

{(1 "{:asdf | string split}" 3)} {// this becomes a string of a list of a string because of the quotes //}
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

  {begin foo | $>foo ||}hello{end foo}{$foo | grep :llo}
    ["hello"]

  {(:foo :buzz :bizz :bazz) | $>x | grep :zz value $x}
    ["buzz","bizz","bazz"]

  {begin foo | string split on " " | $>x ||}hello hey zebra squid{end foo}{$x | grep :h}
    ["hello","hey"]



// this is a pipe

// ceci n'est pas une pipe


// A STRANGE THING

  This obviously does what you would expect, processing the list elements in order:
  // NOTE: false -> "" when output as a string, but not when JSONified.
    {( $a {2 | $>a} $a )}
      [false,2,2]

  Same:
    {( {$a} {4 | $>a} {$a} )}
      [2,4,4]

  Here the block is processed after $a is reset
    {( "{$a}" {8 | $>a} {$a} ) | unquote}
      ["8",8,8]

// STRINGS

  -- internal strings containing Daimio are considered 'alive'. among other things, this means that they will eventually be processed.
  -- data coming from outside the processed string (db, user, etc) is 'dead'. dead string won't be processed.
  -- strings w/o Daimio are dead.
  -- the 'quote' command kills a live string.
  -- the 'unquote' command resuscitates a dead string.
  -- you can put a live string in a variable, and reference it many different times. each will be processed according to the customs of its time.
  -- the 'run' command fully processes (and kills) a live string.
  -- string transformation commands (of any kind) kill live strings.
  

// BASIC SYNTAX


// various null-value checks
{}

{{}}

{|}

{||}

{ }

{abra}

{""}



// comments and brace matching
{/a}y
y
{/a {b} c}y
y
{/a {b{c}d} e}y
y
{/a {b} {c} d}y
y
{/a {b{c}d} {e} f}y
y

// / comments and escaped braces
// {/a \} b}y
// y

{ /a \openbracegoeshere b}y
  y

{/a \{\} b}y
  y

// \{alpha\}y
// {alpha}y

// tests for quote and brace matching

// THINK: bug or bad test?
// {* ("bar" "{$foo}") | $>x}
//   {"bar":"hello hey zebra squid"}

{* ("one" "local" "two" "surprise local!" "foo" "bar") | $>x}
  {"one":"local","two":"surprise local!","foo":"bar"}

{{"stupid"}} y
  stupid y
{"stupid {$x.one}"} y
  stupid local y
{"{"stupid"} {$x.one}"} y
  stupid local y
{"{"stupid {$x.one}"} {$x.one}"} y
  stupid local local y
{"{"stupid {"{$x.one}"}"} {$x.one}"} y
  stupid local local y
{"{"stupid {"{$x.one} {$x.two}"}"} {$x.one}"} y
  stupid local surprise local! local y
{"{"stupid {"{$x.one} {$x.two} {$x.bogus.foo}"}"} {$x.one}"} y
  stupid local surprise local!  local y



PEEK AND POKE


This is a section all about how my list searching got twisted all upside down. It includes the majority of the peek & poke tests just so they're in one place instead of two.




  {* (:one :one :two :two :three :three) | $>numbers ||}

  {* (:one :hashly :two :bashly :three :crashly) | $>hash ||}

  {* (:one :local :two "surprise local!" :foo :bar :bar $foo :hash $hash) | $>locals ||}

  {( {* (:one :first :two "surprise array!" :locals $locals)} {* (:one :second :two "surprise number also!" :locals $locals)} {* (:one :third :two "surprise me too!" :locals $locals)} ) | $>data ||}


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
    

    {$data.*.*.*.*}
      ["hashly","bashly","crashly","hashly","bashly","crashly","hashly","bashly","crashly"]

  Remember, the star operator exposes the list internals to future operators in parallel, so #1 here eats nine scalar values.
    {$data.*.*.*.*.#1}
      ["hashly","bashly","crashly","hashly","bashly","crashly","hashly","bashly","crashly"]
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



  TREE SHAPING

  {* (:name "Awesome John" :age :alpha) | $>a-john ||}

  {* (:name "Awesome Bobs" :age :beta) | $>a-bobs ||}

  {* (:name "Awesome Mary" :age :gamma) | $>a-mary ||}

  {* (:name "Awesome Stev" :age :delta) | $>a-stev ||}

  {($a-john $a-bobs $a-mary $a-stev) | $>awesome_people ||}

  {* (:name "Cool John" :age :alpha) | $>c-john ||}

  {* (:name "Cool Bobs" :age :beta) | $>c-bobs ||}

  {* (:name "Cool Mary" :age :gamma) | $>c-mary ||}

  {* (:name "Cool Stev" :age :delta) | $>c-stev ||}

  {($c-john $c-bobs $c-mary $c-stev) | $>cool_people ||}

  {* (:name "Neat John" :age :alpha) | $>n-john ||}

  {* (:name "Neat Bobs" :age :beta) | $>n-bobs ||}

  {* (:name "Neat Mary" :age :gamma) | $>n-mary ||}

  {* (:name "Neat Stev" :age :delta) | $>n-stev ||}

  {($n-john $n-bobs $n-mary $n-stev) | $>neat_people ||}

  {( {* (:name "awesome test co" :employees $awesome_people :boss $a-john)} {* (:name "cool test co" :employees $cool_people :boss $c-john)} {* (:name "neat test co" :employees $neat_people :boss $n-john)} ) | $>companies ||}

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
      

OK CHANGE GEARS

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


Poking is a lot like peeking, except it sets a value instead of reading it and fills any gaps it encounters with empty lists.

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
    this behavior is likely to change; please don't rely on generated keys.
      {* (:a 1 :b 2 :c 3) | list poke path ("#5") value 999}
        {"1000000":[],"1000001":999,"a":1,"b":2,"c":3}
      {* (:a 1 :b 2 :c 3) | list poke path ("#5") value 999 | sort}
        [[],1,2,3,999]
      
      
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

LOGIC COMMANDS


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
        

  IF
    Note that both 'if' and 'cond' take a 'with' param, which includes pipeline variables in the block scope.
    If the 'with' param is provided the selected block will be executed. Otherwise it will be returned as is.
    The magic key __in becomes the process input, if 'with' is a keyed list. If 'with' is scalar the value is taken to be __in. If 'with' is an unkeyed list the effects are chaotic-evil.
    Note that the short form of e.g. "with __" can only be used if __ is scalar: otherwise, use "with {* (:__in __)}"

    {1 | else "{fff fff}" | add 1}
      2
  // TODO: this fails because the 'else' alias hardcodes two pipe slots, so 'with' eats the implicit pipe. 
           same thing happens for 'then', and probably other aliases. might be a symptom of the recent 
           pipe troubles. put some more tests in to check for it and set it right. (BUG)
    {0 | else "{9}" | add 1}
      1
    {0 | else "{9}" with :foo | add 1}
      10
    {10 | then "{__}" with __ | add 1}
      11
    {10 | then "{__}" with {* ("__in" __)} | add 1}
      11
    {10 | then "{_x}" with {* (:x __)} | add 1}
      11

    {1 | else "{fff fff}" | add 1}
      2
    {0 | else "{9}" | add 1}
      10

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

  COND

     {cond ($false :bad "" :bad 0 :bad () :bad 1 :good 2 :bad)}
       good

     {cond ({$false} :bad {""} :bad {0} :bad {()} :bad {1} :good {2} :bad)}
       good

     {cond ({1 | subtract 1} :bad {1 | add 1} "{(:g :o :o :d) | string join}")}
       good

     {cond ($false "bad!" {:true} "{:yep}" $nope "baaaad!!!")}
       yep

     // {cond (($false "bad!") ({:true} 456 "hey {$bat}") ({123 | $>bat} "too far"))}
     //  hey






MATH COMMANDS

  Ensure values are properly finagled. 
    {1 | $>x | 2 | $>y | 3 | $>z | ($x $y $z) | add}
      6
   
  ADD
  
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
 
  SUBTRACT
  
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
 
  MULTIPLY
  
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
 
  DIVIDE 
  
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
 
  MAX
  
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
 
  MIN
  
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
 
  MOD
  
    {math mod value 7 by 2}
      1
    {:7 | mod :2}
      1
 
  POW
  
    {math pow value 2 exp 8}
      256
    {:5 | math pow exp :3}
      125
    {5 | math pow exp 0.5}
      2.23606797749979
 
  RANDOM
 
  ROUND
  
    {123.456 | math round}
      123
    {123.456 | math round to -2}
      100
    {123.456 | math round to 2}
      123.46
 
 
   
   






LIST COMMANDS


<!--
  
  Older commands that probably won't exist anymore but we still need to handle these cases somehow
    
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




  // TODO: tests for block executing in same space (re: spacevar scoping)


  SOME DATA
    {( {* (:x 2 :y :d)} {* (:x 1 :y :d)} {* (:x 3 :y :a)} {* (:x 2 :y :c)} {* (:x 4 :y :b)} ) | $>klist}
      [{"x":2,"y":"d"},{"x":1,"y":"d"},{"x":3,"y":"a"},{"x":2,"y":"c"},{"x":4,"y":"b"}]
    
    {( {* (:one (2 3 5) :two (1 3 4))} {* (:one (3 4 5) :two (1 3 4))} ) | $>dlist ||}
    
    {* (:two {* (:one :second :two (:hinterlands :yellow :mishmash) :three :odd)} :one {* (:one :first :two (:hi :hello :hijinx :goodbye) :three :even)} :three {* (:one :third :two (:hinterlands :yellow :mishmash) :three :even)} )  | $>data ||}
  
   
  COUNT

    {(1 2 3) | list count}
      3
    {$data | list count}
      3
    {$dlist | count}
      2
    {$klist | count}
      5

  EACH
  
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


  FILTER
    
    NOTE: these used to be extract, but we're going to handle that differently in the future. There's a filter function that does what it says on the tin, and a 'treewalk' function that allows you to dive into data and filter it from the inside. these two together can probably replace the old extract/prune functionality, maybe.
    
    {$klist | filter block "{__.x | eq 2}"}
      [{"x":2,"y":"d"},{"x":2,"y":"c"}]
      
    {$klist | __.*.* | filter block "{__ | eq :d}"}
      ["d","d"]
      
    {$dlist | __.*.*.* | filter block "{__ | less than :4}"}
      [2,3,1,3,3,1,3]
    
    // NOTE: no _parent is exposed in filter
    
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
    

  FIRST
        
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


  GROUP
  
    // THINK: these values are all correct, but they're keyed instead of simple arrays. and, hence, sorted poorly. (BUG)
  
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

  INTERSECT
  
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
      
  think: the return list is always unkeyed
    {list intersect data ($data.one {* (:one :first :four :nothing)})}
      ["first"]
    {list intersect data (1 2 3) also (3 4 5)}
      [3]


  JSON

    {begin list | list from_json}[["one","row"],["second","row"]]{end list}
      [["one","row"],["second","row"]]

    {begin list | list from_json}{"one":"row","second":"row"}{end list}
      {"one":"row","second":"row"}

    {((:one :row) (:second :row)) | list to_json}
      [["one","row"],["second","row"]]

    {{* (:one :row :second :row)} | list to_json}
      {"one":"row","second":"row"}

    {((:one :row) (:second :row)) | list to_json | list from_json}
      [["one","row"],["second","row"]]

    {{* (:one :row :second :row)} | list to_json | list from_json}
      {"one":"row","second":"row"}


  KEYS
  
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

  MAP
  
    // TODO: add _with tests for {list ...} and {logic cond} 

    // this isn't really a test for map, but is pretty weird (BUG)
    {(12 34) | map block "{__}"}
      [12,34]
    {(12 34) | map block "{__ | >foo}"}
      [12,34]
    {(12 34) | map block "{__ | >foo | add 1}"}
      [13,35]
    {(12 34) | map block "{__ | add 1 | >foo}"}
      [13,35] 
      
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
  
  MERGE
    
    {merge data ({* (:name :you)}) block "hey {_name}!"}
      hey you!
    {merge data {* (:one {* (:name :you)} )} block "hey {_name}!"}
      hey you!
      
    {begin block | merge data ( {* (:one 12)} {* (:one 24)} )} {_one} {end block}
      12  24


    {({* (:name :youhoo)}) | $>names}
    [{"name":"youhoo"}]
    
    {"hey {_name}!" | $>foo}
    hey !
    
    {:blargh | $>name}
    blargh
    
    {merge data $names block $foo}           {/ var get => block}
    hey youhoo!         
    
    {merge data $names block {$foo}}         {/ same}
    hey youhoo!
    
// THINK: figure out if these are bugs or just bad tests
//    {merge data $names block "{$foo}"}       {/ new block => var get => old block}
//    hey youhoo!
//    
//    {merge data $names block {"{$foo}"}}     {/ same}
//    hey youhoo!
//    
//    {merge data $names block "{$foo} x"}     {/ different new block}
//    hey youhoo! x
//    
//    {merge data $names block {"{$foo} x"}}   {/ same different new block}
//    hey youhoo! x
//    
//    {merge data $names block {$foo | run}}   {/ var get => block => defunc => string}
//    hey blargh!


  PEEK
  POKE
    [see the peek&poke section above for these tests]

  RANGE
    
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
  
  
  REDUCE
  
    {(1 2 3) | reduce block "{add _value to _total}"} 
      6
    {(1 2 3) | reduce block "{__ | add to _total}"} 
      6

  REMOVE
  
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


  REKEY
  
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


  REVERSE
  
    {(3 2 4 1) | list reverse}
      [1,4,2,3]
  TODO: This smashes keys currently (BUG)
    {* (:x 3 :y 2 :z 4 :q 1) | list reverse}
      {"q":1,"z":4,"y":2,"x":3}
    

  SORTING
  
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

  THINK: how would you sort by keys? (BUG)
  
    {* (:c 3 :b 2 :a 1) | list sort}
      {"a":1,"b":2,"c":3}
    

  UNION
    
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


  UNIQUE
  
    {(:hi :hi :puffy :ami :yumi) | list unique}
      ["hi","puffy","ami","yumi"]
    {* (:a :hi :b :hi :c :puffy :d :ami :e :hi :f :yumi) | list unique}
      {"a":"hi","c":"puffy","d":"ami","f":"yumi"}
    {((1) (2) (1) (3)) | list unique}
      [[1],[2],[3]]


STRING COMMANDS


  GREP
    {string grep value (:hello :world) on "/.llo/"}
      ["hello"]

    



KNOWN BUGS


  Keyed lists with positive integer keys are not ordered correctly. All keyed lists should be ordered by insertion order by default, and retain their sort order if sorted. Even once this is fixed imports from JSON will still have this problem (for the initial import, not once sorted) unless we write our own JSON parser.
    {* (:xyz :z 10 :z 3 :z 1 :z :a :z)}
      {"xyz":"z","10":"z","3":"z","1":"z","a":"z"} 
    {* (:xyz :9z 10 :8z 3 :6z 1 :4z :a :2z) | sort}
      {"a":"2z","x1":"4z","x3":"6z","x10":"8z","xyz":"9z"}

  Blocks inside lists that get cloned become quoted. This might be considered a *feature* in some circles, but it makes a fairly valid use case (sticking blocks inside a keyed list as quasi-object methods) more difficult.
    {("foo" "{2 | add 7}") | map block "{__ | run}"}
      ["foo",9]
    {("foo" "{2 | add 7}") | $>foo | map block "{__ | run}"}
      ["foo",9]
    {("foo" "{2 | add 7}") | $>foo || $foo | map block "{__ | run}"}
      ["foo",9]
    
  Most list commands eat keys:
    sort, reverse, etc
  

DECISIONS TO BE MADE
  In order of importance... write about these when you make them.

  Blocks aren't strings. How do we distinguish them? How do they work? When are they executed? What's their syntax? Can we make string manipulation easier? Can we keep string generation just as easy? List all cases.

  Objects vs Arrays in JSON output: 
    - which commands retain keys? all that possibly can?
    - when are objects converted back into arrays? only on demand? not specified? anytime there's integer keys? finally a use for to_json?
  
  How do we walk a tree to prune things, extract things, etc?
  
  Port creation / port invocation / command invocation are all very similar. 
  - can we consolidate them?
  - how do we give port creation/invocation the same degree of helpful insight commands have?
  
  If all side effects are in outside ports, commands become pure and controlling access to them is less necessary. 
  - how do we limit access to outside ports in a safe and progressively available way?
  - do dialects matter? can we compile down based on a particular "library" of commands we expect to have available anywhere the code is executed?
  - we'll still want to overwrite commands and possible white/black list them, but it's really the ports we're limiting... do commands contain ports? can we pull this back in to the command level in some way? do we want to?
  




