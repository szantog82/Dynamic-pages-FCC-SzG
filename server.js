 var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var bcrypt = require('bcrypt');
var mongodb = require('mongodb');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var cookieParser = require('cookie-parser')
var request = require('request')

var d = new Date();
var secret = "blablabla";
var token = "";
uri = "mongodb://" + process.env.PASS + "@ds033966.mlab.com:33966/szantog82";

app.use(cookieParser());
app.use(express.static('views'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.get('/', function(req, res){
    res.sendFile(__dirname + "/views/index.html")
})

//
//LOGIN-SIGNUP-LOGOUT
//

app.get('/login', function(req, res){
  res.sendFile(__dirname + "/views/login.html")
});

app.get('/logout', function(req,res){
  res.cookie("token", "");
  res.cookie("user", "");
   res.send("<html><body><p>You successfully signed out - redirecting back to home page...</p></body><script>setTimeout(function(){window.location = '/'},1000)</script></html>")
})

app.get('/signup', function(req,res){
     res.sendFile(__dirname + "/views/signup.html")
      
})

app.post('/signup', function(req, res){
  loginmatch = false;
  var login = req.body.login;
  var password = req.body.login;
  if (login.length < 5 || password.length < 5) {
    res.send("<html><body><p>Too short login/password - try again - redirecting to back...</p></body><script>setTimeout(function(){window.location = '/signup'},1000)</script></html>")
  }
  else {mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
            var users = db.collection('users');
            users.find({login: login}).toArray(function(err, data) {
            if (data.length > 0){
              res.send("<html><body><p>Choose another login - this is used - redirecting back...</p></body><script>setTimeout(function(){window.location = '/signup'},1000)</script></html>")
            }
            else {
              var hashedpassword = bcrypt.hashSync(password, 10);
              users.insert({
               "login": login,
               "password": hashedpassword,
               "date": d.toLocaleString()
              });
                token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 60) * 4,  //4 hours
                    data: login
                    }, secret);
                  res.cookie("token", token);
                  res.cookie("user", login);
                 res.send("<html><body><p>Signup successful - redirecting to home page...</p></body><script>setTimeout(function(){window.location = '/'},1000)</script></html>")
                console.log("New user added");
            }
          db.close();
          });
      });
  }
});

app.post('/login', function(req, res){
  var login = req.body.login;
  var password = req.body.password;
  mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
var users = db.collection('users');
users.find({login}).toArray(function(err, data) {
  if(err) console.log(err);
  if (data.length < 1) {
    res.send("<html><body><p>Login does not exist - redirecting back to login...</p></body><script>setTimeout(function(){window.location = '/login'},1000)</script></html>")
    db.close();
  }
  else {
          if (bcrypt.compareSync(password, data[0].password)){
                  token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 60) * 4,  //4 hours
                    data: login
                  }, secret);
                  res.cookie("token", token);
                  res.cookie("user", login);
                  console.log("'" + login + "' logged in")
                 res.send("<html><body><p>Login successful - redirecting to home page...</p></body><script>setTimeout(function(){window.location = '/'},1000)</script></html>")
          } else{
                res.send("<html><body><p>Password mismatch, try again - redirecting to login...</p></body><script>setTimeout(function(){window.location = '/login'},1000)</script></html>")
            
          }
}
  db.close();
  res.end()
});
});
});

//
// VOTING APP
//


app.get('/voting', function(req, res){
    res.sendFile(__dirname + "/views/voting/index.html")
})



app.post('/voting/stat', function(req, res){
  mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
        var votes = db.collection('votes');
        votes.find({}).toArray(function(err, data) {
              if (err) throw err;
              res.writeHead(200, {'content-type': 'text/json' });
              res.write(JSON.stringify(data));
              res.end('\n');
              db.close();
        })
  })
  
})

