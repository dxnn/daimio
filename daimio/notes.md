This is a staging area for Daimio notes until a more useful location can be found. Thoughts or ideas that have become irrelevant will be sloughed off over time.





  Initial setup:
  - create the top-level space 
  - run code in the top level space which
    - builds subspaces with their own dialects
    - builds gateways to I/O
    - connects those gateways to channels
    - connects subspaces to channels

  The basic execution process:
  - create a new Block from a string S and a Space (which has a Dialect and a Varset)
    - breaks S into components (text, pipelines, blocks)
    - recursively converts any further blocks
    - builds Pipelines from a string, dialect and state
      - recursively builds inner pipelines and blocks
      - perform compile-time operations (escaping blocks, etc)
  - call block.execute() ... or space.execute? no, space.execute(block) always takes a param (possibly an empty one)
    
      
  
  Q: how do we keep from initially compiling subspace init blocks, since those should be compiled with their parent dialect? 
  A: don't worry about it for now -- recompile as often as needed.
  
  Q: how do we detect and activate compile-time operations? this happens in block init pipelines, including possibly our initial (top-level) block. it can also happen in regular pipelines. e.g. {begin foo | string quote}
  
  Q: how do we attach execution code to a space? A space has init code that builds it... maybe {space create} takes a block? yeah, suppose so. is that block compiled with the space's dialect? yep, that makes sense. {space create block $B dialect $D | > :MYSPACE} or something.



COMMANDS
collects
checks
calculates
effects

gather
conditions
calculations
effects

Maybe add Frink as a handler?


ERRORS
THINK: maybe every station has a stderr outport, and you tap those ports to do anything with errors (instead of having them act as a global cross-cutting concern). you could run them to the console.log outport by default (or just in debug mode) and do something else in production like log in the db and send an email or something, based on error message / metadata. [oh... errors should probably have metadata]

we can also put the error text/data in the command definition as an array, and then reference it from the error sender as an index (or object/key is probably better)

that would simplify e.g. translation, and allows automated error stuff (eg show what errors a command can throw, practice throwing those to see what happens, pick out all potential errors of type foo from all stations (like, which stations are capable of producing *extreme* errors?))


FONTS
Big font is Impossible. smaller font is Roman. smallest font is Cyberlarge. BroadwayKB, Chunky, Double, and JS stick were contenders for smallest.
http://patorjk.com/software/taag


