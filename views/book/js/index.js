var loggedin;
var mybooks = false;
var cont;
var lentdata;
var newisbn;

var username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");
if (username.length > 1) {
  loggedin = true;
  $("#navbar").empty();
  $("#navbar").append("<li><a href='#'>Hello " + username + "</a></li>")
  $("#navbar").append("<li><a href='/logout'><span class='glyphicon glyphicon-log-out'></span> Logout</a></li>")
} else {
  loggedin = false;
  $("#mybooks").css("display", "none")

}
var loaddata = function(url) {
  $("#main").empty();
  $("#borrowed").empty();
  $("#lent").empty();
  $.ajax({
    url: url,
    type: "GET",
    headers: {
      "token": document.cookie
    },
    success: function(data, status) {
      var users = Object.keys(data);
      var arr = []
      var lentbooks = [];
      if (url === "/book/all") cont = data;
      if (url  === "/book/my") lentdata = data;
      if (data.lent === undefined) lentbooks = [""];
      else lentbooks = Object.keys(data.lent);
      for (var a = 0; a < users.length; a++) {
        var allbooks = data[users[a]];
        for (var isbn in allbooks) {
          var lentbook = false;
          for (var x = 0; x < lentbooks.length; x++) {
            if (isbn === lentbooks[x]) lentbook = true;
          }
          if (lentbook) {
            var thumbnail = allbooks[isbn].thumbnail;
            var title = allbooks[isbn].title;
            var date = allbooks[isbn]["publishedDate"];
            if (title.length > 39) title = title.slice(0, 39) + "...";
            title = title + " (" + date.slice(0, 4) + ")";
            var description = allbooks[isbn].description;
            if (description.length > 200) description = description.slice(0, 200) + "...";
            if (description === "") description = "(No description found)"
            var lentfrom = allbooks[isbn].owner;
            $("#lent").append("<div class='item'><div class='isbn'>" + isbn + "</div><img class='thumb' src='" + thumbnail + "' /><p class='title'>" + title + "</p><p class='owner'>Owner: <span class='user'>" + lentfrom + "</span></p><div class='descr'>" + description + "</div><div class='giveback'><button class='btn btn-warning btn-sm givebackbutton'>Give it back!</button></div><div class='borrowed'>Lent from: " + lentfrom + "</div></div>")
          } else {
            var thumbnail = allbooks[isbn].thumbnail;
            var title = allbooks[isbn].title;
            var date = allbooks[isbn]["publishedDate"];
            if (title.length > 39) title = title.slice(0, 39) + "...";
            title = title + " (" + date.slice(0, 4) + ")";
            var description = allbooks[isbn].description;
            if (description.length > 200) description = description.slice(0, 200) + "...";
            if (description === "") description = "(No description found)"
            var borrowedto = allbooks[isbn].borrowed;
            if (borrowedto !== "" && mybooks) {
              $("#borrowed").append("<div class='item'><div class='isbn'>" + isbn + "</div><img class='thumb' src='" + thumbnail + "' /><p class='title'>" + title + "</p><p class='owner'>Owner: <span class='user'>" + users[a] + "</span></p><div class='descr'>" + description + "</div><div class='borrow'><button class='btn btn-default btn-sm borrowit'>Borrow it!</button></div><div class='borrowed'>Borrowed to: " + borrowedto + "</div></div>")
            } else {
              $("#main").append("<div class='item'><div class='isbn'>" + isbn + "</div><img class='thumb' src='" + thumbnail + "' /><p class='title'>" + title + "</p><p class='owner'>Owner: <span class='user'>" + users[a] + "</span></p><div class='descr'>" + description + "</div><div class='borrow'><button class='btn btn-default btn-sm borrowit'>Borrow it!</button></div></div>")
            }
          }
        }
      }

      $("#main").on("mouseenter", ".item", function() {
        if ($(this).find(".user").text() !== username && loggedin) $(this).find(".borrow").css("display", "inline")
        $(this).find(".descr").css("opacity", "1")
      })

      $("#main").on("mouseleave", ".item", function() {
        $(this).find(".borrow").css("display", "none")
        $(this).find(".descr").css("opacity", "0")
      })

      $(".borrowit").click(function() {
        var thisisbn = $(this).parent().parent().find(".isbn").text()
        var owner = $(this).parent().parent().find(".user").text()
        var thisbook = {};
        thisbook[thisisbn] = cont[owner][thisisbn];
        thisbook[thisisbn]["owner"] = owner;
        $.ajax({
          url: '/book/borrowit',
          type: 'GET',
          headers: {
            "token": document.cookie
          },
          data: thisbook,
          success: function(data, status) {
            alert("Borrowing started!")
            setTimeout(function() {
            location.reload(true)
          }, 800);
          }
        })
      })

$("#lent").on("mouseover", ".item", function() {
  $(this).find(".giveback").css("display", "inline")
})

$("#lent").on("mouseleave", ".item", function() {
  $(this).find(".giveback").css("display", "none")
})

$(".givebackbutton").click(function(){
  var thisisbn = $(this).parent().parent().find(".isbn").text()
  var owner = $(this).parent().parent().find(".user").text()
   var thisbook = {};
   thisbook[thisisbn] = lentdata.lent[thisisbn];
    $.ajax({
          url: '/book/giveback',
          type: 'GET',
          headers: {
            "token": document.cookie
          },
          data: thisbook,
          success: function(data, status) {
            alert("Book given back!")
            setTimeout(function() {
            location.reload(true)
          }, 800);
          }
        })
})

    }
  })
}

