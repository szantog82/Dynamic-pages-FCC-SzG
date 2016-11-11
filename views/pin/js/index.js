var loggedin;
var tabs = $("#tabs");
var arr = [];
var flagfornewpin;
var mypins;

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
          $("#" + flag).append("<div class='pin'><div class='pinmain'><div class='image'><img src='" + data[props].pic + "' /></div><h4>" + data[props].title + "</h4><p class='description'>" + data[props].descr + "</p><p class='owner'><b>" + data[props].owner + "</b></p><p>" + data[props].flag + "</p></div><a href='" + data[props].link + "'>" + data[props].link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
        }
      } else {
        $("#entries").append("<li><a href='#alltabsfromallusers'>All tabs from All users</a></li>");
        $("#tabs").append("<div class='field' id='alltabsfromallusers'></div>");
        for (var props in data) { //initialize tabs
          $("#alltabsfromallusers").append("<div class='pin'><div class='pinmain'><div class='image'><img src='" + data[props].pic + "' /></div><h4>" + data[props].title + "</h4><p class='description'>" + data[props].descr + "</p><p class='owner'><b>" + data[props].owner + "</b></p><p>" + data[props].flag + "</p></div><a href='" + data[props].link + "'>" + data[props].link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
        }
      }

      if (loggedin) {
        $(".addnewpin").css("visibility", "visible")
        $("#add_tab").css("visibility", "visible")
        $(".pinit").prop("disabled", false)
      } else {
        $("#add_tab").css("visibility", "hidden")
        $(".addnewpin").css("visibility", "hidden")
        $(".pinit").prop("disabled", true)
      }

      var tabs = $("#tabs").tabs();
    /*  $("#tabs").tabs({
        event: "mouseover"
      });*/
      tabs.find(".ui-tabs-nav").sortable({
        axis: "x",
        stop: function() {
          tabs.tabs("refresh");
        }
      });

      $(".pin").draggable({
        //  revert: true,
        stop: function(event, ui) {
          if (ui.top > 100) $(".pin").draggable("option", "revert", true);
          alert(JSON.stringify(ui.position))
        }
      });
    }
  })
}

if (loggedin) {
  mypins = true;
  $("#menu").css("visibility", "visible")
  loaddata("/pin/mypins")
} else {
  $("#menu").css("visibility", "hidden")
  loaddata("/pin/allpins");
}

$("#allpins").click(function(){
  mypins = false;
  loaddata("/pin/allpins");
})

$("#mypins").click(function(){
  mypins = true;
  loaddata("/pin/mypins");
})

$("#tabs").on("mouseover", ".pin", function() {
        if (loggedin) {
        $(this).find(".pinit").css("visibility", "visible")
        $(this).find(".unpinit").css("visibility", "visible")  
        }
        $(this).find("a").css("visibility", "visible")
        if ($(this).find(".owner").text() === username) $(".pinit").css("visibility", "hidden")
        if ($(this).find(".owner").text() !== username) $(".unpinit").css("visibility", "hidden")
      })

$("#tabs").on("mouseleave", ".pin", function() {
        if (loggedin) {
          $(this).find(".pinit").css("visibility", "hidden")
        $(this).find(".unpinit").css("visibility", "hidden")
        }
        $(this).find("a").css("visibility", "hidden")
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
          setTimeout(function() {
            $("#addnewpinModal").modal("hide");
            $("#" + flagfornewpin).append("<div class='pin'><div class='pinmain'><div class='image'><img src='" + pic + "' /></div><h4>" + title + "</h4><p class='description'>" + descr + "</p><p class='owner'><b>" + username + "</b></p><p>" + flagfornewpin + "</p></div><a href='" + link + "'>" + link + "</a><button class='pinit'>Pin it!</button><button class='unpinit'>Unpin!</button></div>")
          }, 500)
        }
      })
    }
  })

$("#addnewpinModal").on("blur", "#newpinpic", function() {
  var pic = $("#newpinpic").val();
  $("#addnewpinimg").attr("src", pic)
})

//$(#alltabsfromallusers.get().reverse()).masonry({})

/*
$(document).ready(function() {
  $('#alltabsfromallusers').masonry({
    columnWidth: function( containerWidth ) {
    return containerWidth / 5;
    },
    itemSelector: '.pin'
  })
});*/
