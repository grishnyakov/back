let express = require('express');
let app = express();
let config = require('./bin/config');
let cookieParser = require('cookie-parser');
let session = require('express-session');
// создание хранилища для сессий

let bodyParser = require('body-parser');
let cors = require('cors');
let path = require('path');



let sessionHandler = require('./bin/session_handler');
let store = sessionHandler.createStore();

//custom
let UserService = require("./bin/UserService"); //Пользовательские данные
let DataService = require("./bin/DataService"); //Данные основные
let EmailService = require("./bin/EmailService"); //Данные основные

// use it before all route definitions
app.use(cors({
    //origin: "http://device.sit45.ru",
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

function sendResult(res,textError,fullError) {
    res.send({success:  !textError , error: textError || '', fullError: fullError || ''});
    if(textError || fullError){
        console.error("error",textError,fullError);
    }
}

app.use(express.static('client'));
app.listen(port, function () {
    console.log('Main is running on port ' + port);
});

app.use("/client", express.static(__dirname + '/client'));

app.post('/login', function (req, res) {
    console.log("Client try LOGIN:", req.body);
    UserService.login(req.body.login, req.body.password, function (result, error) {
        if (!error && result) {
            //console.log("createSession:result",result);
            if (result.length > 0 ) {
                if(result[0].status === 0){
                    req.session.id_user = result[0].id;
                    req.session.save();
                    res.send({success: true, login: result[0].login});
                }
                else  res.send({success: true, status: result[0].status});
            }
            else {
                sendResult(res,"Пользователя с таким логином не зарегистрировано");
            }
        }
        else {
            sendResult(res,'Непредвиденная ошибка авторизации',error);
        }

    });


});

app.post('/logout', function (req, res) {
    console.log("Logout ");
    if (req.session) {
        req.session.destroy(function (err) {
            if (!err) sendResult(res);
            else sendResult(res,'Не удалось выйти из системы', err);
        });
    }
    else
        sendResult(res,'Ошибка выхода - нет сессии');

});
app.post('/user/getSession', function (req, res) {
    console.log("Client try get Session:", req.body);
    if(req.session){
        if(req.session.id_user)
            UserService.getUserLoginByID(req.session.id_user, function (result, error) {
                if (!error && result) {
                    //console.log("createSession:result",result);
                    if (result.length > 0) {
                        res.send({success: true, login: result[0].login});
                    }
                    else sendResult(res,'Такого пользователя в системе не зарегистрировано');
                }
                else sendResult(res,"Ошибка получения сессии",error);
            });
        else sendResult(res);
    }
    else  sendResult(res,'Нет сессии');
});
app.post('/reguser', function (req, res) {
    console.log("Client try REGISTER NEW USER:", req.body);

    if (!req.body.login) sendResult(res,"Empty login");
    else if (!req.body.password)  sendResult(res,"Empty password");
    else if (!req.body.number_tel)  sendResult(res,"Empty number_tel");
    else if (!req.body.id_role)  sendResult(res,"Empty id_role");
    else if (!req.body.name1)  sendResult(res,"Empty name1");
    else if (!req.body.email)  sendResult(res,"Empty email");
    else {
        UserService.registerUser(
            req.body.id_org,
            req.body.login,
            req.body.id_role,
            req.body.password,
            req.body.name1,
            req.body.name2,
            req.body.name3,
            req.body.number_tel,
            req.body.email, function (result, error) {
                if (!error && result) {
                    //console.log("registerUser:result",result);
                    if (result.affectedRows > 0) {
                        let id = result.insertId;
                        EmailService.sendMail({
                            to: req.body.email,
                            subject: 'Успешная регистрация device.sit45.ru!',
                            html: `<p>`+req.body.name1+`, поздравляем с успешной регистрацией в нашей системе!<br>
                            Ваш логин: `+req.body.login+`<br>
                            Ваш пароль: `+req.body.password+`<br>
                            Но для входа в систему вам необходимо подтвердить адрес электронной почты<br>
                            device.sit45.ru</p>`
                        });
                        res.send({success: true, id: id});
                    }
                }
                else {
                    console.error(error);
                    sendResult(res,'Ошибка регистрации пользователя',error);
                }
            });
    }
});





app.post('/data/dangerlist', function (req, res) {
    console.log("client req getMessages");
    // if(req.session.login)
    DataService.getDangerList(req, res);
    // else res.status(403);
});
app.post('/data/messages', function (req, res) {
    console.log("client req getMessages");
    // if(req.session.login)
    DataService.getMessages(req, res);
    // else res.status(403);
});
app.post('/data/devices', function (req, res) {
    console.log("client req getDevices");
     //if(req.session.id)
        DataService.getDevices(req, res);
      //else res.status(403);
});
app.post('/data/devices/bind', function (req, res) {
    console.log("client bind device");
    // if(req.session.login)
    DataService.bindDevice(req, res);
    //  else res.status(403);
});


app.post('/user/orginfo', function (req, res) {
    console.log("client reqest orginfo");
    // if(req.session.login)
    let user = req.body.login;
    UserService.getOrgInfo(user, function (result, error) {
        if (!error) {
            res.send({"success": true, "orginfo": result[0]});
        }
        else res.send({"success": false});
    });
    // else res.status(403);
});
app.post('/user/validateEmail', function (req, res) {
    console.log("Client try validateEmail:", req.body);
    if(!req.body.email) return;
    //RESTFUL !!!
    switch (req.body.query){
        case "sendCode": sendCode(); break;
        case "checkCode": checkCode(); break;
        default: break;
    }
    function sendCode() {
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }
        let randomCode = getRandomInt(100000000,900000000);

        req.session.codeValidation = randomCode;
        req.session.save(function (err) {
            //console.log('---------SAVE CODE-------',err);
        });
        // Message object
        let message = {
            // Comma separated list of recipients
            to: req.body.email,

            // Subject of the message
            subject: 'Подтверждение регистрации',

            // HTML body
            html: `<p>Для того, чтобы подтвердить, что этот почтовый адрес принаджеит вам, необходимо ввести этот код в поле на сайте device.sit45.ru<br>
                  <h2> <b>`+randomCode+`<b/> </h2>
               </p>`,

        };
        EmailService.sendMail(message);
        sendResult(res);
    }
    function checkCode() {
        if(+req.session.codeValidation === +req.body.code){
            UserService.changeUserStatus(0,req.body.email,function (result) {
                if(result){
                    // Message object
                    let message = {
                        // Comma separated list of recipients
                        to: req.body.email,

                        // Subject of the message
                        subject: 'Подтверждение регистрации',

                        // HTML body
                        html: `<p>Поздравляем с успешной регистрацией! <br> <a href="http://device.sit45.ru">http://device.sit45.ru</a></p>`,
                    };
                    EmailService.sendMail(message);
                    sendResult(res);
                }
                else {
                    console.error(result);
                    sendResult(res,'Не удалось сменить статус пользователя');
                }
            });
        }
        else sendResult(res,'Неверный код');


    }
});

