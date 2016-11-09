var loggedin; //to check whether the/an user is logged in or not
var visiblepolls = "all"; //when logged in, this is a selector whether the user wants to manage their own polls, or see all. Default is all.
var url = '/voting/stat'; //all polls are requested by default
var editing = false; //when saving polls, distinguish whether it is a new or an edited one
var aggrdata = [];  //For 'my aggregate polls', to store data and can be reached outside ajax call
$("#listheader").text("All polls")

function add(a, b) {
  return a + b;
}

var arr = [];

var listing = function() {
  
  $.ajax({
    url: url,
    type: 'POST',
    headers: {
      "token": document.cookie
    },
    success: function(data, status) {
      arr = [];
      aggrdata = data;
      for (var a = 0; a < data.length; a++) {
        arr.push(data[a].title);
      }
      $(".itemcontainer").remove()
      $.each(arr, function(index, value) {
        if (visiblepolls === "my") {
          $("#list").append("<div class='itemcontainer'><span class='item'>" + value + "</span><span class='glyphicon glyphicon-edit edititem'></span><span class='glyphicon glyphicon-remove removeitem'</span></div>")
        } else {
          $("#list").append("<div class='itemcontainer'><span class='item'>" + value + "</span></div>")
        }

      })
      
      $(".item").on("click", function() {
        $("#stattext").empty();
        $("#popup").css("visibility", "visible")
        var popup = document.getElementById("popup")

        $("#menu").html("Choose an answer <span class='caret'></span>")
        document.body.style.backgroundColor = "gray";
        $("#popup").fadeTo(300, 1);
        var pos;
        for (var i = 0; i < data.length; i++) {
          if (data[i].title === this.innerText) pos = i;
        }
        var keys = Object.keys(data[pos]);
        var votes = Object.values(data[pos]);
        votes = votes.slice(2, votes.length);
        $("#question").text(data[pos].title);
        for (var i = 2; i < keys.length; i++) {
          $("#dropdown").append("<li><a href='#'>" + keys[i] + "</a></li>")
        }

        var canvas = document.getElementById("stat");
        var ctx = canvas.getContext("2d");
        var lastend = 0;
        var myTotal = 0;
        var myColor = ['red', 'green', 'blue', 'BlueViolet', 'gray', 'black', 'Chocolate', 'DarkOrchid', 'DarkSlateBlue'];

        for (var e = 0; e < votes.length; e++) {
          myTotal += votes[e];
        }

        for (var i = 0; i < votes.length; i++) {
          ctx.fillStyle = myColor[i];
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, canvas.height / 2);
          ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, lastend, lastend + (Math.PI * 2 * (votes[i] / myTotal)), false);
          ctx.lineTo(canvas.width / 2, canvas.height / 2);
          ctx.fill();
          lastend += Math.PI * 2 * (votes[i] / myTotal);
        }

        var totalvotes = votes.reduce(add, 0);

        for (var i = 1; i < votes.length + 1; i++) {
          $("#stattext").append("<p style='color:" + myColor[i - 1] + "'>" + keys[i + 1] + ": " + Math.round(100 * votes[i - 1] / totalvotes) + "%</p>")
        }
        var choosen;
        $("li").on("click", function() {
          choosen = $(this).text()
          $("#menu").html($(this).text() + " <span class='caret'></span>")
        })

        $("#submitvote").click(function() {
          if (choosen === undefined) {
            $("#submitmessage").text("Choose an answer before clicking on Submit.")
          } else {
            $.ajax({
              url: "/voting/submit",
              type: "GET",
              data: {
                title: data[pos].title,
                vote: choosen,
                votecount: data[pos][choosen] + 1
              }
            })
            $("#submitmessage").text("Vote submitted. Closing window...")
            setTimeout(function() {
              $("#dropdown").empty();
              document.body.style.backgroundColor = "white"
              $("#popup").fadeTo(200, 0, function() {
                $("#submitmessage").text("")
                $("#popup").css("visibility", "hidden")
                location.reload(true)
              })
            }, 800)
          }
        })

      })
      
      $(".removeitem").on("click",function() {
         var text = $(this).parent().text();
         var r = confirm("Confirm to delete '" + text + "' poll")
        if (r) {
           $.ajax({
           url: "/voting/remove",
           type: "POST",
           headers: {
              "token": document.cookie
          },
          data: text
          })
          $(this).parent().remove();
        }
})

$(".edititem").click(function() {
  editing = true;
  var question = $(this).parent().children().text();
  var pos;
  var answers = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].title === question) pos = i;
  }
  for (var i = 0; i < (Object.keys(data[pos])).length; i++) {
    if ((Object.keys(data[pos]))[i] === "_id" || (Object.keys(data[pos]))[i] === "title") {} else {
      answers.push(Object.keys(data[pos])[i])
    }
  }
    for (var i = 0; i < answers.length; i++) {
      $("#newanswers").append("<input type='text' class='form-control newanswers' placeholder='Answer'>");
    }
  for (var i = 0; i < answers.length; i++) {
    $(".newanswers").eq(i).val(answers[i])
  }
  $("#newquestion").val(question);
  $("#newquestion").attr('readonly', true);
  $(".item").off("click");
  document.body.style.backgroundColor = "gray";
  $("#addpopup").css("visibility", "visible");
  $("#addpopup").fadeTo(300, 1);
})
      
    }
  })
}