HELPERS
some of these are here just to remove the dependency on underscore. should we just include underscore instead?




  If we make the event log a little stronger, can we use it to update local stores? 
  example: Bowser is auditing in his browser. He pulls up an audit and gets to work. This loads up all the audit data, but it also subscribes to the update channels for those _things_. Then Peach loads the same audit and makes some changes. 
  - Bowser's browser receives those events and updates the cached audit data accordingly (and hence the display).
  - Any queries to loaded objects can just hit the local cache, because it's automatically kept in sync.
 implies the local commands understand how to modify local cache based on events... hmmm.
 
 Log commands as a 3-element list: [H, M, P], with H&M as strings and P as a param map. this is canonical. also log time and user id. 
 thing: this is findable if it matches H+P.id. some commands might affect multiple things (but most don't). so... always log thing? never log thing? if the command is atomic, then the command is the bottom, not the thing. so changes on a thing are found via command search? need to list use cases. 
 
 there will be lots of 'standard form' commands, like {noun add} and {noun set-type} and {my set collection :nouns}. can we do something useful with them? 
 
 {my set} becomes a fauxcommand which includes a call to {attr set} and has user:* exec perms.
 {attr set} allows setting of a things' attributes if you have perms on that thing. (superdo can bypass, natch)
 so... how do you know what a thing's schema is? for example, given @thing, is it @thing.name or @thing.my.name?
 is it {thing set-name} or {my set attr :name}? are these formally defined somewhere or ad hoc? 
 defined: discoverable, programatically constrained, but requires locking in the schema before building
 ad hoc: flexible, friendly, but difficult to generate knowledge of thing structure -- leading to confusion and "sample querying"
 we have a fixed mechanical schema. that exists, if only in our heads. why not make it formal? could aid in migration, also, when needed.
 then anything not covered in the schema is available for attr'ing. so you can have super-friendly attrs like @thing.name, without having to specify anything (by simply *not* putting them in the formal schema).
 so a {name set} fauxcommand and the ilk for things in general? and {my set} for user-created ad hoc attrs?
 
 commands are the atomic bottom. things are underneath that. most commands change one attr on one thing at a time. but some more complex ones might change many attrs on several things at once. we want to:
 - track changes to a thing over time
 - see the system at a particular moment in time
 - rewind and fast forward through time
 - allow unlimited undoability
 complex commands are like a transaction. so maybe commands are 'simple' (one thing/attr, undo means redo prior command w/ same params (id, maybe collection for {attr set}) but different value). 
 whereas a 'complex' command requires a custom 'undo' function as part of the command definition. so the bottom command itself contains information on the collection+attr. (automated for set-* style commands)
 
 also need to allow custom events in the event log, not just commands. this is important for... i don't know what. maybe those go in a different collection. command log for commands. error log for errors. event log for other things. maybe the event log is just there for attaching listeners? but if you're using a command for firing an event then that's going to go in the command log. so you could just trigger off of that...
 (so a no-op command that goes in the command log w/ a param and allows for attaching listeners? that seems weird... but maybe with some adjustment that's the right way to go.)
  
  
  
  something like a scatter-gather + stm, where you grab data from different urls in parallel and merge it into a data structure in a potentially overlapping fashion [photos from flickr plus tweets plus google news or something?, then arranged in circles that overlap or move?]
  
  
*/

// Daimio var keys match /^[-_A-Za-z0-9]+$/ but don't match /^[_-]+$/ -- i.e. at least one alphanumeric
// this way we've got lots of room for fancy options for keys, like #N
// and also we can use something like {value: 5, to: {!:__}} in our pipeline vars, where the ! means 'check the state'



space ports to add: up, down, EXEC, INIT, SEED
stations have one dock but multiple depart ports... there's technically no reason they couldn't also have multiple implicit dock ports, although oh right. ALWAYS ONLY ONE DOCK, because it's triggered by an async event (ship arriving), but everything inside is dataflow so requires *all* inputs before processing. having only one input bridges that gap. if your block is super complicated, break it into multiple stations in a space...
so: 
- a port w/o a pair and w/ a station is special-cased in port.enter
- a port w/o a pair and w/o a station is errored in port.enter
- otherwise port.enter calls port.pair.exit
- for port pairs on the 'outside', a special outside-pair fun is activated at pairing time
- likewise those ports have a special outside-exit fun
- a regular space port on the outside doesn't have either of those, so it functions like a disconnected port [nothing enters, exit is noop]


TYPES
[string] is a list of strings, block|string is a block or a string, and ""|list is false or a list (like maybe-list)

We could consider having a NULL global value. nothing would return it. 
undefined variables are NULL. a param set to NULL like {math add value (1 2 3) to NULL} will drop the param (so that would return 6). as opposed to {math add value (1 2 3) to FALSE} which would return (1 2 3) or {math add value (1 2 3) to TRUE} which would return (2 3 4)

yuck type conversions yuck yuck. 
maybe just NULL and not TRUE/FALSE? what's the use case for those again?

// something about using []s and {}s to map something... _and_ vs _or_? it was really clever, whatever it was.




Decisions to be Made

    In approximate order of importance... write about these when you make them.

    Blocks aren't strings. How do we distinguish them? How do they work? When are they executed? What's their syntax? Can we make string manipulation easier? Can we keep string generation just as easy? List all cases.

    Objects vs Arrays in JSON output: 
      - which commands retain keys? all that possibly can?
      - when are objects converted back into arrays? only on demand? not specified? anytime there's integer keys? finally a use for to_json?
  
    How do we walk a tree to prune things, extract things, etc?
      -- peek/poke partially solves this, but we want to combine pathfinders with lambda blocks (one to decide whether to run the other).
  
    Port creation / port invocation / command invocation: these are very similar. 
    - can we consolidate them?
    - how do we give port creation/invocation the same degree of helpful insight commands have?
  
    If all side effects are in outside ports, commands become pure and controlling access to them is less necessary. 
    - how do we limit access to outside ports in a safe and progressively available way?
    - do dialects matter? can we compile down based on a particular "library" of commands we expect to have available anywhere the code is executed?
    - we'll still want to overwrite commands and possible white/black list them, but it's really the ports we're limiting... do commands contain ports? can we pull this back in to the command level in some way? do we want to?
  
    Knowing when exactly a block will execute is hard.

    What should booleans coerce to? 0 and 1 seem reasonable, but "" is nice for certain UI use cases (which ones?).



Some notes on pipeline parallelism

    A few example pipelines we can parallelize internally.

    //    {  123 
    //     | >in | add 1 | >out1
    //    || _in | add 2 | >out2
    //    || _in | add 3 | >out3
    //    || (out1 out2 out3)}
    Those three middle pipelines could run in parallel.

    //    {123 | (
    //      {__ | add 1}
    //      {__ | add 2}
    //      {__ | add 3}
    //    )}

    //    {123 | (
    //      {__ | add $x | >$x}
    //      {__ | add $x | >$x}
    //      {__ | add $x | >$x}
    //    )}

    That last one leads to non-determinism if you parallelize without fixing the execution order. 

    If we're going to allow in-pipeline parallelism, we open up two questions: 
    1) what is $x inside each pipeline?
    2) what is $x at the end? 

    And probably, the answers are
    1) A separate copy of the initial $x for each pipeline (clearly this hurts performance, but a: we don't care b: don't use space vars in parallel pipelines c: don't be daft)
    2) Last Write Wins, in expressed order [does compilation ever hurt reasoning about this, or is it guaranteed order invariant?]

    EXCEPT. Except if we do the above, $x is completely different at the end than if we don't run in parallel. 
    SO: space vars CAN NOT be written in pipelines run in parallel -- writing a space var forces the entire sequence to be run sequentially. 
    Same holds true for writing to like-named pipeline vars: those are errors, and force sequential execution.




    ////    //The first segment of an inline pipeline also grab the process input instead of the previous segment value -- this is almost certainly not what you want. 
    ////THINK: how does this square off with __.foo? that essentially becomes {__ | list peek path (:foo)} and could be a param value or in a list. so {1 | ({__} {__})} should be (1 1) by that logic. what was the issue with that?
    ////If, while using a pipeline as a param value, you want access to the previous pipe segment's value, then you should either refactor the pipeline to do the processing beforehand (as above), or assign the value to a pipeline var.




    Rethinking Case 2. Having two different meanings of <code>__</code> is probably overly complicated. I still like the idea of imagining the process input peeking in through the beginning of the pipeline, and I'd like to use that some day for things like {(1 2 3) | map "{add 1}"} but if we're going to be explicit about it why not use a different symbol? 
    [well, for one reason, some aliases have pipes in them: <code>{(1 0 3) | map "{then :ham else :foo}"}</code> -> <code>(:ham :foo :ham)</code> via front-pipes]
    maybe... maybe having <code>({__} {__})</code> freak out and do stupid things is reasonable, in the same way that other languages give syntax errors for stupid things. it's hard making a language with no real errors!
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
    // this is a pipe
    // ceci n'est pas une pipe



