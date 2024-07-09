require('rootpath')();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('./app/helpers/jwt');
const errorHandler = require('./app/helpers/error-handler');
const config = require('./app/config/index');
const package = require('./package.json');
const app = express();
// const path = require('path');
const https = require('https');
const fs = require('fs');
var fileupload = require("express-fileupload");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require('swagger-ui-express');
var cron = require('node-cron');

const ENV = config.app_env;
var SWAG_URL = (ENV == 'local') ? config.local_url : config.dev_url;
var PORT = (ENV == 'local') ? config.local_port : config.dev_port;

var corsOptions = {
  origin: '*',
  credentials: true
}

app.get('/api/v1', function(req, res) { res.redirect('/documentation'); });

//app.use(jwt());
app.use(fileupload());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: false }));

//app.use(cors());
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(express.static(__dirname));


app.use(bodyParser.urlencoded({ extended: true }));
global.__basedir = __dirname;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
})

// Require routes
app.use('/common', require('./app/controllers/common.controller'));
app.use('/admin', require('./app/controllers/admin.controller'));
app.use('/user', require('./app/controllers/user.controller'));
app.use('/' + config.uploadDir, express.static(__dirname + '/' + config.uploadDir));
app.use(errorHandler);
//Swagger Configurations
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PayEarth REST API",
            version: package.version,
            description: package.description,
            license: {
                "name": package.license,
                "url": "https://opensource.org/licenses/MIT"
            }
        },
        "components": {
            securitySchemes: {
                bearerAuth: {
                    "type": "http",
                    "description": "Enter JWT Bearer Token",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                },
            },
        },
        servers: [{
            url: SWAG_URL + ':' + PORT,
            description: ENV + ' server',
        }, ],
    },
    apis: ['./app/swagger_operations/*.js'],
};
const specs = swaggerJsdoc(options);

app.use(
    "/documentation",
    swaggerUi.serve,
    swaggerUi.setup(specs)
);

var certOptions = {
    key: fs.readFileSync("./cert/key.pem", 'utf8'),
    cert: fs.readFileSync("./cert/cert.pem", 'utf8')
    
};
cron.schedule('*/2 * * * *', () => {
  console.log('running a task every two minutes');
});
/*
// set port, listen for requests
const httpsServer = https.createServer(certOptions, app);
//const httpsServer = https.createServer(null, app);
httpsServer.listen(PORT, () => {
    console.log('HTTPS Server running on port ' + PORT);
});*/
//const PORT = config.dev_port || 8800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
/*
var http = require('http');
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var message = 'It workss!\n',
        version = 'NodeJS ' + process.versions.node + '\n',
        response = [message, version].join('\n');
    res.end(response);
});
server.listen();*/
