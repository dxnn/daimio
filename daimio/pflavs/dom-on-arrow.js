D.import_port_flavour('dom-on-arrow', {
  dir: 'in',
  settings: [
    {
      key: 'thing',
      desc: 'A dom selector for binding',
      type: 'selector'
    },
    {
      key: 'parent',
      desc: 'A dom element contain thing. Defaults to document.',
      type: 'id'
    },
  ],
  outside_add: function() {
    var self = this
    D.track_event('keydown', this.settings.thing, this.settings.parent, function(value) {self.enter(value)})
  }
})


// sort out port creation params [formalize param naming and desugar into it]
// allow 'document' as a binding point (passed as string, sort it out in D.track_event)
// allow a 'punch through' param to D.track_event that puts the event back into the stream instead of catching it (and labels it so it doesn't get caught by others)
// send just keycode and name -- do this in general, by maybe giving a 'scrub' function to D.track_event
// port creation params... we need a way to:
/*

- set the port name
- set the port flac
- name params for port creation
- set values for port creation

so it's like a command, kind of

like: 
        @arrows is a dom-on-arrow port with target "document" ignore (:form :myfield :myslider)


are all of these valid:

@dom-on-arrow
@arrows dom-on-arrow
@arrows dom-on-arrow :document
@arrows dom-on-arrow target :document
@arrows dom-on-arrow target :document ignore (:form :myfield :myslider)

???

also, why is default state input in json? just do it in daimio code dude

it's probaly a good idea to have that kind of syntax, even if we don't go any further. it's really confusing to read currently because we don't know what the params ARE, and we have to read the code to figure it out. this is bad currently but it's going to get a lot worse as pflavs get more compiclated.

the same thing goes for the port input packets... sometimes sending a ship through to a port with the fields filed in is the right thing to do , but othertimes you really want to [when do they resample after you put it on? ] 

write out longhand the param names and their values like a regular command, with autocomplete and everything. 

we talked about 

>@arrows target :document ignore (:myform :myfield)

and that's cool but it would be even cooler to have "machine learning" involved, because that's really cool stuff.

what's the downside? having two ways to send information to a port is kind of awkward. we have to redefine all the ports. and all the port segtypes etc which is harder. [@@@] <***> ($$$) |+++| /===/




*/