var app = require('http').createServer(handler)
  , fs = require('fs')
  , static = require('node-static')
  , qs = require('querystring')
  , io = require('socket.io').listen(app, { log: false })
  , mongo = require('mongodb')
  , db = new mongo.Db('daimio', new mongo.Server('localhost', 27017, {auto_reconnect: true}), {w: 0});

// io.set('log level', 0)
    
var D = require('daimio')
D.db = db
D.mongo = mongo


// var fileServer = new(static.Server)('./public')
// var html = fs.readFileSync(__dirname+'/public/index.html.js', 'utf8')

var html = fs.readFileSync(__dirname+'/demos/turtle_net.html', 'utf8')

var onerror = function(err) {
  return console.log(err)
};

// Configure our HTTP server 
function handler (req, res) {
  // if(/public\//.test(req.url)) { // public files
  //   fileServer.serve(req, res);
  //   res.end();
  //   return;
  // }
  
  if(req.url === '/favicon.ico') { // favicon
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    return;
  }
  
  // if(req.method == 'POST') {
  //   var body = '';
  //   req.on('data', function (data) {
  //     body += data;
  //     if(body.length > 1e6) req.connection.destroy();
  //   })
  //   
  //   req.on('end', function () {
  //     var POST = qs.parse(body); // no multipart forms // POST["node[name]"]
  // 
  //     // HEY!! just bounce only bounce check header for ME
  //     // then do like the DMG thing
  // 
  // 
  //     global.output = [];
  //     
  //     // if(POST.daimio) {
  //       // this_html += D.run(POST.daimio);
  //       // TODO: allow text through here, not just json
  //     // } 
  //     
  //     res.writeHead(200, {"Content-Type": "application/json"});
  // 
  //     // D.add_global('POST', POST);
  //     D.run(POST.daimio, function(value) {
  //       res.end(JSON.stringify(global.output));
  //     });
  //     
  //   });
  //   return;
  // }
  
  res.writeHead(200, {"Content-Type": "text/html"});
  res.end(html);
}


db.open(function(err, db) {
  if(err) return onerror('DB refused to open: ', err);

  // console.log('connected!'); 
  
  app.listen(8000);
  
  // io.on('connection', function (socket) {
  //   socket.on('bounce', function (data) {
  //     io.sockets.emit('bounced', data)
  //     console.log(['bouncing', data])
  //   })
  // })
  
});

var last_user_id = 0
  // , password = 'kjh1234kljh1324uiyhiuhfs98dfosdfhk2j3hk2jhsdfya9sd8fyasdfjh2k3jh234239uvnm23'

io.on('connection', function (socket) {
    // 
    // socket.on('process', function (data) {
    //   if(!data.daimio) 
    //     return false
    //   
    //   D.run(data.daimio, function(value) { // TODO: add 'context' for run
    //     io.sockets.emit('return', value) // TODO: return just to asker [maybe use jDaimio for this?]
    //   })
    // })
  
  last_user_id += 1
  var user_id = last_user_id
  
  socket.on('bounce', function (data) {
    data.user = user_id
    io.sockets.emit('bounced', data)
    console.log(['bouncing', data])
  })
  
  socket.on('disconnect', function () {
    io.sockets.emit('disconnected', {user: user_id});
  });
    
  io.sockets.emit('connected', {user: user_id})
  
  for(var i=1; i < last_user_id; i++) {
    socket.emit('add-user', {user: i})
  }
})