if (loggedin) {
  mybooks = true;
  $(".line").css("display", "inline");
  $("#navleft").empty();
  $("#navleft").append("<li><a href='#borrowed'>My borrowed books</a></li>");
  $("#navleft").append("<li><a href='#lent'>My lent books</a></li>");
  $("#navleft").append("<li><a href='#' data-toggle='modal' data-target='#myModal' id='addnew'>Add new book</a></li>");
  $("#navleft").append("<li><a href='#' data-toggle='modal' data-target='#myModal' id='approval'>Waiting for my approval</a></li>");
  $("#navleft").append("<li><a href='#' data-toggle='modal' data-target='#myModal' id='profile'>My profile</a></li>");
  loaddata("/book/my")
} else loaddata("/book/all");

$("#allbooks").click(function() {
  mybooks = false;
  $(".line").css("display", "none");
  $("#navleft").empty();
  loaddata("/book/all")
})

$("#mybooks").click(function() {
  if (loggedin) {
    mybooks = true;
    $(".line").css("display", "inline");
    $("#navleft").empty();
    $("#navleft").append("<li><a href='#borrowed'>My borrowed books</a></li>");
    $("#navleft").append("<li><a href='#lent'>My lent books</a></li>");
    $("#navleft").append("<li><a href='#' data-toggle='modal' data-target='#myModal' id='addnew'>Add new book</a></li>");
    $("#navleft").append("<li><a href='#' data-toggle='modal' data-target='#myModal' id='approval'>Waiting for my approval</a></li>");
    $("#navleft").append("<li><a href='#' data-toggle='modal' data-target='#myModal' id='profile'>My profile</a></li>");
    loaddata("/book/my")
  }
})

$("#navleft").on("click", "#approval", function() {
  $("#modalbody").empty();
  $("#save").css("visibility", "visible");
  $.ajax({
    url: "/book/approval",
    type: "GET",
    headers: {
      "token": document.cookie
    },
    success: function(data, status) {
      $("#modaltitle").text("Your requests and approvals")
      var borrows = data.borrow;
      $("#modalbody").append("<div id='borrowentries'></div>")
      $("#borrowentries").append("<h4>Your request(s): </h4>")
      for (var a = 0; a < borrows.length; a++) {
        if (borrows[a] === undefined || borrows[a] === null) {} else {
          var isbn = Object.keys(borrows[a])[0]
          var details = borrows[a][isbn];
          $("#borrowentries").append("<p>Book title: <i>" + details.title + "</i> from: <b>" + details.owner + "</b></p>")
        }
      }
      var lends = data.lend;
      $("#modalbody").append("<div id='lendentries'></div>")
      $("#lendentries").append("<h4>Requests waiting for your approval: </h4>")
      for (var a = 0; a < lends.length; a++) {
        if (lends[a] === undefined || lends[a] === null) {} else {
          var isbn = Object.keys(lends[a])[0]
          var details = lends[a][isbn];
          $("#lendentries").append("<div class='lendentry'><div class='isbn'>" + isbn + "</div><p>Book title: <i>" + details.title + "</i> to: <b><span class='lender'>" + lends[a].lend + "</span></b><button style='margin-left: 30px' class='btn btn-success accept' onclick='accept(this)'>Accept</button><button style='margin-left: 5px' class='btn btn-danger reject' onclick='reject(this)'>Reject</button><span style='margin-left: 30px' class='feedback'></span></p></div>")
        }
      }

    }
  })
})

