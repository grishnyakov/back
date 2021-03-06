/**
 * Created by Sergio on 15.04.2018.
 */
let config = require('./config');
let express = require('express');
let mysql = require('promise-mysql');
let UserService = require('./UserService');

let connectionDevMes;
connectionDevMes = mysql.createPool({
    host: config.DataServiceConfig.db_host,
    port: config.DataServiceConfig.db_port,
    user: config.DataServiceConfig.db_user,
    password: config.DataServiceConfig.db_password,
    database: config.DataServiceConfig.db_database
});


let checkPinDevice = (id_device, password) => {
    return new Promise((resolve, reject) => {
        executeQuery('SELECT * FROM devices  WHERE `id`=? AND `password`=?', [id_device, password], (result, error) => {
            if (!error) {
                if (result.length > 0)
                    resolve(true);
                else {
                    resolve(false);
                }
            }
            else returnError(null, error);
        });
    });
};
let updateDeviceFunction = (req, res, data) => {
    console.log("updateDeviceFunction", data);
    checkPinDevice(data.id_device, data.pin)
        .then(result => {
            if (result === true) {
                executeQuery('UPDATE devices SET `id_user`=?, `info`=?, `place_id`=?  WHERE `id`=?', [
                    req.session.id_user,
                    data.info,
                    data.hasOwnProperty('place_id') ? data.place_id : null,
                    data.id_device
                ], (result, error) => {
                    if (!error) {
                        if (result.affectedRows > 0)
                            res.json({success: true});
                        else {
                            returnError(res, "failed change device row")
                        }
                    }
                    else returnError(res, error);
                });
            }
            else {
                returnError(res, "Неверный пароль или номер устройства");
            }
        })
        .catch(error => {
            returnError(res, error);
        });


};

module.exports.getMessages = function (req, res) {
    let query = "";

    let params = req.body.params;
    let type = req.body.type_query; // groups, messages


    console.log('module.exports.getMessages: type, params: ', type, params);

    if (type === "groups")
        query = "SELECT * FROM groups_message WHERE id_device = ? LIMIT 50";

    if (type === "messages")
        query = "SELECT * FROM groups_message INNER JOIN messages ON  groups_message.id = messages.id_group WHERE id_device = ? LIMIT 200";

    // Создаётся объект promise
    connectionDevMes.query(query, [params], function (error, result, fields) {
        if (!error)
            if (type === "groups")
                res.json({success: true, result: result});
        if (type === "messages") {
            let self_messages = {};

            //выбираем device_id

            for (let i = 0; i < result.length; i++) {

                let key = result[i].id_group;
                if (!self_messages[key]) {
                    self_messages[key] = {
                        id_device: 0,
                        id_group: 0,
                        t1: 0,
                        t2: 0,
                        ee: 0,
                        vv: 0,
                    };
                }

                self_messages[key].id_device = result[i].id_device;
                self_messages[key].id_group = result[i].id_group;

                if (result[i].time)
                    self_messages[key].time = result[i].time;

                switch (result[i].type_parametr) {
                    case 't1':
                        self_messages[key].t1 = result[i].value;
                        break;
                    case 't2':
                        self_messages[key].t2 = result[i].value;
                        break;
                    case 'ee':
                        self_messages[key].ee = result[i].value;
                        break;
                    case 'vv':
                        self_messages[key].vv = result[i].value;
                        break;
                }
                //Object.assign(this.messages[arr[key].id_group], {'params_array': params_array}); //объединяем свойства
            }

            console.log("self_messages:", self_messages);

            res.json({success: true, result: self_messages});
        }
        else {
            returnError(res, error.message);
        }
    });
};
module.exports.getDangerList = function (req, res) {
    let arr_devices = req.body.devices;
    console.log('module.exports.getDangerList devices: ', arr_devices);
    // Создаётся объект promise
    let query = "";
    for (let dev in arr_devices) {
        query += "(SELECT id_device, time,id_danger  " +
            "FROM groups_message " +
            "WHERE id_device='" + arr_devices[dev] + "' " +
            "ORDER BY time DESC " +
            "LIMIT 1) UNION ";

    }
    if (query.indexOf("UNION") > -1) {
        query = query.substr(0, query.length - 7);
        connectionDevMes.query(query, function (error, result, fields) {
            if (!error) {
                res.json({success: true, danger_list: result});
                console.log('getDangerList send: ', result);
            }
            else {
                returnError(res, error.message);
            }
        });
    }


};
module.exports.getDevices = function (req, res) {
    connectionDevMes.query('SELECT * FROM devices WHERE id_user = ?', [req.session.id_user], function (error, resultQuery, fields) {
        if (!error) {
            getDeviceSettings(res, resultQuery);
        }
        else {
            returnError(res, error.message);
        }

        function getDeviceSettings(res, devices) {
            let arrayDeviceId = devices.map(device => device.id);


            connectionDevMes.query(
                'SELECT * FROM device_settings INNER JOIN parametrs ON  parametrs.id = device_settings.id_parametr WHERE id_device IN (?)',
                [arrayDeviceId],
                function (error, resultQuery, fields) {
                    devices.map(device => {
                        if (!device.settings) device.settings = {};

                        if (!error) {
                            resultQuery.map(deviceSetting => {
                                if (device.id === deviceSetting.id_device) {
                                    device.settings[deviceSetting.short_name] = deviceSetting.value;
                                }

                            });
                        }
                        else {
                            returnError(res, error.message);
                        }

                    });
                    res.json({success: true, devices: devices});
                });


        }
    });

};
module.exports.updateDeviceSettings = function (req, res) {
    if (req.body.hasOwnProperty('device')) {
        let device = req.body.device;


        let values = [];
        for (let parameter in device.settings) {
            values.push("(" + device.id + ",(SELECT id as idp FROM parametrs WHERE short_name = '" + parameter + "')," + Number(device.settings[parameter]) + ")");
        }


        let query = "REPLACE INTO device_settings (id_device, id_parametr, value) values " + values + ";";

        connectionDevMes.query(query, function (error, resultQuery, fields) {
            if (!error) {
                res.json({success: true});
            }
            else
                returnError(res, error.message);
        });
    } else
        returnError(res, "device is undefined");


};

module.exports.bindDevice = function (req, res) {
    console.log('module.exports.bindDevice');

    if (req.body.hasOwnProperty('data')) {
        let data = req.body.data;
        // UserService.getPlace(data.place_id, (result, error) => {
        //     if (!error) {
        //         if (result.length > 0) {
        //
        //         }
        //         else {
        //             UserService.createPlace(data, (result, error) => {
        //                 if (!error)
        //                     if (result.affectedRows > 0) {
        //
        //                     }
        //                     else returnError(res, error);
        //
        //             });
        //         }
        //     }
        //     else returnError(res, error);
        // });
        updateDeviceFunction(req, res, data);
    } else returnError(res, "data is empty")


}; //привязать устройство

function returnError(res, error) {
    console.error(error);
    if (res)
        res.json({success: false, error: error});
}

function executeQuery(query, params, callback) {
    if (query && callback) {
        connectionDevMes.query(query, params,
            function (error, result, fields) {
                if (!error) {
                    console.log(result);
                    callback(result, error);
                }
                else {
                    console.error(result);
                    callback(result, error);
                }
            });
    }
    else throw Error("USERSERVICE:executeQuery - Empty query or callback. Tell me it's.");
}




