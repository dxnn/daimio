
// ugh hack ugh
D.string_to_svg_frag = function(string) {
  var div= document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
      frag= document.createDocumentFragment();
  div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg">' + string + '</svg>';
  while (div.firstElementChild.firstElementChild)
    frag.appendChild(div.firstElementChild.firstElementChild);
  return frag;
};


D.import_port_type('svg-move', {
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

D.import_port_type('svg-rotate', {
  dir: 'out',
  outside_exit: function(ship) {
    var element = document.getElementById(ship.thing)
    
    if(!element)
      return D.set_error('You seem to be lacking elementary flair')
    
    var x = typeof ship.x === 'number' ? ship.x : element.x.baseVal.value + (element.width.baseVal.value / 2)
      , y = typeof ship.y === 'number' ? ship.y : element.y.baseVal.value + (element.height.baseVal.value / 2)
      , a = ship.angle
      
    if(typeof a != 'number') {
      var ctm = element.getCTM()
      a = Math.atan2(ctm.b, ctm.a) / Math.PI * 180
    }
    
    if(typeof ship.dangle == 'number')
      a += ship.dangle
    
    element.setAttribute('transform', 'rotate(' + a + ' ' + x + ' ' + y + ')' )  
    
  }
})

D.import_port_type('svg-add-line', {
  dir: 'out',
  outside_exit: function(ship) {
    var element = document.getElementById(ship.thing)
    
    if(!element)
      return D.set_error('You seem to be lacking elementary flair')
    
    if(!element.getCTM)
      return D.set_error("That doesn't look like an svg element to me")
    
    var x1 = ship.x1 || 0
      , y1 = ship.y1 || 0
      , x2 = ship.x2 || 0
      , y2 = ship.y2 || 0
      , width = ship.width || 1
      , alpha = ship.alpha || 1
      , color = ship.color || 'black'
    
    var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    newLine.setAttribute('stroke-opacity', alpha)
    newLine.setAttribute('stroke-width', width)
    newLine.setAttribute('stroke', color)
    newLine.setAttribute('x1', x1)
    newLine.setAttribute('y1', y1)
    newLine.setAttribute('x2', x2)
    newLine.setAttribute('y2', y2)
    
    element.appendChild(newLine)
  }
})




