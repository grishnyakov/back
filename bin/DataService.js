/**
 * Created by Sergio on 15.04.2018.
 */
let config = require('./config');
let express = require('express');
let mysql = require('promise-mysql');
let UserService = require('./UserService');

let connectionDevMes;
connectionDevMes = mysql.createPool({
    host     : config.DataServiceConfig.db_host,
    port     : config.DataServiceConfig.db_port,
    user     : config.DataServiceConfig.db_user,
    password : config.DataServiceConfig.db_password,
    database : config.DataServiceConfig.db_database
});




module.exports.getMessages = function(req,res){
    let arr_devices = req.body.devices;
    console.log('module.exports.getMessages devices: ',arr_devices);
    // Создаётся объект promise
    let query = "SELECT * FROM groups_message INNER JOIN messages ON  groups_message.id = messages.id_group WHERE id_device = ? LIMIT 200";
    connectionDevMes.query(query,[arr_devices[0]], function(error, result, fields){
        if(!error) {
            res.json({success:true, messages:result});
        }
        else{
            returnError(res,Error.message);
        }
    });
};
module.exports.getDevices = function(req,res){
    let username = req.body.username;
    console.log('module.exports.getDevices username: ',username);
    // Создаётся объект promise
    let promise = new Promise((resolve, reject) => {
        if(username)
            UserService.getUserID(username,resolve);
        else reject("username is not defined");
    });
    promise.then(
        result => {
            // первая функция-обработчик - запустится при вызове resolve
            if(result[0]) {
                let id_user = result[0].id;

                connectionDevMes.query('SELECT * FROM devices WHERE id_user = ?',[id_user], function(error, result, fields){
                    if(!error) {
                        res.json({success:true, devices:result});
                    }
                    else{
                        returnError(res,Error.message);
                    }
                });
            }else{
                returnError(res,"USER NOT FOUND");
            }
        },
        error => {
            // вторая функция - запустится при вызове reject
            returnError(res,error);
        });

};

function returnError(res,error) {
    res.json({success:false, error:error});
}



