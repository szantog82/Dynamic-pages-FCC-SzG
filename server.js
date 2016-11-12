 var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var bcrypt = require('bcrypt');
var mongodb = require('mongodb');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var cookieParser = require('cookie-parser')
var request = require('request')
var http = require('http').Server(app);
var io = require('socket.io')(http);
var randomstring = require("randomstring");

var d = new Date();
var secret = process.env.SECRET;
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
  var password = req.body.password;
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

//
// CHART THE STOCK MARKET
//

app.get('/stock/', function(req, res){
  res.sendFile(__dirname + '/views/stock/index.html')
})

app.get('/stock/getdatas', function(req, res){
  
  request({
    method: 'GET',
    url: "http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/json?parameters={Normalized:false,NumberOfDays:365,DataPeriod:'Day',Elements:[{Symbol:'RGNX',Type:'price',Params:['ohlc']}]}",
  }, function (error, response, body) {
        if (error) console.log (error);
        var arr = [];
        var respbody = JSON.parse(body).Dates;
        for (var i = 0; i < respbody.length; i++) {
          var d = Date.parse(respbody[i])
          arr[i] = [d,JSON.parse(body).Elements[0].DataSeries.close.values[i]]
        }
        request({
          method: 'GET',
          url: "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=rgnx",
        }, function (err, resp, props) {
            if (err) console.log (err);
            var output = {props: JSON.parse(props), datas: arr}
            res.send(output)
        })
  })
})

io.on('connection', function(socket){
  socket.on("new chart", function(input){
    request({
          method: 'GET',
          url: "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=" + input,
        }, function (err, resp, properties) {
            if (err) console.log (err);
            if (properties.length < 4) io.emit("chart update", "Symbol not found");
            else {
              var props = JSON.parse(properties);
              console.log("Stock app - sending data for: " + props[0].Symbol)
              request({                  
                  method: 'GET',
                  url: "http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/json?parameters={Normalized:false,NumberOfDays:365,DataPeriod:'Day',Elements:[{Symbol:'" + input + "',Type:'price',Params:['ohlc']}]}",
              },  function (error, response, body) {
                  if (error) console.log (error);
                  var arr = [];
                  if (/DOCTYPE/.test(body)) io.emit("chart update", "Symbol not found")
                  else {
                      var respbody = JSON.parse(body).Dates;
                      for (var i = 0; i < respbody.length; i++) {
                          var d = Date.parse(respbody[i])
                          arr[i] = [d,JSON.parse(body).Elements[0].DataSeries.close.values[i]]
                      }
                      var output = {props: props[0], datas: arr}
                      io.emit("chart update", output);
                  }
            })
            }
  });
});
  socket.on("del chart", function(symbol){
    console.log("Removing symbol: " + symbol + " series...")
    io.emit("del chart emitted", symbol)
  })
});

//
// BOOK TRADING CLUB APP
//

app.get('/book', function(req, res){
  res.sendFile(__dirname + '/book/index.html')
})

app.get('/book/all', function(req, res){
  mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) throw err;
        var users = db.collection('users');
        users.find({}).toArray(function(err, data) {
              if (err) throw err;
              var output = {};
              for (var i = 0; i < data.length; i++) {
                if (data[i].mybooks == undefined) mybooks = [];
                else {output[data[i].login] = data[i].mybooks}
              }
              res.send(output);
              db.close();
        })
  })
})

app.get('/book/my', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               mongodb.MongoClient.connect(uri, function(err, db) {
                  if (err) throw err;
                  var users = db.collection('users');
                  users.find({login: user}).toArray(function(err, data) {
                      if (err) throw err;
                      var output = {};
                      output.lent = data[0].lent;
                          if (data[0].mybooks == undefined) mybooks = [];
                          else {output[data[0].login] = data[0].mybooks}
                      res.send(output);
                      db.close();
                  })
              })
            }
        })
})

app.get('/book/profile', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               mongodb.MongoClient.connect(uri, function(err, db) {
                  if (err) throw err;
                  var users = db.collection('users');
                  users.find({login: user}).toArray(function(err,data){
                  var output = {};
                  if (data[0].fullname === undefined) output["fullname"] = "";
                  else output["fullname"] = data[0].fullname
                  if (data[0].address === undefined) output["address"] = "";
                  else output["address"] = data[0].address
                  if (data[0].city === undefined) output["city"] = "";
                  else output["city"] = data[0].city
                  if (data[0].state === undefined) output["state"] = "";
                  else output["state"] = data[0].state
                  res.send(output)
                  })
               })
             }
        })
})

app.post('/book/profileupdate', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               mongodb.MongoClient.connect(uri, function(err, db) {
                  if (err) throw err;
                  var users = db.collection('users');
                  users.update({login: user}, {$set: req.body})
                  console.log("Book - profile updated for " + user)
                  res.end()
               })
             }
        })
})

