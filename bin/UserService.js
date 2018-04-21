/**
 * Created by Sergio on 17.04.2018.
 */
let express = require('express');
let config = require('./config');
let DataService = require('./UserService');
let mysql = require('promise-mysql');

let connectionUsers = mysql.createPool({
    host     : config.UserServiceConfig.db_host,
    port     : config.UserServiceConfig.db_port,
    user     : config.UserServiceConfig.db_user,
    password : config.UserServiceConfig.db_password,
    database : config.UserServiceConfig.db_database
});




module.exports.login = function (login, password, req, res) {
    console.log("login",login,password);
    executeQueryHttp('SELECT * FROM users WHERE login=? && password=?',[ login, password ],createSession,req,res);
};
module.exports.logout = function (login, password,req, res) {
    console.log("logout",login,password);
    req.session.username = "";
    res.send({success:true});
};
module.exports.getUserID = function (username,callback) {
    executeQuery('SELECT id FROM users WHERE login=?',username,callback);
};




function createSession(result,error,req, res) {
    if(!error && result) {
        //console.log("createSession:result",result);
        if(result.length > 0) {
            let username = result[0].login;

            req.session.username = username;
            res.send({success:true,username: username});
            return;
        }
    }
    res.send({success:"false"});
    console.error("-----createSession: ERROR:",error);
}

//////////////////////////////////////////
function executeQueryHttp(query,params,callback,req,res) {
    if(query && callback && req && res) {
        connectionUsers.query(query,params,
            function(error, result, fields){
                if(!error) {
                    //console.log(result);
                    callback(result,error,req,res);
                }
                else{
                    callback(result,error,req,res);
                }
            });
    }
    else throw Error("Empty query or callback or client. Tell me it's.");

}
function executeQuery(query,params,callback) {
    if(query && callback) {
        connectionUsers.query(query,params,
            function(error, result, fields){
                if(!error) {
                    //console.log(result);
                    callback(result);
                }
                else{
                    callback(error);
                }
            });
    }
    else throw Error("Empty query or callback or client. Tell me it's.");

}