$("#navleft").on("click", "#addnew", function() {
  $("#modalbody").empty();
  $("#save").css("visibility", "visible");
  $("#modaltitle").text("Add new book")
  $("#modalbody").append("<p>Enter ISBN here: <input type='text' id='searchfield'><button class='btn btn-default' id='search'>Search</button></p>")
  $("#modalbody").append("<p id='addnewmessage'></p>")

  $("#search").click(function() {
    $("#addnewmessage").text("")
    if ($("#searchfield").val().length < 10) $("#addnewmessage").text("Enter a valid number!")
    else {
      $.get('https://www.googleapis.com/books/v1/volumes?q=isbn:' + $("#searchfield").val(), function(data, status) {
        if (data["totalItems"] < 1) {
          $("#searchfield").val("")
          $("#addnewmessage").text("Book not found. Try again!")
        } else {
          newisbn = $("#searchfield").val()
          $("#searchfield").val("")
          $("#addnewmessage").text("Book found.")
          $("#modalbody").append("<p>Title: <b>" + data.items[0]["volumeInfo"]["title"] + "</b></p>")
        }
      })
    }
  })
})

$("#navleft").on("click", "#profile", function() {
  $("#save").css("visibility", "hidden");
  $("#modalbody").empty();
  $("#modaltitle").text("My profile")
  $.ajax({
    url: '/book/profile',
    type: "GET",
    headers: {
      "token": document.cookie
    },
    success: function(data, status) {
      $("#modalbody").append("<p>Your full name: <input type='text' id='fullname' size='40' placeholder='Write here your full name'></p>")
      $("#modalbody").append("<p>Your Address: <input type='text' id='address' size='40' placeholder='Write here your address'></p>")
      $("#modalbody").append("<p>Town/City: <input type='text' id='city' size='40' placeholder='Write here your city/town'></p>")
      $("#modalbody").append("<p>State/Country: <input type='text' id='state' size='40' placeholder='Write here your country/state'></p>")
      $("#modalbody").append("<p><button class='btn btn-primary' id='update'>Update</button></p>")
      $("#fullname").val(data.fullname);
      $("#address").val(data.address);
      $("#city").val(data.city);
      $("#state").val(data.state);
    }
  })

  $("#modalbody").on("click", "p #update", function() {
    var output = {};
    output["fullname"] = $("#fullname").val();
    output["address"] = $("#address").val();
    output["city"] = $("#city").val();
    output["state"] = $("#state").val();
    $.ajax({
      url: '/book/profileupdate',
      type: "POST",
      headers: {
      "token": document.cookie
    },
    data: output,
    success: function(data, status) {
      alert("Data updated")
    }
      
    })
  })

})

$("#save").click(function() {
  if ($("#modaltitle").text() === "Your requests and approvals") {
    var length = $("#lendentries").find(".lendentry").length;
    var output = {};
    for (var i = 0; i < length; i++) {
      var isbn = $("#lendentries").find(".lendentry").eq(i).find(".isbn").text();
      output[isbn] = {
        "feedback": $("#lendentries").find(".lendentry").eq(i).find(".feedback").text(),
        "lender": $("#lendentries").find(".lendentry").eq(i).find(".lender").text()
      }
    }
    $.ajax({
      url: "/book/approved",
      type: "POST",
      headers: {
        "token": document.cookie
      },
      data: output
    })
  } else if ($("#modaltitle").text() === "Add new book") {
    if ($("#addnewmessage").text() !== "Book found.") {} else {
      $.ajax({
        url: "/book/new",
        type: "GET",
        headers: {
          "token": document.cookie
        },
        data: {
          "isbn": newisbn
        },
        success: function(dat, status) {
          alert("New book added");
          setTimeout(function() {
            location.reload(true)
          }, 800);
        }
      })
    }
  }
})

var accept = function(x) {
  $(x).parent().parent().find(".feedback").html("<i>Accepted!</i>")
}

var reject = function(x) {
  $(x).parent().parent().find(".feedback").html("<i>Rejected!</i>")
}