app.post('/voting/mystat', function(req, res){
  mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
            var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            var users = db.collection('users');
            var votes = db.collection('votes');
            var output = [];
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
                 res.writeHead(200, {'content-type': 'text/json' });
                 users.find({login: user}).toArray(function(err,data){
                   var userpolls = data[0].polls;
                   if (userpolls == undefined) {
                     var updateuser = data[0];
                     updateuser["polls"] = "";
                     users.update({login: user}, {$set: updateuser}, function(err,updatedata){if (err) throw err;})
                     res.write(JSON.stringify(output));
                      res.end('\n');
                      db.close();
                   }
                   else {
                      votes.find({}).toArray(function(error, totalpolls){
                      for (var a = 0; a < totalpolls.length; a++){
                        for (var b = 0; b < userpolls.length; b++){
                          if (totalpolls[a].title === userpolls[b]) output.push(totalpolls[a])
                        }
                      }
                      res.write(JSON.stringify(output));
                      res.end('\n');
                      db.close();
                        }) 
                      db.close();
                   }
                 })
                 
             }
            })
  })
})

app.get('/voting/submit', function(req, res){
  var input = req.query;
  mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
            var votes = db.collection('votes');
            var updatevote = {};
            var inputvote = input.vote;
            updatevote[inputvote] = parseInt(input.votecount);
            votes.update({ title: input.title},{$set: updatevote}, function(err, data){
              console.log(err);
            })
            db.close()
  })
  res.end()
  console.log("New vote submitted")
})

app.post('/voting/new', function(req, res){
  var input = req.body;
  var keys = Object.keys(input)
  var title = input.title;
var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  jwt.verify(tokensent, secret, function(err, decoded) {
  if (err) {console.log(err);
        res.send("denied");
  }
  else {
    console.log(decoded)
    res.send("ok")
    mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
        var votes = db.collection('votes');
        var users = db.collection('users');
        users.find({login: decoded.data}).toArray(function(err,founddata){
          if (err) throw err;
          var userpolls = founddata[0].polls;
          if (userpolls == undefined) userpolls = [];
          userpolls.push(title);
          users.update({login: decoded.data}, {$set: {polls: userpolls}}, function(err,updatedata){if (err) throw err;})
          for (var i = 1; i < keys.length; i++) {
             input[keys[i]] = 0;
          }
          votes.insert(input)
          res.end()
          console.log("Entry added")
          db.close()
        })
    })
  }
  })
})

app.post('/voting/remove', function(req, res){
  var titletoremove = Object.keys(req.body)[0];
    mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
            var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            var users = db.collection('users');
            var votes = db.collection('votes');
            jwt.verify(tokensent, secret, function(err, decoded) {
              if (err) {console.log(err);
                 res.send("denied");
               }
             else {
                votes.remove({title: titletoremove})
                users.find({login: decoded.data}).toArray(function(err,founddata){
                     if (err) throw err;
                    var userpolls = founddata[0].polls;
                    var remainingpolls = [];
                    for (var a = 0; a < userpolls.length; a++){
                      if (userpolls[a] !== titletoremove) {remainingpolls.push(userpolls[a])}
                    }
                    users.update({login: decoded.data}, {$set: {polls: remainingpolls}}, function(err,updatedata){if (err) throw err;})
             db.close()
             console.log("Entry removed")
             res.end("ok")
                })
             }
            })
            })
})

app.post('/voting/edit', function(req,res){
  var title = req.body.title;
  var questions = [];
  var output = {};
  for (var a = 0; a < (Object.keys(req.body)).length; a++) {
    if (Object.keys(req.body)[a] !== "title") questions.push(Object.keys(req.body)[a])
  }
   mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
            var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            var votes = db.collection('votes');
            jwt.verify(tokensent, secret, function(err, decoded) {
              if (err) {console.log(err);
                 res.send("denied");
               }
             else {
               votes.find({title: title}).toArray(function(err, founddata){
                 output["_id"] = founddata[0]["_id"];
                 output["title"] = founddata[0]["title"];
                 for (var a = 0; a < (Object.keys(founddata[0])).length; a++) {
                   var act = Object.keys(founddata[0])[a];
                     if (act !== "title" && questions.indexOf(act) > -1) output[act] = founddata[0][act];
                 }
                 for (var a = 0; a < questions.length; a++) {
                   if ((Object.keys(output)).indexOf(questions[a]) < 0) output[questions[a]] = 0;
                 }
                 votes.update({title: title}, {$set: output}, function(err,updatedata){if (err) throw err;})
                 console.log("Poll updated")
                 db.close()
               })
             }
})
})
  
  res.end()
})

//
// NIGHTLIFE APP
//