app.get('/book/borrowit', function(req, res){
   var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               var isbn = Object.keys(req.query)[0];
               var owner = req.query[isbn].owner;
               var dataforborrower = {};
               dataforborrower = req.query;
               var dataforlender = {};
               dataforlender = req.query;
               dataforlender["lend"] = user;
               mongodb.MongoClient.connect(uri, function(err, db) {
                  if (err) throw err;
                  var users = db.collection('users');
                  var already = false;
                  users.find({login: user}).toArray(function(err,data){
                    if (data[0].borrow !== undefined) {
                        for (var y = 0; y < data[0].borrow.length; y++) {
                          if (data[0].borrow[y] == undefined || data[0].borrow[y] == null) {}
                          else if (isbn === Object.keys(data[0].borrow[y])[0]) already = true;
                        }
                    }
                    if (already) console.log("already pending borrowing")
                    else {
                      users.update({login: user}, {$addToSet:{borrow: dataforborrower}});
                      users.update({login: owner}, {$addToSet:{lend: dataforlender}});
                      console.log("Borrowing of " + isbn + " from " + owner + " to " + user + " started")
                    }
                  })
               })
             }
          })
  res.end()
})

app.get('/book/giveback', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               var isbn = Object.keys(req.query)[0];
               var owner = req.query[isbn].owner;
               var holder = {};
               holder["lent." + isbn] = req.query[isbn];
               mongodb.MongoClient.connect(uri, function(err, db) {
                  if (err) throw err;
                  var users = db.collection('users');
                  users.update({login: user}, {$unset: holder})
                  var holderforowner = {};
                  holderforowner["mybooks." + isbn + ".borrowed"] = "";
                  users.update({login: owner}, {$set: holderforowner});
                  console.log("Book - book isbn: " + isbn + " given back from " + user + " to " + owner);
                  res.end();
               })
             }
        })
  
})

app.get('/book/approval', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               mongodb.MongoClient.connect(uri, function(err, db) {
                  if (err) throw err;
                  var users = db.collection('users');
                  var already = false;
                  users.find({login: user}).toArray(function(err,data){
                    var output = {};
                    if (data[0].borrow === undefined) output["borrow"] = [];
                    else output["borrow"] = data[0].borrow;
                    if (data[0].lend === undefined) output["lend"] = [];
                    else output["lend"] = data[0].lend;
                    res.send(output)
                  })
               })
             }
          })
})

app.post('/book/approved', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               var keys = Object.keys(req.body);
               for (var a = 0; a < keys.length; a++) {
                 var lender = req.body[keys[a]]["lender"];
                 var isbn = keys[a];
                 if (req.body[keys[a]]["feedback"] === "Accepted!") {
                   mongodb.MongoClient.connect(uri, function(err, db) {
                      if (err) throw err;
                      var pos;
                      var users = db.collection('users');
                       users.find({login: user}).toArray(function(err, data){
                         if (err) console.log(err)
                        var bookprops = data[0].mybooks[isbn];
                        var collection = {};
                        collection["title"] = bookprops.title;
                        collection["authors"] = bookprops.authors;
                        collection["publishedDate"] = bookprops["publishedDate"];
                        collection["description"] = bookprops.description;
                        collection["thumbnail"] = bookprops["thumbnail"];
                        collection["borrowed"] = lender;
                        collection["owner"] = user;
                        var holderforborrower = {};
                        var holderforlender = {};
                        holderforborrower["mybooks." + isbn] = collection;
                        holderforlender["lent." + isbn] = collection;
                        users.update({login: user}, {$set: holderforborrower})
                        users.update({login: lender}, {$set: holderforlender})
                        var pos=0;
                        users.find({login: lender}).toArray(function(err, data1){
                         if (err) console.log(err)
                           for (var i = 0; i < data1[0].borrow.length; i++) {
                             if (data1[0].borrow[i] === null || data1[0].borrow[i] === undefined) {}
                            else if (Object.keys(data1[0].borrow[i])[0] === isbn) pos = i;
                           }
                           var holder = {};
                           holder["borrow." + pos] = "";
                           users.update({login: lender}, {$unset: holder})
                           users.find({login: user}).toArray(function(err, dataa){
                              if (err) console.log(err)
                                 for (var i = 0; i < dataa[0].lend.length; i++) {
                                   if (dataa[0].lend[i] === null || dataa[0].lend[i] === undefined) {}
                                   else if (Object.keys(dataa[0].lend[i])[0] === isbn) pos = i;
                                 }
                                var holder = {};
                                holder["lend." + pos] = "";
                                var users = db.collection('users');
                                users.update({login: user}, {$unset: holder});
                                console.log("Book - Accepted isbn: " + isbn + ", by: " + user + ", received: " + lender)
                             db.close();
                             res.end()
                           })
                       })
                       })
                   })
                 }
                 
                 else if (req.body[keys[a]]["feedback"] === "Rejected!") {
                      mongodb.MongoClient.connect(uri, function(err, db) {
                      if (err) throw err;
                      var pos;
                      var users = db.collection('users');
                       users.find({login: lender}).toArray(function(err, data){
                         if (err) console.log(err)
                           for (var i = 0; i < data[0].borrow.length; i++) {
                              if (Object.keys(data[0].borrow[i])[0] === isbn) pos = i;
                           }
                           var holder = {};
                           holder["borrow." + pos] = "";
                           users.update({login: lender}, {$unset: holder})
                           users.find({login: user}).toArray(function(err, dataa){
                              if (err) console.log(err)
                                 for (var i = 0; i < dataa[0].lend.length; i++) {
                                   if (Object.keys(dataa[0].lend[i])[0] === isbn) pos = i;
                                 }
                                var holder = {};
                                holder["lend." + pos] = "";
                                var users = db.collection('users');
                                users.update({login: user}, {$unset: holder});
                                console.log("Book - Rejected isbn: " + isbn + ", by: " + user + " (would have been received: " + lender + ")")
                             db.close();
                             res.end()
                           })
                       })
                  })
              }
            }
         }
    })
})

