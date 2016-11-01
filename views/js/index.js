var loggedin = false;

var username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");


if (username.length > 1) {
  var navbar = document.getElementById("navbar");
  navbar.innerHTML = "<li><a href='#'>Hello " + username + "</a></li><li><a href='/logout'><span class='glyphicon glyphicon-log-out'></span> Logout</a></li>"
} else {
  loggedin = false;

}