You can just do JSON.stringify(value, D.scrub_var, 2) instead:

    // D.Etc.niceifyish = function(value, whitespace) {
    //   // this takes an array of un-stringify-able values and returns the nice bits, mostly
    //   // probably pretty slow -- this is just a quick hack for console debugging
    //   
    //   var purge = function(key, value) {
    //     try {
    //       JSON.stringify(value)
    //     } catch(e) {
    //       if(key && +key !== +key)
    //         value = undefined
    //     }
    //     return value
    //   }
    //   
    //   return JSON.stringify(value, purge, whitespace)
    // }





    // DFS over data. apply fun whenever pattern returns true. pattern and fun each take one arg.
    // NOTE: no checks for infinite recursion. call D.scrub_var if you need it.
    // D.recursive_walk = function(data, pattern, fun) {
    //   var true_pattern = false
    //   
    //   try {
    //     true_pattern = pattern(data) // prevents bad pattern
    //   } catch (e) {}
    //   
    //   
    //   if(true_pattern) {
    //     try {
    //       fun(data) // prevents bad fun
    //     } catch (e) {}
    //   }
    //   
    //   if(!data || typeof data != 'object') return
    //   
    //   for(var key in data) {
    //     if(!data.hasOwnProperty(key)) return
    //     D.recursive_walk(data[key], pattern, fun)
    //   }
    // }

    // run every function in a tree (but not funs funs return)
    // D.recursive_run = function(values, seen) {
    //   if(D.is_block(values)) return values;
    //   if(typeof values == 'function') return values();
    //   if(!values || typeof values != 'object') return values;
    //   
    //   seen = seen || []; // only YOU can prevent infinite recursion...
    //   if(seen.indexOf(values) !== -1) return values;
    //   seen.push(values);
    // 
    //   var new_values = (Array.isArray(values) ? [] : {});
    //   
    //   for(var key in values) {
    //     var value = values[key];
    //     if(typeof value == 'function') {
    //       new_values[key] = value();
    //     }
    //     else if(typeof value == 'object') {
    //       new_values[key] = D.recursive_run(value, seen);
    //     }
    //     else {
    //       new_values[key] = value;
    //     }
    //   }
    //   return new_values;
    // };

    // NOTE: defunctionize does a deep clone of 'values', so the value returned does not == (pointers don't match)
    // THINK: there may be cases where this doesn't actually deep clone...

    // run functions in a tree until there aren't any left (runs funs funs return)
    // D.defunctionize = function(values) {
    //   if(!values) return values; // THINK: should we purge this of nasties first?
    // 
    //   if(values.__nodefunc) return values;
    //   
    //   if(D.is_block(values)) return values.run(); // THINK: D.defunctionize(values.run()) ??  
    //   if(typeof values == 'function') return D.defunctionize(values());
    //   if(typeof values != 'object') return values;
    //   
    //   var new_values = (Array.isArray(values) ? [] : {});
    // 
    //   // this is a) a little weird b) probably slow and c) probably borked in old browsers.
    //   Object.defineProperties(new_values, {
    //     __nodefunc: {
    //       value: true, 
    //       enumerable:false
    //     }
    //   });
    //   
    //   for(var key in values) {
    //     var value = values[key];
    //     if(typeof value == 'function') new_values[key] = D.defunctionize(value());
    //     else if(typeof value == 'object') new_values[key] = D.defunctionize(value); 
    //     else new_values[key] = value;
    //   }
    //   
    //   return new_values;
    // };

    // walk down into a list following the path, running a callback on each end-of-path item
    // D.recursive_path_walk = function(list, path, callback, parent) {
    //   if(typeof list != 'object') {
    //     if(!path) callback(list, parent); // done walking, let's eat
    //     return; 
    //   }
    // 
    //   // parents for child items
    //   // THINK: this is inefficient and stupid...
    //   var this_parent = {'parent': parent};
    //   for(var key in list) {
    //     this_parent[key] = list[key];
    //   }
    // 
    //   // end of the path?
    //   if(!path) {
    //     for(var key in list) {
    //       callback(list[key], this_parent);
    //     }
    //     return; // out of gas, going home
    //   }
    // 
    //   var first_dot = path.indexOf('.') >= 0 ? path.indexOf('.') : path.length;
    //   var part = path.slice(0, first_dot); // the first bit
    //   path = path.slice(first_dot + 1); // the remainder
    // 
    //   if(part == '*') {
    //     for(var key in list) {
    //       D.recursive_path_walk(list[key], path, callback, this_parent);
    //     }
    //   } else {
    //     if(typeof list[part] != 'undefined') {
    //       D.recursive_path_walk(list[part], path, callback, this_parent);
    //     }
    //   }
    // };
