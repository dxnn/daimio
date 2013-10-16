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

