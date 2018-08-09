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



module.exports.registerUser = function (id_org, login, id_role, password, name1, name2, name3, number_tel, callback) {
    if(!id_org) id_org = 0; // без организации

    console.log("registerUser",id_org, login, id_role, password, name1, name2, name3, number_tel);
    executeQuery('INSERT INTO users (`id_org`, `login`, `id_role`, `password`, `name1`, `name2`, `name3`, `number_tel`) ' +
        'VALUES(?, ?, ?, ?, ?, ?, ?, ?)',[ id_org, login, id_role, password, name1, name2, name3, number_tel ],callback);
};

module.exports.createPlace = function (data, callback) {
    console.log("createPlace", ...data);
    executeQuery('INSERT INTO places (`place_id`,`lat`, `lng`, `formatted_address`) ' +
        'VALUES(?, ?, ?, ?)',[ ...data ],callback);
};
module.exports.getPlace = function (place_id, callback) {
    console.log("getPlace", place_id);
    executeQuery('SELECT * FROM places WHERE `place_id`=?',[ place_id ],callback);
};

module.exports.login = function (login, password, callback) {
    console.log("login",login,password);
    executeQuery('SELECT * FROM users WHERE login=? && password=?',[ login, password ],callback);
};
module.exports.logout = function (login, password,req, res) {
    console.log("logout",login,password);
    req.session.login = "";
    res.send({success:true});
};
module.exports.getUserIdByLogin = function (login, callback) {
    executeQuery('SELECT id FROM users WHERE login=?',login,callback);
};
module.exports.getUserLoginByID = function (id,callback) {
    executeQuery('SELECT login FROM users WHERE id=?',id,callback);
};

module.exports.getOrgInfo = function (login,callback) {
    executeQuery('SELECT organizations.* \n' +
        'FROM users INNER JOIN organizations on users.id_org = organizations.id \n' +
        'WHERE login = ?;',login,callback);
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
