var fs  = require('fs')
var app = require('http').createServer(handler)
var io  = require('socket.io').listen(app, { log: false })

var D = require('daimio')

function handler (req, res) {
  if(req.url === '/favicon.ico') { res.writeHead(200, {'Content-Type': 'image/x-icon'} ); res.end(); return; }

  var html = fs.readFileSync(__dirname+'/regurg.html', 'utf8') // TODO: move out of handler for production
  res.writeHead(200, {"Content-Type": "text/html"})
  res.end(html)
}

io.on('connection', function (socket) {

  socket.on('new-answer', function (data) {
    io.sockets.emit('add-solved', data)
    // console.log(['add-solved', data])
  })

  // socket.on('disconnect', function () {
  //   io.sockets.emit('disconnected', {user: user_id})
  // })
  //
  // io.sockets.emit('connected', {user: user_id})
})

app.listen(8008)