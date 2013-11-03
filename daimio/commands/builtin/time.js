// commands for managing temporal anomalies

D.import_models({
  time: {
    desc: "Commands for exploding temporal quonsets",
    methods: {
      
      stampwrap: {
        desc: "",
        params: [
          {
            key: 'value',
            desc: 'A timestamp',
            type: 'number',
          }
        ],
        fun: function(value) {
          var date = value
                   ? new Date(value * 1000) // convert to milliseconds
                   : new Date()
          
          if(!date.valueOf())
            return D.set_error('Invalid timestamp')
            
          return { year:   date.getFullYear()
                 , month:  date.getMonth() + 1
                 , day:    date.getDate()
                 , hour:   date.getHours()
                 , minute: date.getMinutes()
                 , second: date.getSeconds()
                 , stamp:  date.getTime()
                 }
        },
      },
      
    }
  }
});