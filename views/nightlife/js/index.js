var loggedin = false;
var people = [];  //this is where the list of participants per place will be stored

var username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");
if (username.length > 1) {
  loggedin = true;
  $("#navbar").empty();
  $("#navbar").append("<li><a href='#'>Hello " + username + "</a></li>")
  $("#navbar").append("<li><a href='/logout'><span class='glyphicon glyphicon-log-out'></span> Logout</a></li>")
} else {
  loggedin = false;
}

$("#submitlogin").on("click", function() {
  var login = $("input[name='login']").val();
  var password = $("input[name='password']").val();
  var output = {
    login: login,
    password: password
  }
  $.ajax({
    url: '/nightlife/login',
    type: 'POST',
    data: output,
    success: function(data, status) {
      $("input[name='login']").val("")
      $("input[name='password']").val("")
      if (data === "ok") {
        $("#loginmessage").text("Login successful");
        $("#loginmessage").fadeTo(800, 0, function() {
          document.getElementById("loginpanel").style.visibility = "hidden"
          username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");
          loggedin = true;
          $("#navbar").empty();
          $("#navbar").append("<li><a href='#'>Hello " + username + "</a></li>")
          $("#navbar").append("<li><a href='/logout'><span class='glyphicon glyphicon-log-out'></span> Logout</a></li>")
        });
      } else {
        $("#loginmessage").text("Login unsuccessful; try again!");
        $("#loginmessage").fadeTo(800, 0, function() {
          $("#loginmessage").text("");
          $("#loginmessage").css("opacity", "1");
        })
      }
    }
  })
})

$("#login").click(function() {
  if (document.getElementById("loginpanel").style.visibility !== "hidden") {
    document.getElementById("loginpanel").style.visibility = "hidden"
  } else {
    document.getElementById("loginpanel").style.visibility = "visible"
  }
})

$("#search").click(function() {
  $("#message").text("Searching...")
  $.ajax({
    url: '/nightlife/search',
    type: 'GET',
    data: {
      search: $("#searchfield").val()
    },
    success: function(dat, status) {
      $("#entries").empty();
      var barswithpeople = Object.keys(dat["1"]);  //this is where the id's are stored
      people = dat["1"];
      if (barswithpeople.length < 1) barswithpeople = [""];  // to avoid 'undefined' for participants if barswithpeople = []
      var bars = JSON.parse(dat["0"]).restaurants;
      $("#message").text("")
      for (var i = 0; i < bars.length; i++) {
        var participants = 0;  //number of participants
        var igo = "";
        for (var j = 0; j < barswithpeople.length; j++) {
          if (barswithpeople[j] === bars[i].restaurant.id) {
            participants = dat["1"][barswithpeople[j]].length
            if (dat["1"][barswithpeople[j]].indexOf(username) > -1) {
              igo = "I am going!";
            }
          }
        }
        $("#entries").append("<div class='entry'><img class='thumb' src='" + bars[i].restaurant.thumb + "' /><p class='name'><b>" + bars[i].restaurant.name + "</b></p><p class='props'>Address:" + bars[i].restaurant.location.address + "<b> User rating:</b> " +
          bars[i].restaurant["user_rating"]["aggregate_rating"] + "</p><p class='participating'><i><span class='participants'>" + participants + "</span> going there</i></p><p class='id'>" + bars[i].restaurant.id + "</p><p class='igo'>" + igo + "</p></div>")
      }

      $(".entry").on("click", function() {
        var output = {};
        var modpeople = [];  //for temporarily storing the change in the name list (remove or add current user)
        var selectedid = $(this).children().eq(4).text();
        var partnum = parseInt($(this).find(".participants").text());
        if (loggedin) {
          if ($(this).children().eq(5).text() === "") {
            $(this).children().eq(5).text("I am going!")
            modpeople = people[selectedid];
            if (modpeople === undefined) modpeople = [];
            modpeople.push(username);
            people[selectedid] = modpeople;
            partnum++;
            $(this).find(".participants").text(partnum.toString());
            output[selectedid] = username;
             $.ajax({
               url: '/nightlife/participate',
               type: 'GET',
               data: output
             })
          } else {
            $(this).children().eq(5).text("");
            modpeople = people[selectedid];
            var n = modpeople.indexOf(username);
            modpeople.splice(n,1);
            people[selectedid] = modpeople;
            partnum--;
            $(this).find(".participants").text(partnum.toString());
            output[selectedid] = username;
             $.ajax({
               url: '/nightlife/delparticipate',
               type: 'GET',
               data: output
             })
          }
        }
      })

      $(".participating").hover(function(event) {
        var selectedid = $(this).parent().children().eq(4).text();
        var iamgoing = false;
        if ($(this).parent().children().eq(5).text() === "I am going!") iamgoing = true;
        
        if (people[selectedid] === undefined || people[selectedid].length < 1) $("#tooltip").text("Nobody going there (yet)")
        else {
          $("#tooltip").text(people[selectedid].join(", ") + " going there")
        }
        $("#tooltip").css({
          "visibility": "visible",
          "opacity": 0.8
        })
        $("#tooltip").css({
          "left": event.pageX + 20 + "px",
          "top": event.pageY + "px"
        })
      }, function() {
        $("#tooltip").fadeTo(200, 0, function() {
          $("#tooltip").text("")
          $("#tooltip").css({
            "visibility": "hidden"
          })
        })
      })

    }
  })
})
