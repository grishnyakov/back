/**
 * Created by Sergio on 06.04.2018.
 */

let cookieParser = require('cookie-parser');
let session = require('express-session');
let config = require('./config')

//подключение модуля connect -mysql

let MySQLStore = require('express-mysql-session')(session);


module.exports = {
    createStore: function () {

        let options = {
            // Host name for database connection:
            host: config.UserServiceConfig.db_host,
            // Port number for database connection:
            port: config.UserServiceConfig.db_port,
            // Database user:
            user: config.UserServiceConfig.db_user,
            // Password for the above database user:
            password: config.UserServiceConfig.db_password,
            // Database name:
            database: config.UserServiceConfig.db_database,
            // How frequently expired sessions will be cleared; milliseconds:
            checkExpirationInterval: 900000,
            // The maximum age of a valid session; milliseconds:
            expiration: 86400000,  // all day
            // Number of connections when creating a connection pool:
            connectionLimit: 10,
            schema: {
                tableName: 'sessions',
                columnNames: {
                    session_id: 'session_id',
                    expires: 'expires',
                    data: 'data'
                }
            }
        };

        return new MySQLStore(options);
    }
};