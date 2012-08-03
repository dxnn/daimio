<!DOCTYPE html> 
<html> 
<head> 
  <link rel="stylesheet" href="http://sherpa.local/~dann/katsu/nodely/css/styles.css" type="text/css" media="screen" title="no title" charset="utf-8">
  <link rel="stylesheet" href="http://sherpa.local/~dann/katsu/nodely/css/bootstrap.min.css" type="text/css" media="screen" title="no title" charset="utf-8">
  
  <title>FigViz</title>
  
  <script type="text/javascript" src="public/__underscore.js"></script>
  <script type="text/javascript" src="public/__jquery.js"></script>
  
</head>
<body id="">
  
  <form method="post" accept-charset="utf-8">
    <label for="node_name">Node name</label>
    <input type="text" name="node[name]" value="" id="node_name">
    <label for="node_body">Node body</label>
    <input type="text" name="node[body]" value="" id="node_body">
    
    <input type="submit" name="submit" value="Add">
    <textarea name="commands" style="display:none">
      {begin verbatim | process escape}
        {node add name #node_name}
      {end verbatim}
    </textarea>
  </form>
  
  <p>Node List</p>
  {node find}
  
</body>
</html>