/**
 * @author dann toliver
 * @requires jQuery
 */

var jDaimio = {
  metadata: []
}

// TODO: make this better
var scr=document.getElementsByTagName('script');
var src=scr[scr.length-1].getAttribute("src");


jDaimio.loadMetadata = function() {
  jDaimio.process(
    "{myself fetch_metadata}",
    function(result) {
      jDaimio.metadata = response;
      $(document).trigger('load_metadata.jDaimio');
  });
}

jDaimio.fetchMetadata = function(key, callback) {
  jDaimio.process(
    "{myself fetch_metadata key #key}",
    {key: key},
    callback
  );
}


jDaimio.setMetadata = function(key, value) {
  jDaimio.metadata[key] = [value];
  jDaimio.process(
    "{myself set_metadata key #key value #value}",
    {key: key, value: value}
  );
}

jDaimio.removeMetadata = function(key) {
  delete jDaimio.metadata[key];
  jDaimio.process(
    "{myself remove_metadata key #key}",
    {key: key}
  );
}


jDaimio.process = function(commands, vars, callback) {
  post_data = {daml: commands};

  if(typeof(vars) == 'function') {
    callback = vars;
  } else {
    jQuery.extend(post_data, vars);
  }
  
  $.post('/', // FIXME: MEGAHACK!!!!
    post_data,
    function(response) {
      jDaimio.logStuff(response);
      if(typeof(callback) == 'function') {
        callback(response);
      }
    },
    'json'
  );
}


jQuery.fn.daimioLoad = function(commands, vars) {
  post_data = {commands: commands};
  jQuery.extend(post_data, vars);
  var $this = this;

  $.post(src + "/../../hermes.php", 
    post_data,
    function(response) {
      jDaimio.logStuff(response);
      $this.each(function() {
        $(this).html(response.results);
      });
    },
    'json'
  );

  return this;
};


jQuery.fn.daimioSubmit = function(callback) {
  var $this = this;
  var post_data = $this.serialize();

  $.post(src + "/../../hermes.php", 
    post_data,
    function(response) {
      jDaimio.logStuff(response);
      if(typeof(callback) == 'function') {
        callback(response.results, response);
      }
    },
    'json'
  );

  return this;
};


jDaimio.logStuff = function(response) {
  if(response.notices) {
    console.log('notice', response.notices);
  }
  if(response.warnings) {
    console.log('warning', response.warnings);
  }
  if(response.errors) {
    console.log('error', response.errors);
  }
}