app.get('/book/new', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
                mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                var actisbn = req.query.isbn;
                users.find({login: user}).toArray(function(err, data){
                  var arr = Object.keys(data[0].mybooks);
                 if (arr.indexOf(actisbn) > -1) console.log("Book - duplicate danger; " + actisbn + " was not added twice to " + user)
                 else {               
                    var collection = {}
                    var url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + actisbn;
                  request(url, function (error, response, body) {
                      if (error) console.log(error)
                      collection["borrowed"] = ""
                      collection["title"] = JSON.parse(body).items[0]["volumeInfo"].title;
                      collection["authors"] = JSON.parse(body).items[0]["volumeInfo"].authors;
                      collection["publishedDate"] = JSON.parse(body).items[0]["volumeInfo"]["publishedDate"];
                      if (JSON.parse(body).items[0]["volumeInfo"].description === null || JSON.parse(body).items[0]["volumeInfo"].description === undefined) collection["description"] = "";
                      else collection["description"] = JSON.parse(body).items[0]["volumeInfo"].description;
                      collection["thumbnail"] = JSON.parse(body).items[0]["volumeInfo"]["imageLinks"]["thumbnail"];
                      var holder = {};
                      holder["mybooks." + actisbn] = collection;
                      users.update({login: user}, {$set: holder})
                      console.log("Book - " + actisbn + " added to " + user + "'s collection" )
                      res.end();
                  })
                 }
              })
            })
          }
    })
})


//
// PINTEREST CLONE APP
//

app.get('/pin', function(req, res){
  res.sendFile(__dirname + "/views/pin/index.html")
})

app.get('/pin/mypins', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
               var user = decoded.data;
               mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                users.find({login: user}).toArray(function(err, data){
                  var output = {};
                if (data[0].mypins === undefined || data[0].mypins === undefined) {}
                else output = data[0].mypins;
                db.close();
                res.send(output)
                })
               })
             }
          })
})

app.get('/pin/allpins', function(req, res){
   mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                var output = {};
                users.find({}).toArray(function(err, data){
                  for (var a = 0; a < data.length; a++) {
                    for (var props in data[a].mypins) {
                      output[props] = data[a].mypins[props]
                    }
                  }
                  db.close();
                  res.send(output);
                })
   })
})

app.post('/pin/newpin', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
              var user = decoded.data;
              var holder = {};
              holder["mypins." + randomstring.generate(10)] = req.body;
              mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                users.update({login: user}, {$set: holder});
                db.close();
              res.send("ok")
              console.log("Pin - New pin added")
              })
             }
          })
})

app.get('/pin/pinit', function(req, res){
  var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
              var user = decoded.data;
              var id = Object.keys(req.query)[0];
              var holder = {};
              holder["mypins." + id] = req.query[id];
              console.log(holder)
              mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                users.update({login: user}, {$set: holder});
                db.close();
              res.send("ok")
              console.log("Pin - New pin added")
              })
             }
          })
})

app.get('/pin/changeflag', function(req, res){
 var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
              var user = decoded.data;
              mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                var holder = {};
                var id = Object.keys(req.query)[0];
                var newflag = req.query[id].flag;
                holder["mypins." + id + ".flag"] = newflag;
                users.update({login: user}, {$set: holder});
                db.close();
                res.send("ok")
                console.log("Pin - Pin moved to another tab")
              })
             }
          })
})

app.get('/pin/unpin', function(req, res){
 var tokensent = (req.headers.token).replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            jwt.verify(tokensent, secret, function(err, decoded) {
            if (err) {console.log(err);
                res.send("denied");
           }
             else {
              var user = decoded.data;
              mongodb.MongoClient.connect(uri, function(err, db) {
                if (err) throw err;
                var users = db.collection('users');
                var holder = {};
                var id = req.query["id"];
                holder["mypins." + id] = "";
                users.update({login: user}, {$unset: holder});
                db.close();
                res.send("ok")
                console.log("Pin - Pin unpinned")
              })
             }
          })
})

var listener = http.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

/*var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});*/

