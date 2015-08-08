/**
 * Created by pari on 06.08.15.
 *
 * ds18 reads the temperature on a raspberry pi using the ds18b20 sensor and stores the data in a mongodb.
 * the sensor information can be read from the /sys/bus/w1/devices/28-<serialnr>/w1_slave file.
 */

var config = require('./config.js');
var fs = require('fs');
var assert = require('assert');
var Promise = require('promise');
var AWS = require('aws-sdk');
var db = new AWS.DynamoDB({signatureVersion: 'v4', region: 'eu-central-1'});



// read the temperature from ds18b20-file and return a date/celsius-object
var readTemperature = new Promise(function (resolve, reject) {
        fs.readFile(config.path + '/' + config.file, {encoding:'utf8'}, function(err, data) {
            "use strict";
            if(err) reject(err);
            // we expect YES at the end of the first line
            if(data.search("YES") > 1) {
                console.log("readTemp");
                resolve({ //unix timestamp + 1/1000 degree celsius
                    "date": parseInt(Math.round(Date.now()/1000),10).toString(),
                    // for generating dummy-data: "celsius": (parseInt(data.split("t=")[1], 10) + parseInt(Math.random() * 2000))
                    "celsius": data.split("t=")[1]
                });
            }
        });
    });



readTemperature.then(function(err,data) {
    "use strict";
    if(err) reject(err);
    console.log("DEBUG: date/celsius: " + data.date + "/" + data.celsius);
    var dbparams = {
        Item: {
            timestamp: {S: data.date },
            celsius: {N: data.celsius}
        },
        TableName: "rpi-temp"
    };
    db.putItem(dbparams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });


}).catch(function(e) {
    "use strict";
    console.log("Error: " + e.message());
});







