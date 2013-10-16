D.import_port_flavour('svg-rotate', {
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
