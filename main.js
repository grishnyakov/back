let express = require('express');
let app = express();
let config = require('./bin/config');
let cookieParser = require('cookie-parser');
let session = require('express-session');
// создание хранилища для сессий

let bodyParser = require('body-parser');
let cors = require('cors');
let path  = require('path');

let sessionHandler = require('../back/bin/session_handler');
let store = sessionHandler.createStore();

//custom
let UserService = require("./bin/UserService"); //Пользовательские данные
let DataService = require("./bin/DataService"); //Данные основные


// use it before all route definitions
app.use(cors({origin: config.GlobalVars.origin}));
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

app.use("/client",  express.static(__dirname + '/client'));


app.post('/login',function (req, res) {
    console.log("Client try LOGIN:", req.body);
    UserService.login(req.body.username,req.body.password,req,res);
});

app.post('/logout',function (req, res) {
    if(req.session)
        if(req.session.username) {
            req.session.username = '';
            res.send({success:true});
        }
        else{
            res.send({success:false});
        }
    else {res.send({success:false});}

});

app.post('/data/messages',function (req, res) {
    console.log("client req getMessages");
    DataService.getMessages(req,res);
});
app.post('/data/devices',function (req, res) {
    console.log("client req getDevices");
    //if(req.session.username)
        DataService.getDevices(req,res);
    //else res.send("Нет username");
});

app.listen(port, function () {
    console.log('Main is running on port ' + port);
});
