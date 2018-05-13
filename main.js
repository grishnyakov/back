let express = require('express');
let app = express();
let config = require('./bin/config');
let cookieParser = require('cookie-parser');
let session = require('express-session');
// создание хранилища для сессий

let bodyParser = require('body-parser');
let cors = require('cors');
let path  = require('path');

let sessionHandler = require('./bin/session_handler');
let store = sessionHandler.createStore();

//custom
let UserService = require("./bin/UserService"); //Пользовательские данные
let DataService = require("./bin/DataService"); //Данные основные


// use it before all route definitions
app.use(cors({
    origin: "http://localhost:8080",
    credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    store: store,
    resave: false,
    saveUninitialized: true,
    secret: "matherfacker3"
}));

let port = 7877;

app.use(express.static('client'));
app.listen(port, function () {
    console.log('Main is running on port ' + port);
});

app.use("/client",  express.static(__dirname + '/client'));


app.post('/login',function (req, res) {
    console.log("Client try LOGIN:", req.body);
    UserService.login(req.body.username,req.body.password,function (result, error) {
        if(!error && result) {
            //console.log("createSession:result",result);
            if(result.length > 0) {
                let username = result[0].login;

                req.session.username = username;
                res.send({success:true,username: username});
            }
        }
        else {
            res.send({success:"false"});
        }

    });


});
app.post('/logout',function (req, res) {
    console.log("Logout ");
    if(req.session)
        if(req.session.username) {
            console.log("req.session.username: ",req.session.username);
            req.session.username = '';
            res.send({success:true});
            console.log("success:true ");
        }
        else{
            res.send({success:false});
            console.log("success:false 1 - req.session.username is empty", req.session);
        }
    else {
        res.send({success:false});
        console.error("success:false - req.session is empty");
    }

});





app.post('/data/dangerlist',function (req, res) {
    console.log("client req getMessages");
    // if(req.session.username)
    DataService.getDangerList(req,res);
    // else res.status(403);
});
app.post('/data/messages',function (req, res) {
    console.log("client req getMessages");
   // if(req.session.username)
        DataService.getMessages(req,res);
   // else res.status(403);
});
app.post('/data/devices',function (req, res) {
    console.log("client req getDevices");
   // if(req.session.username)
        DataService.getDevices(req,res);
  //  else res.status(403);
});



app.post('/user/orginfo',function (req, res) {
    console.log("client reqest orginfo");
    // if(req.session.username)
    let user = req.body.username;
    UserService.getOrgInfo(user,function (result,error) {
        if(!error){
            res.send({"success":true , "data": result[0]});
        }
        else res.json({"success":false});
    });
    // else res.status(403);
});
