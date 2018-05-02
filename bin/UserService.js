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




module.exports.login = function (login, password, callback) {
    console.log("login",login,password);
    executeQuery('SELECT * FROM users WHERE login=? && password=?',[ login, password ],callback);
};
module.exports.logout = function (login, password,req, res) {
    console.log("logout",login,password);
    req.session.username = "";
    res.send({success:true});
};
module.exports.getUserID = function (username,callback) {
    executeQuery('SELECT id FROM users WHERE login=?',username,callback);
};

module.exports.getOrgInfo = function (username,callback) {
    executeQuery('SELECT organizations.* \n' +
        'FROM users INNER JOIN organizations on users.id_org = organizations.id \n' +
        'WHERE login = ?;',username,callback);
};



function executeQuery(query,params,callback) {
    if(query && callback) {
        connectionUsers.query(query,params,
            function(error, result, fields){
                if(!error) {
                    console.log(result);
                    callback(result,error);
                }
                else{
                    console.error(result);
                    callback(result,error);
                }
            });
    }
    else throw Error("USERSERVICE:executeQuery - Empty query or callback. Tell me it's.");

}