app.get('/nightlife', function(req, res){
    res.sendFile(__dirname + "/views/nightlife/index.html")
})

app.post('/nightlife/login', function(req,res){
  var login = req.body.login;
  var password = req.body.password;
  mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
  var users = db.collection('users');
  users.find({login}).toArray(function(err, data) {
  if(err) console.log(err);
  if (data.length < 1) {
    res.send("unsuccessful")
    console.log("Nightlife - login name not found")
    db.close();
  }
  else {
          if (bcrypt.compareSync(password, data[0].password)){
                  token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 60) * 4,  //4 hours
                    data: login
                  }, secret);
                  res.cookie("token", token);
                  res.cookie("user", login);
                  console.log("Nightlife - '" + login + "' logged in")
                 res.send("ok")
          } else{
                res.send("unsuccessful")
                console.log("Nightlife - wrong password")
            
          }
}
  db.close();
  res.end()
});
});
})

app.get('/nightlife/search', function(req, res){
  var query = req.query.search;
  request({
    url: 'https://developers.zomato.com/api/v2.1/locations?query=' + query,
    method: 'GET',
    headers: { 
        'user-key': process.env.KEY,
    }
}, function(error, response, body){
    if(error) console.log(error);
   else {
        var input = JSON.parse(body);
        var locationid = input["location_suggestions"][0]["city_id"];
        request({
          url: 'https://developers.zomato.com/api/v2.1/search?entity_id=' + locationid + '&entity_type=city&sort=rating&order=desc',
          method: 'GET',
          headers: {
            'user-key': process.env.KEY,
          }
        }, function(err, resp, data){
            if(err) console.log(err);
           else {
             mongodb.MongoClient.connect(uri, function(err, db) {
              if (err) throw err;
              var bars = (JSON.parse(data)).restaurants;
              var nightlife = db.collection('nightlife');
              nightlife.find({}).toArray(function(erro, inf) {
                if(erro) console.log(erro);
                var placeids = {};
                for (var a = 0; a < bars.length; a++) {
                    for (var b = 0; b < inf.length; b++) {
                      if (inf[b].people.length > 0 && inf[b].place === bars[a].restaurant.id) placeids[inf[b].place] = inf[b].people
                    }
                }
              var outputdata = {};
              outputdata["0"] = data;
              outputdata["1"] = placeids;
              console.log("Nightlife - sending place props.")
              res.send(outputdata);
              db.close();
           })
          })
        }
        })
      }
    })
})

app.get('/nightlife/participate', function(req, res){
  var id = Object.keys(req.query)[0];
  var name = req.query[id];
  mongodb.MongoClient.connect(uri, function(err, db) {
              if (err) throw err;
              var nightlife = db.collection('nightlife');
              nightlife.find({"place": id}).toArray(function(erro, data) {
                if(erro) console.log(erro);
                if (data.length < 1) {
                  var arr = [];
                  arr.push(name)
                  nightlife.insert({"place": id, "people": arr})
                  console.log("Nightlife - new place(" + id + ")-new participant(" + name + ") inserted")
                  db.close()
                  res.end()
                }
                else {
                 var arr = data[0].people;
                 arr.push(name);
                 nightlife.update({"place": id}, {$set: {"people": arr}})
                 console.log("Nightlife - '" + name + "' added to id:" + id + " place")
                 db.close()
                 res.end()
                }
              })
        })
})

app.get('/nightlife/delparticipate', function(req, res){
  var id = Object.keys(req.query)[0];
  var name = req.query[id];
 console.log("removing " + name + " from the list of participants...")
  mongodb.MongoClient.connect(uri, function(err, db) {
              if (err) throw err;
              var nightlife = db.collection('nightlife');
              nightlife.find({"place": id}).toArray(function(erro, data) {
                if(erro) console.log(erro);
                 var arr = data[0].people;
                 var newarr = [];
                 for (var i = 0; i < arr.length; i++) {
                   if (arr[i] !== name) newarr.push(arr[i])
                 }
                 arr.push(name);
                 nightlife.update({"place": id}, {$set: {"people": newarr}})
                 console.log("Nightlife - '" + name + "' removed from id:" + id + " place")
                 db.close()
                 res.end()
              })
        })
})


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});