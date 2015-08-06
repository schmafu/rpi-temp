/**
 * Created by pari on 06.08.15.
 *
 * ds18 reads the temperature on a raspberry pi using the ds18b20 sensor and stores the data in a mongodb.
 * the sensor information can be read from the /sys/bus/w1/devices/28-<serialnr>/w1_slave file.
 */

var config = require('./config.js');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var Promise = require('promise');

// read the temperature from ds18b20-file and return a date/celsius-object
var readTemperature = new Promise(function (resolve, reject) {
        fs.readFile(config.path + '/' + config.file, {encoding:'utf8'}, function(err, data) {
            "use strict";
            if(err) reject(err);
            // we expect YES at the end of the first line
            if(data.search("YES") > 1) {
                console.log("readTemp");
                resolve({
                    "date": Date.now(),
                    // for generating dummy-data: "celsius": (parseInt(data.split("t=")[1], 10) + parseInt(Math.random() * 2000))
                    "celsius": data.split("t=")[1]
                });
            }
        });
    });

// connect to the mongodb and return the connection
var connectDB = new Promise(function(resolve, reject) {
    MongoClient.connect(config.mongo, function(err, db) {
        //assert.equal(null, err);
        if(err) {
            resolve(err);
            return;
        }
        //console.log("DEBUG: Connected correctly to server.");
        resolve(db);
    });
});


// data+dbconnection ok? insertdata!
Promise.all([readTemperature,connectDB]).then(function(data) {
    "use strict";
    var db = data[1];
    var temp = data[0];
    db.collection('temperature').insertOne(temp,function(err, result) {
        assert.equal(null,err);
        // console.log("DEBUG: insert successful");
        db.close();
    });
    // console.log("DEBUG: date/celsius: " + temp.date + "/" + temp.celsius);

}).catch(function(e) {
    "use strict";
    console.log("Error: " + e.message());
});



