var loggedin = false;

var username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");


if (username.length > 1) {
  var navbar = document.getElementById("navbar");
  navbar.innerHTML = "<li><a href='#'>Hello " + username + "</a></li><li><a href='/logout'><span class='glyphicon glyphicon-log-out'></span> Logout</a></li>"
} else {
  loggedin = false;

}

var arr = ["<p>User Story: As an authenticated user, I can keep my polls and come back later to access them.<p>User Story: As an authenticated user, I can share my polls with my friends.<p>User Story: As an authenticated user, I can see the aggregate results of my polls.<p>User Story: As an authenticated user, I can delete polls that I decide I don't want anymore.<p>User Story: As an authenticated user, I can create a poll with any number of possible items.<p>User Story: As an unauthenticated or authenticated user, I can see and vote on everyone's polls.<p>User Story: As an unauthenticated or authenticated user, I can see the results of polls in chart form. (This could be implemented using Chart.js or Google Charts.)<p>User Story: As an authenticated user, if I don't like the options on a poll, I can create a new option.",
"<p>User Story: As an unauthenticated user, I can view all bars in my area.<p>User Story: As an authenticated user, I can add myself to a bar to indicate I am going there tonight.<p>User Story: As an authenticated user, I can remove myself from a bar if I no longer want to go there.<p>User Story: As an unauthenticated user, when I login I should not have to search again.",
"<p>User Story: I can view a graph displaying the recent trend lines for each added stock.<p>User Story: I can add new stocks by their symbol name.<p>User Story: I can remove stocks.<p>User Story: I can see changes in real-time when any other user adds or removes a stock. For this you will need to use Web Sockets.",
"User Story: I can view all books posted by every user.<p>User Story: I can add a new book.<p>User Story: I can update my settings to store my full name, city, and state.<p>User Story: I can propose a trade and wait for the other user to accept the trade.",
"User Story: As an unauthenticated user, I can login with Twitter.<p>User Story: As an authenticated user, I can link to images.<p>User Story: As an authenticated user, I can delete images that I've linked to.<p>User Story: As an authenticated user, I can see a Pinterest-style wall of all the images I've linked to.<p>User Story: As an unauthenticated user, I can browse other users' walls of images.<p>User Story: As an authenticated user, if I upload an image that is broken, it will be replaced by a placeholder image. (can use jQuery broken image detection)"
]

$("h3").mouseover(function(){
    $("#descr").css("visibility", "visible")
    if (/Voting/.test($(this).text())) $("#descr").html(arr[0])  
    else if (/Nightlife/.test($(this).text())) $("#descr").html(arr[1])  
    else if (/Chart/.test($(this).text())) $("#descr").html(arr[2])  
    else if (/Book/.test($(this).text())) $("#descr").html(arr[3])
    else if (/Pinterest/.test($(this).text())) $("#descr").html(arr[4])
})

$("h3").mouseleave(function(){
  $("#descr").css("visibility", "hidden")
})

