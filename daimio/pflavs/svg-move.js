
// ugh hack ugh
D.string_to_svg_frag = function(string) {
  var div= document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
      frag= document.createDocumentFragment();
  div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg">' + string + '</svg>';
  while (div.firstElementChild.firstElementChild)
    frag.appendChild(div.firstElementChild.firstElementChild);
  return frag;
};


D.import_port_flavour('svg-move', {
  dir: 'out',
  outside_exit: function(ship) {
    var element = document.getElementById(ship.thing)
    
    if(!element)
      return D.set_error('You seem to be lacking elementary flair')
    
    if(element.x !== undefined) { // a regular element
      
      if(typeof ship.x == 'number')
        element.x.baseVal.value = ship.x
      if(typeof ship.y == 'number')
        element.y.baseVal.value = ship.y
    
      if(typeof ship.dx == 'number')
        element.x.baseVal.value += ship.dx
      if(typeof ship.dy == 'number')
        element.y.baseVal.value += ship.dy
    
    }
    else { // a g tag or some such
      
      var x = ship.x
        , y = ship.y
        , ctm = element.getCTM()
        
      if(typeof x != 'number')
        x = ctm.e
      if(typeof y != 'number')
        y = ctm.f
    
      if(typeof ship.dx == 'number')
        x += ship.dx
      if(typeof ship.dy == 'number')
        y += ship.dy
      
      element.setAttribute('transform', 'translate(' + x + ', ' + y + ')')
    }
        
  }
})
