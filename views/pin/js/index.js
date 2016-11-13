var loggedin;
var tabs = $("#tabs");
var arr = [];
var flagfornewpin;
var mypins = false;
var changeflagoutput = {};
var cont;

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
  $("#tabs").empty();
  $("#tabs").append("<ul id='entries'></ul>");
  arr = [];
  $.ajax({
    url: url,
    method: 'GET',
    headers: {
      "token": document.cookie
    },
    success: function(data, status) {
      if (loggedin && mypins) {
        for (var props in data) { //initialize tabs
          var flag = data[props].flag;
          if (flag === "") flag = "Unordered";
          if (arr.indexOf(flag) < 0) {
            $("#entries").append("<li><a href='#" + flag + "'>" + flag + "</a><span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>");
            $("#tabs").append("<div class='field' id='" + flag + "'><button class='addnewpin btn btn-success'>Add new pin</button></div>");
            arr.push(flag)
          }
          $("#" + flag).append("<div class='pin'><div class='pinmain'><div class='id'>" + props + "</div><div class='image'><img src='" + data[props].pic + "' /></div><h4 class='title'>" + data[props].title + "</h4><p class='description'>" + data[props].descr + "</p><p class='owner'><b>" + data[props].owner + "</b></p></div><button class='changeflag' data-toggle='tooltip' title='Put it to another tab'>" + flag + "</button><a class='link' href='" + data[props].link + "'>" + data[props].link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
        }
        for (var a = 0; a < arr.length; a++) {
          var $grid = $('#' + flag).masonry({
            itemSelector: '.pin'
          })
          $grid.imagesLoaded().progress(function() {
            $grid.masonry('layout');
          });
        }
      } else {
        cont = data;
        $("#entries").append("<li><a href='#alltabsfromallusers'>All tabs from All users</a></li>");
        $("#tabs").append("<div class='field' id='alltabsfromallusers'></div>");
        for (var props in data) { //initialize tabs
          $("#alltabsfromallusers").append("<div class='pin'><div class='pinmain'><div class='id'>" + props + "</div><div class='image'><img src='" + data[props].pic + "' /></div><h4 class='title'>" + data[props].title + "</h4><p class='description'>" + data[props].descr + "</p><p class='owner'><b>" + data[props].owner + "</b></p></div><button class='changeflag'>" + data[props].flag + "</button><a class='link' href='" + data[props].link + "'>" + data[props].link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
        }
        var $grid = $('#alltabsfromallusers').masonry({
          itemSelector: '.pin'
        })
        $grid.imagesLoaded().progress(function() {
          $grid.masonry('layout');
        });
        $("#selectmenu").css("visibility", "visible");
      }

      if (loggedin) {
        $(".addnewpin").css("visibility", "visible")
        if (mypins) $("#add_tab").css("visibility", "visible")
        else $("#add_tab").css("visibility", "hidden")
        $(".pinit").prop("disabled", false)
      } else {
        $("#add_tab").css("visibility", "hidden")
        $(".addnewpin").css("visibility", "hidden")
        $(".pinit").prop("disabled", true)
      }

      var tabs = $("#tabs").tabs();
      //    $("#tabs").tabs({
      //      event: "mouseover"
      //    });
      tabs.find(".ui-tabs-nav").sortable({
        axis: "x",
        stop: function() {
          tabs.tabs("refresh");
        }
      });
      tabs.tabs("refresh");
      $('[data-toggle="tooltip"]').tooltip();
    }

  })
}

if (loggedin) {
  mypins = true;
  $("#menu").css("visibility", "visible")
  $("#searchfield").css("display", "none")
  loaddata("/pin/mypins")
} else {
  $("#menu").css("visibility", "hidden")
  $("#searchfield").css("display", "inline")
  loaddata("/pin/allpins");
}

$("#allpins").click(function() {
  mypins = false;
  $("#add_tab").css("visibility", "hidden")
  $("#searchfield").css("display", "inline")
  $("#tabs").tabs("destroy");
  loaddata("/pin/allpins");
})

$("#mypins").click(function() {
  mypins = true;
  $("#searchfield").css("display", "none")
  $("#selectmenu").css("visibility", "hidden")
  $("#tabs").tabs("destroy");
  loaddata("/pin/mypins");
})

$("#tabs").on("mouseover", ".pin", function() {
  if (loggedin) {
    $(this).find(".pinit").css("visibility", "visible")
    $(this).find(".unpinit").css("visibility", "visible")
  }
  $(this).find(".link").css("visibility", "visible")
  if ($(this).find(".owner").text() === username) {
    $(".pinit").css("visibility", "hidden");
  }
  if ($(this).find(".owner").text() !== username) $(".unpinit").css("visibility", "hidden")
})

$("#tabs").on("mouseleave", ".pin", function() {
  if (loggedin) {
    $(this).find(".pinit").css("visibility", "hidden")
    $(this).find(".unpinit").css("visibility", "hidden")
  }
  $(this).find(".link").css("visibility", "hidden")
})

tabs.on("click", "span.ui-icon-close", function() {
  if ($("#entries").children().length > 1) {
    var x = confirm("Do you really want to delete this tab with all pins?");
    if (x) {
      var panelId = $(this).closest("li").remove().attr("aria-controls");
      $("#" + panelId).remove();
      tabs.tabs("refresh");
    }
  }
});

$("#tabs").on("click", ".pin .pinit", function() {
  var id = $(this).parent().find(".id").text();
  var title = $(this).parent().find(".title").text();
  var pic = $(this).parent().find(".image img").attr("src");
  var link = $(this).parent().find(".link").text();
  var descr = $(this).parent().find(".description").text();
  var flag = $(this).parent().find(".changeflag").text();
  var owner = username;
  var output = {};
  output[id] = {
    title: title,
    pic: pic,
    link: link,
    descr: descr,
    flag: flag,
    owner: owner
  };
  $("#mainmessage").css("opacity", "1")
  $("#mainmessage").text("Pinned!");
  $.ajax({
    url: '/pin/pinit',
    method: "GET",
    headers: {
      "token": document.cookie
    },
    data: output,
    success: function() {
      $("#mainmessage").fadeTo(300, 0, function() {
        $("#mainmessage").text("");
      })
    }
  })
})

$("#tabs").on("click", ".pin .unpinit", function() {
  var output = {};
  output["id"] = $(this).parent().find(".id").text();
  $(this).parent().remove();
  $("#mainmessage").css("opacity", "1")
  $("#mainmessage").text("Unpinned!");
  $.ajax({
    url: '/pin/unpin',
    method: 'GET',
    headers: {
      "token": document.cookie
    },
    data: output,
    success: function() {
      $("#mainmessage").fadeTo(300, 0, function() {
        $("#mainmessage").text("");
      })
    }
  })
})

$("#tabs").on("click", ".pin .changeflag", function() {
  if (loggedin && mypins) {
    var id = $(this).parent().find(".id").text();
    var title = $(this).parent().find(".title").text();
    var pic = $(this).parent().find(".image img").attr("src");
    var link = $(this).parent().find(".link").text();
    var descr = $(this).parent().find(".description").text();
    var flag = $(this).parent().find(".changeflag").text();
    changeflagoutput = {};
    changeflagoutput[id] = {
        title: title,
        pic: pic,
        link: link,
        descr: descr,
        flag: flag,
        owner: username
      }
      // var offset = $(this).offset();
      //  var top = offset.top + "px";
      // var left = offset.left -200 + "px";
      //   $("#changeflagModal").css({'position': 'absolute', 'top': top, 'bottom': '0', 'right': '0', 'margin': '0px'})
    $("#changeflagmodalbody").empty();
    $("#changeflagModal").modal();
    for (var x = 0; x < arr.length; x++) {
      if (flag === arr[x]) $("#changeflagmodalbody").append("<p><button class='selectnewflag btn btn-primary' disabled>" + arr[x] + "</button><p>")
      else $("#changeflagmodalbody").append("<p><button class='selectnewflag btn btn-primary'>" + arr[x] + "</button><p>")
    }
  }
})

$("#changeflagModal").on("click", "#changeflagmodalbody .selectnewflag", function() {
  var newflag = $(this).text();
  var pos;
  var id = Object.keys(changeflagoutput)[0];
  var flag = newflag;
  var title = changeflagoutput[id].title;
  var pic = changeflagoutput[id].pic;
  var link = changeflagoutput[id].link;
  var descr = changeflagoutput[id].descr;
  var owner = changeflagoutput[id].owner;
  changeflagoutput[id]["flag"] = newflag;
  for (var a = 0; a < $(".id").length; a++) {
    var actid = $(".id").eq(a).text();
    if (id === actid) pos = a;
  }
  $.ajax({
    url: '/pin/changeflag',
    method: 'GET',
    headers: {
      "token": document.cookie
    },
    data: changeflagoutput,
    success: function(data, status) {
      $(".id").eq(pos).parent().parent().remove();
      var $modpin = $("<div class='pin'><div class='pinmain'><div class='id'>" + id + "</div><div class='image'><img src='" + pic + "' /></div><h4 class='title'>" + title + "</h4><p class='description'>" + descr + "</p><p class='owner'><b>" + owner + "</b></p></div><button class='changeflag' data-toggle='tooltip' title='Put it to another tab'>" + flag + "</button><a class='link' href='" + link + "'>" + link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
      $("#" + flag).append($modpin).masonry('appended', $modpin);
      $("#changeflagModal").modal("hide");
    }
  })
})

$("#tabs").on("click", ".pin .pinmain", function() {
  var picurl = $(this).parent().find(".image img").attr("src");
  var description = $(this).parent().find(".description").text();
  var ref = $(this).parent().find("a").text();
  var title = $(this).parent().find("h4").text();
  $("#pinModal").modal();
  $("#pinmodalbody").empty();
  $("#pinmodaltitle").text(title)
  $("#pinmodalbody").append("<img src='" + picurl + "' />")
  $("#pinmodalbody").append("<p>" + description + "<p>")
  $("#pinmodalbody").append("<p>Link: <a href='" + ref + "'>" + ref + "</a><p>")
})

tabs.on("click", ".field .addnewpin", function() {
  $("#addnewpinmessage").text("");
  $("#newpintitle").val("");
  $("#newpinpic").val("");
  $("#newpinlink").val("");
  $("#newpindescr").val("");
  $("#addnewpinimg").attr("src", "")
  $("#addnewpinModal").modal();
  flagfornewpin = $(this).parent().attr("id");
});

$("#ok").on("click", function() {
  var value = $("#newtab").val();
  if (value !== "") {
    $("#entries").append("<li><a href='" + value + "'>" + value + "</a><span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>");
    $("#newtab").val("");
    $("#tabs").append("<div class='field' id='" + value + "'><button class='addnewpin btn btn-success'>Add new pin</button></div>");
    tabs.tabs("refresh");
    arr = [];
    for (var j = 0; j < $("#entries").children().length; j++) {
      arr.push($("#entries").children().eq(j).find("a").text()) //to store tabs' order and preserve it
    }
  }
})

$("#addnewpinModal").on("click", "#addnewpinsave", function() {
  var title = $("#newpintitle").val();
  var pic = $("#newpinpic").val();
  var link = $("#newpinlink").val();
  var descr = $("#newpindescr").val();
  var output = {};
  $("#addnewpinimg").attr("src", "")

  if (title === "" || pic === "" || link === "") {
    $("#addnewpinmessage").text("Fill in all forms!")
  } else {
    output = {
      title: title,
      pic: pic,
      link: link,
      descr: descr,
      flag: flagfornewpin,
      owner: username
    };
    $.ajax({
      url: '/pin/newpin',
      type: "POST",
      headers: {
        "token": document.cookie
      },
      data: output,
      success: function() {
        $("#addnewpinmessage").html("<i>Pin saved</i>")
        $('#' + flagfornewpin).masonry({
          columnWidth: 50,
          itemSelector: '.pin'
        })
        setTimeout(function() {
          $("#addnewpinModal").modal("hide");
          var $newpin = $("<div class='pin'><div class='pinmain'><div class='image'><img src='" + pic + "' /></div><h4>" + title + "</h4><p class='description'>" + descr + "</p><p class='owner'><b>" + username + "</b></p><p>" + flagfornewpin + "</p></div><a href='" + link + "'>" + link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>");
          $("#" + flagfornewpin).append($newpin).masonry('appended', $newpin);
          $("#changeflagModal").modal("hide");
        }, 500)
      }
    })
  }
})

$("#addnewpinModal").on("blur", "#newpinpic", function() {
  var pic = $("#newpinpic").val();
  $("#addnewpinimg").attr("src", pic)
})

$("#searchbutton").click(function() {
  var search = $("#search").val();
  if (search.length > 2) {
    $("#search").val("");
    var keyword = new RegExp(search.toLowerCase());
    var count = 0;
    $("#tabs").append("<div class='field' id='" + search + "'></div>");
    for (var props in cont) {
      if (keyword.test(cont[props].title.toLowerCase()) || keyword.test(cont[props].descr.toLowerCase())) {
        $("#" + search).append("<div class='pin'><div class='pinmain'><div class='id'>" + props + "</div><div class='image'><img src='" + cont[props].pic + "' /></div><h4 class='title'>" + cont[props].title + "</h4><p class='description'>" + cont[props].descr + "</p><p class='owner'><b>" + cont[props].owner + "</b></p></div><button class='changeflag'>" + cont[props].flag + "</button><a class='link' href='" + cont[props].link + "'>" + cont[props].link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
        count++;
      }
    }
    if (count === 0) {
      alert("No hits found")
      $("#" + search).remove();
    } else {
      $("#tabs").tabs("destroy");
      $("#entries").append("<li><a href='#" + search + "'>" + search + "</a><span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>");
      var $grid = $('#' + search).masonry({
        itemSelector: '.pin'
      })
      $grid.imagesLoaded().progress(function() {
        $grid.masonry('layout');
      });
      $("#tabs").tabs();
      $("#tabs").tabs("option", "active", $("#entries li").length - 1);
    }
  }
})
