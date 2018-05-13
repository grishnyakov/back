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
    let query ="";

    let params = req.body.params;
    let type = req.body.type_query; // groups, messages


    console.log('module.exports.getMessages: type, params: ',type,params);

    if(type === "groups")
        query = "SELECT * FROM groups_message WHERE id_device = ? LIMIT 50";

    if(type === "messages")
         query = "SELECT * FROM groups_message INNER JOIN messages ON  groups_message.id = messages.id_group WHERE id_device = ? LIMIT 200";

    // Создаётся объект promise
   connectionDevMes.query(query,[params], function(error, result, fields){
        if(!error)
            if(type === "groups")
                res.json({success:true, result:result});
            if(type === "messages") {
                let self_messages = {};

                //выбираем device_id

                for(let i=0; i<result.length; i++) {

                    let key = result[i].id_group;
                    if(!self_messages[key]) {
                        self_messages[key] =  {
                            id_device:0,
                            id_group:0,
                            t1:0,
                            t2:0,
                            ee:0,
                            vv:0,
                        };
                    }

                    self_messages[key].id_device = result[i].id_device;
                    self_messages[key].id_group = result[i].id_group;

                    if(result[i].time)
                        self_messages[key].time = result[i].time;

                    switch(result[i].type_parametr) {
                        case 't1': self_messages[key].t1 = result[i].value;  break;
                        case 't2': self_messages[key].t2 = result[i].value;  break;
                        case 'ee': self_messages[key].ee = result[i].value;  break;
                        case 'vv': self_messages[key].vv = result[i].value;  break;
                    }
                    //Object.assign(this.messages[arr[key].id_group], {'params_array': params_array}); //объединяем свойства
                }

                console.log("self_messages:",self_messages);

                res.json({success:true, result:self_messages});
        }
        else{
            returnError(res,error.message);
        }
    });
};
module.exports.getDangerList = function(req,res){
    let arr_devices = req.body.devices;
    console.log('module.exports.getDangerList devices: ',arr_devices);
    // Создаётся объект promise
    let query = "";
    for(let dev in arr_devices) {
        query += "(SELECT id_device, time,id_danger  " +
            "FROM groups_message " +
            "WHERE id_device='"+arr_devices[dev]+"' " +
            "ORDER BY time DESC " +
            "LIMIT 1) UNION ";

    }
    if(query.indexOf("UNION") > -1) {
        query = query.substr(0,query.length - 7);
        connectionDevMes.query(query, function(error, result, fields){
            if(!error) {
                res.json({success:true, danger_list:result});
                console.log('getDangerList send: ',result);
            }
            else{
                returnError(res,error.message);
            }
        });
    }


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
                        returnError(res,error.message);
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



