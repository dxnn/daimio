var http = require('http'),
    fs = require('fs'),
    static = require('node-static'),
    qs = require('querystring'),
    mongo = require('mongodb')
    
var DAML = require('daml')

var db = new mongo.Db('intfics', new mongo.Server('localhost', 27017, {auto_reconnect: true}))
var fileServer = new(static.Server)('./public')

var html = fs.readFileSync(__dirname+'/intfic_edit.html', 'utf8')

DAML.db = db
DAML.mongo = mongo

var onerror = function(err) {
  return console.log(err)
};

// Configure our HTTP server
var app = http.createServer(function (req, res) {
  if(/public\//.test(req.url)) { // public files
    fileServer.serve(req, res)
    res.end()
    return
  }
  if(req.url === '/favicon.ico') { // favicon
    res.writeHead(200, {'Content-Type': 'image/x-icon'} )
    res.end()
    return
  }
  
  if(req.method == 'POST') {
    var body = ''
    req.on('data', function (data) {
      body += data
      if(body.length > 1e6) req.connection.destroy()
    });
    req.on('end', function () {
      var POST = qs.parse(body) // no multipart forms // POST["node[name]"]

      global.output = []
      
      // if(POST.daml) {
        // this_html += DAML.run(POST.daml);
        // TODO: allow text through here, not just json
      // } 
      DAML.add_global('POST', POST)
      DAML.run(POST.daml)

      setTimeout(function() {
        res.writeHead(200, {"Content-Type": "application/json"})
        res.end(JSON.stringify(global.output))
      }, 300) // FIXME!!!
    })
    return
  }
  
  res.writeHead(200, {"Content-Type": "text/html"})
  res.end(html)
})


db.open(function(err, db) {
  if(err) return onerror('DB refused to open')

  console.log('connected!')
  
  app.listen(8007)
})
