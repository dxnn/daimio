var http = require('http'),
    fs = require('fs'),
    static = require('node-static'),
    qs = require('querystring'),
    mongo = require('mongodb');
    
var DAML = require('daml');

var db = new mongo.Db('figviz', new mongo.Server('localhost', 27017, {auto_reconnect: true}));
var fileServer = new(static.Server)('./public');

var html = fs.readFileSync(__dirname+'/public/index.html.js', 'utf8');

DAML.db = db;
DAML.mongo = mongo;


var onerror = function(err) {
  return console.log(err);
};

var addNode = function(node) {
  db.collection('nodes', function(err, c) {
    c.count(function(err, count) {
      console.log("There are " + count + " records in the nodes collection.");
    });
    
    c.insert(node); // sync-style is ok here, because we're not waiting for confirmation
  
    c.find().toArray(function(err, items) {
      console.log('there are ' + items.length + 'records, yep');
    });
  });
};


// Configure our HTTP server
var app = http.createServer(function (req, res) {
  if(/public\//.test(req.url)) { // public files
    fileServer.serve(req, res);
    res.end();
    return;
  }
  if(req.url === '/favicon.ico') { // favicon
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    return;
  }
  
  if(req.method == 'POST') {
    var body = '';
    req.on('data', function (data) {
      body += data;
      if(body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function () {
      var POST = qs.parse(body); // no multipart forms // POST["node[name]"]

      global.output = [];
      
      // if(POST.daml) {
        // this_html += DAML.run(POST.daml);
        // TODO: allow text through here, not just json
      // } 
      DAML.add_global('POST', POST);
      DAML.run(POST.daml);

      setTimeout(function() {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(global.output));
      }, 300); // FIXME!!!
    });
    return;
  }
  
  res.writeHead(200, {"Content-Type": "text/html"});
  res.end(html);
});


db.open(function(err, db) {
  if(err) return onerror('DB refused to open');

  console.log('connected!');
  
  app.listen(8000);
});


    // // graceful shutdown
    // process.once('SIGUSR2', function () {
    //   gracefulShutdown(function () {
    //     process.kill(process.pid, 'SIGUSR2'); 
    //   })
    // });


/*

  so... the next thing to do is to get daml working in node. right? that seems to make sense. get it working here on the server.
  we'll need a way to catch it. maybe a /catch page for now. that seems nice and simple.
  so we'll route /catch to the DAML parser, and send back whatever it gives us. nice and simple.
  and then... we'll have to think about routing and content and 'pages'.
  but first, the parser catcher.
  and maybe some fancy chat-like things before rooms.
  
  OK! now we're gassing with cooks.
  - add DAML to the clientside
  - add {network send {"data find_noun"}} to the clientside
  - 

*/




// var qs = require('querystring');
// 
// function (request, response) {
//     if(request.method == 'POST') {
//         var body = '';
//         request.on('data', function (data) {
//             body += data;
//             if(body.length > 1e6) {
//                 // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
//                 request.connection.destroy();
//             }
//         });
//         request.on('end', function () {
// 
//             var POST = qs.parse(body);
//             // use POST
// 
//         });
//     }
// }

// var static = require('node-static');
// 
// //
// // Create a node-static server instance to serve the './public' folder
// //
// var file = new(static.Server)('./public');
// 
// require('http').createServer(function (request, response) {
//   request.addListener('end', function () {
//     //
//     // Serve files!
//     //
//     file.serve(request, response);
//   });
// }).listen(8080);




// var findit = require('findit');
// 
// findit.find('/dir/to/walk', function (file) {
//   //
//   // This function is called each time a file is enumerated in the dir tree
//   //
//   console.log(file);
// });

// 
// var app = require('http').createServer(function(req, res) {
//   var html;
//   
//   if(req.url === '/favicon.ico') {
//     res.writeHead(200, {'Content-Type': 'image/x-icon'} );
//     res.end();
//     console.log('favicon requested');
//     return;
//   }
//   console.log('hello');
//   
//   
//   mongoid = req.url.slice(1);
//   res.writeHead(200, {'Content-Type': 'text/html'});
//   
//   if(mongoid.length == 24) {
//     html = require('fs').readFileSync(__dirname+'/index.html.js', 'utf8');
//     html = html.replace(/mongoid_goes_here/g, mongoid);
//     res.end(html);
//   } else if(mongoid) {
//     html = require('fs').readFileSync(__dirname+'/index.html.js', 'utf8');
//     html = html.replace(/json_filename_goes_here/g, mongoid);
//     res.end(html);
//   } else {
//     res.end('sorry');
//   }
// });
// 
// app.listen(1338);




// // var nowjs = require("now");
// // var everyone = nowjs.initialize(app);
// 
// everyone.now.enqueueOnServer = function(command){
//   nowjs.getGroup(this.now.room).now.enqueueOnClient(command);
// };
// 
// everyone.now.connectToGameOnServer = function() {
//   var self = this, this_user, current_users = nowjs.getGroup(this.now.room).users;
//   
//   nowjs.getGroup(this.now.room).getUsers(function (user_ids) {
//     if(!user_ids.length) {
//       self.now.captain = true;
//     }
//     
//     console.log(user_ids, self.now.room, self.user.clientId);
//     
//     for (var i = 0; i < user_ids.length; i++) {
//       if(user_ids[i] == self.user.clientId) {continue;}
//       this_user = current_users[user_ids[i]].now;
//       console.dir(this_user);
//       nowjs.getGroup(self.now.room).now.addPlayerOnClient(self.now.id, self.now.thing_key);
//       self.now.addPlayerOnClient(this_user.id, this_user.thing_key, this_user.x, this_user.y);
//     }
//   });
//   
//   console.log("Joined: " + this.now.name);
//   // everyone.now.addPlayerOnClient(this.now.name);
// 
//   nowjs.getGroup(this.now.room).addUser(this.user.clientId);
//   nowjs.getGroup(this.now.room).now.enqueueOnClient('chat say name ' + this.now.name + ' phrase Hi_everyone!_' + this.now.name + '_has_joined_the_fun!');
// }
// 
// nowjs.on('connect', function(){
//   this.now.room = "room" + mongoid;
//   this.now.tryBootOnClient();
// });
// 
// 
// nowjs.on('disconnect', function(){
//   console.log("Left: " + this.now.name);
//   nowjs.getGroup(this.now.room).now.removePlayerOnClient(this.now.id);
//   nowjs.getGroup(this.now.room).now.enqueueOnClient('chat say name ' + this.now.name + ' phrase Has_left_the_maze.');
// });
// 
// everyone.now.changeRoom = function(newRoom){
//   nowjs.getGroup(this.now.room).removeUser(this.user.clientId);
//   nowjs.getGroup(newRoom).addUser(this.user.clientId);
//   this.now.room = newRoom;
//   console.log('asdf ' + newRoom);
//   // this.now.receiveMessage("SERVER", "You're now in " + this.now.room);
// }
// 

// 
// var mongodb = require('mongodb');
// var server = new mongodb.Server("127.0.0.1", 27017, {});
// new mongodb.Db('noder', server, {}).open(function (error, client) {
//   if(error) throw error;
//   var collection = new mongodb.Collection(client, 'test');
//   collection.insert({foo: 'bar'}, {safe:true}, function(err, objects) {
//     if(err) console.warn(err.message);
//     if(err && err.message.indexOf('E11000 ') !== -1) {
//       // this _id was already inserted in the database
//     }
//   });
// });