$("#close").click(function() {
  $("#dropdown").empty();
  document.body.style.backgroundColor = "white"
  $("#popup").fadeTo(300, 0, function() {
    $("#popup").css("visibility", "hidden")
  })
})

$("#add").click(function() {
  $("#newanswers").append("<input type='text' class='form-control newanswers' placeholder='Answer'>")
  $("#newanswers").append("<input type='text' class='form-control newanswers' placeholder='Answer'>")
  $(".item").off("click")
  document.body.style.backgroundColor = "gray"
  $("#addpopup").css("visibility", "visible")
  $("#addpopup").fadeTo(300, 1)
})

$("#closeadd").click(function() {
  editing = false;
  $("#addpopup").fadeTo(300, 0, function() {
    $(".newanswers").remove();
    $("#newquestion").attr('readonly', false);
    $("#newquestion").val("");
    document.body.style.backgroundColor = "white"
    $("#addpopup").css("visibility", "hidden")
  })
})

$("#furtheranswer").click(function() {
  $("#newanswers").append("<input type='text' class='form-control newanswers' placeholder='Answer'>")
})

$("#removeanswer").click(function() {
  if ($(".newanswers").length > 2) $(".newanswers").last().remove();
})

$("#addnew").click(function() {
  var emptyfields = false;
  var url2;
  if (editing) url2 = '/voting/edit';
  else {
    url2 = '/voting/new'
  }
  editing = false;
  for (var i = 0; i < $(".newanswers").length; i++) {
    if ($(".newanswers").eq(i).val() === "") emptyfields = true;
  }

  if ($("#newquestion").val() === "" || emptyfields) {
    $("#message").text("Fill in all forms.")
  } else {
    var answers = [];
    for (var i = 0; i < $(".newanswers").length; i++) {
      answers[i] = $(".newanswers").eq(i).val();
    }
    var output = {
      "title": $("#newquestion").val()
    }
    for (var i = 0; i < answers.length; i++) {
      output[answers[i]] = 0;
    }
    console.log(JSON.stringify(output))
    $.ajax({
      url: url2,
      type: "POST",
      headers: {
        "token": document.cookie
      },
      data: output,
      success: function(data) {
        if (data === "denied") {
          alert("Sign in to create new poll");
          setTimeout(function() {
            document.body.style.backgroundColor = "white"
            $("#addpopup").fadeTo(1000, 0, function() {
              $("#addpopup").css("visibility", "hidden")
              $("#message").text("");
              location.reload(true)
            })
          }, 800)
        } else {
          $("#message").text("New poll saved. Closing window...")
          $("#newquestion").val("");
          $("#newanswers").val("");
          setTimeout(function() {
            $("#addpopup").fadeTo(100, 0, function() {
              document.body.style.backgroundColor = "white"
              $("#addpopup").css("visibility", "hidden")
              $("#message").text("");
              location.reload(true)
            })
          }, 100)
        }

      }
    })
  }
})




