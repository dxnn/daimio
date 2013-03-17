var app = require('http').createServer(handler)
  , fs = require('fs')
  , static = require('node-static')
  , qs = require('querystring')
  , io = require('socket.io').listen(app)
  
io.set('log level', 2)
    
var DAML = require('daml')
var fileServer = new(static.Server)('./public')
var html = fs.readFileSync(__dirname+'/public/index.html.js', 'utf8')

var onerror = function(err) {
  return console.log(err)
};

// Configure our HTTP server 
function handler (req, res) {
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
    })
    
    req.on('end', function () {
      var POST = qs.parse(body); // no multipart forms // POST["node[name]"]

      // HEY!! just bounce only bounce check header for ME
      // then do like the DMG thing


      global.output = [];
      
      // if(POST.daml) {
        // this_html += DAML.run(POST.daml);
        // TODO: allow text through here, not just json
      // } 
      
      // DAML.add_global('POST', POST);
      DAML.run(POST.daml);
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify(global.output));
    });
    return;
  }
  
  res.writeHead(200, {"Content-Type": "text/html"});
  res.end(html);
}


console.log('connected!');
app.listen(8008);

var counter = 0
  , last_data = ''
  , password = 'kjh1234kljh1324uiyhiuhfs98dfosdfhk2j3hk2jhsdfya9sd8fyasdfjh2k3jh234239uvnm23'
  
io.on('connection', function (socket) {
  socket.on('primeme', function (data) {
    if(data.pwd != password) return false
    socket.on('bounce', function (data) {
      if(data.daml.indexOf('current_slide') > -1) {
        last_data = data
        // console.log(last_data, data.daml.indexOf('current_slide'))
      }
      io.sockets.emit('bounced', data)
      console.log(['bouncing', data])
    })
    io.sockets.emit('primer', {prime: true})
  })
  if(last_data) {
    io.sockets.emit('bounced', last_data)
  }
  console.log(++counter)
})