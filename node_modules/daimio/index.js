// D package packer thing

if (typeof exports !== 'undefined') {

  var D = require('./daimio');
  module.exports = D;

  // something like this might work:
  ~function() {
  
    var fs = require('fs');
    var vm = require('vm');

    var includeInThisContext = function(path) {
        var code = fs.readFileSync(path);
        vm.runInThisContext(code, path);
    }.bind(this);

    fs.readdirSync(__dirname + '/handlers').forEach(function(filename){
      if (!/\.js$/.test(filename)) return;
      includeInThisContext(__dirname+"/handlers/"+filename); // FIXME!!!!!
    });

  }()
}

// fs.readdirSync(__dirname + '/models').forEach(function(filename){
//   if (!/\.js$/.test(filename)) return;
//   includeInThisContext(__dirname+"/models/"+filename);
// });
