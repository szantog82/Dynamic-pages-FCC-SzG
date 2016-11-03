 var socket = io();
 var seriesOptions = [];
 var names = ['MSFT', 'AAPL', 'GOOG'];
 var colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#8085e8', '#8d4653', '#91e8e1'];
 var i = 0;  //for colors
 var id = 101; //labelling series for removal
 var symbols = {"init": "100"};
 var chart = Highcharts.stockChart('container', {

        scrollbar: {
            enabled: true
        },

        navigator: {
            enabled: true
        },

        rangeSelector: {
            selected: 1
        },

        series: [{
            id: "100",
            name: 'init',
            data: [[1468093020000,1], [1478093020001,1]]
        }]
    });


     var output = [];
     $.ajax({
       url: '/stock/getdatas',
       method: 'get',
       data: output,
       success: function(data, status) {
         $("#stocks").append("<div class='props' id='" + id + "' style='border: 5px solid " + colors[i] + "'><p class='name'>" + data.props[0].Name + "<span class='remove'>(remove)</span></p><p>Symbol: <span class='symbol'>" + data.props[0].Symbol + "</span></p><p>Exhange: " + data.props[0].Exchange + "</p></div>")
          chart.addSeries({
            id: id.toString(),
            name: data.props[0].Symbol,
            color: colors[i],
            data: data.datas
        });
        symbols[data.props[0].Symbol] = id;
        i++;
        id++;
        chart.series[0].remove();
        chart.redraw();
       }
     });



 $("#add").click(function() {
   socket.emit("new chart", $("#new").val());
   $("#new").val("");
 })

 socket.on("chart update", function(data) {
   if (data === "Symbol not found") alert("Symbol not found")
   else {
      $("#stocks").append("<div class='props' id='" + id + "' style='border: 5px solid " + colors[i] + "'><p class='name'>" + data.props.Name + "<span class='remove'>(remove)</span></p><p>Symbol: <span class='symbol'>" + data.props.Symbol + "</span></p><p>Exhange: " + data.props.Exchange + "</p></div>")
        chart.addSeries({
                id: id.toString(),
                name: data.props.Symbol,
                color: colors[i],
                data: data.datas
          });
        symbols[data.props.Symbol] = id;
        i++;
        id++;
        if (i > 9) i = 0;
        chart.redraw()
   }
 });
 
$("#stocks").on("click", ".props .name .remove", function(){
   var symbol = $(this).parent().parent().find(".symbol").text();
   socket.emit("del chart", symbol);
 })
 
 socket.on("del chart emitted", function(data) {
   var removeid = symbols[data];
   chart.get(removeid.toString()).remove();
   chart.redraw()
   $("#" + removeid.toString()).remove();
 })