function add(a, b) {
  return a + b;
}

var username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");
if (username.length > 1) {
  loggedin = true;
  $("#navbar").empty();
  $("#navbar").append("<li><a href='#'>Hello " + username + "</a></li>")
  $("#navbar").append("<li><a href='/logout'><span class='glyphicon glyphicon-log-out'></span> Logout</a></li>")
  $("<button class='btn btn-default' style='margin-left: 20px' id='mypolls'>My polls</button>").insertAfter("#add")
  $("<button class='btn btn-default' style='margin-left: 20px' id='allpolls'>All polls</button>").insertAfter("#add")
  $("<button class='btn btn-default' style='margin-left: 20px' id='aggregate'>Aggregate my polls</button>").insertAfter("#mypolls")
} else {
  loggedin = false;
  $("#add").prop('disabled', true);

}

listing()

var list = document.querySelector("#list")

$("#mypolls").click(function() {
  visiblepolls = "my";
  $("#listheader").text("My polls")
  $("#aggregate").css("visibility", "visible")
  url = '/voting/mystat';
  listing()
})

$("#allpolls").click(function() {
  visiblepolls = "all";
  $("#listheader").text("All polls")
  $("#aggregate").css("visibility", "hidden")
  url = '/voting/stat';
  listing()
})

$("#aggregate").click(function() {
  $("#aggregatediv").empty();
  $("#aggregatediv").css("visibility", "visible")
  document.body.style.backgroundColor = "gray";
  $("#aggregatediv").fadeTo(300, 1);
  $("#aggregatediv").append("<span class='glyphicon glyphicon-remove' id='closeaggregate' style='float: right'></span>")
  for (var a = 0; a < aggrdata.length; a++) {
    $("#aggregatediv").append("<div class='jumbotron'><div class='row'><div class='col-md-10'><div><canvas id='stat" + a + "' /></div><div id='stattext" + a + "'></div></div></div></div>")
    var keys = Object.keys(aggrdata[a]);
    var votes = Object.values(aggrdata[a]);
    votes = votes.slice(2, votes.length);
    var canvas = document.getElementById("stat" + a);
    var ctx = canvas.getContext("2d");
    var lastend = 0;
    var myTotal = 0;
    var myColor = ['red', 'green', 'blue', 'BlueViolet', 'gray', 'black', 'Chocolate', 'DarkOrchid', 'DarkSlateBlue'];
    for (var e = 0; e < votes.length; e++) {
      myTotal += votes[e];
    }
    for (var i = 0; i < votes.length; i++) {
      ctx.fillStyle = myColor[i];
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, lastend, lastend + (Math.PI * 2 * (votes[i] / myTotal)), false);
      ctx.lineTo(canvas.width / 2, canvas.height / 2);
      ctx.fill();
      lastend += Math.PI * 2 * (votes[i] / myTotal);
    }
    var totalvotes = votes.reduce(add, 0);
    for (var i = 1; i < votes.length + 1; i++) {
      $("#stattext" + a).append("<p style='color:" + myColor[i - 1] + "'>" + keys[i + 1] + ": " + Math.round(100 * votes[i - 1] / totalvotes) + "%</p>")
    }
  }
  $("#closeaggregate").click(function() {
    $("#aggregatediv").fadeTo(300, 0, function() {
      document.body.style.backgroundColor = "white"
      $("#aggregatediv").css("visibility", "hidden")
    })
  })
})
