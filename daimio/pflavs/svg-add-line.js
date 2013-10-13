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




