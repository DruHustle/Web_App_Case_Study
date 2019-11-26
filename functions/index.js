const functions = require('firebase-functions');
const express = require('express');
var admin = require("firebase-admin");

admin.initializeApp(
    functions.config().firebase
)
// Get a database reference to our blog
var db = admin.database();
var ref = db.ref("saved");

const app = express();
// this will save posted data into the database
app.post('/save', (req, res) => {
    var dataValues = req.body;
    var childName = dataValues['savename'];
    delete dataValues['savename'];
    ref.child(childName).set(dataValues);
    res.end('done');
})
// this will get the saved database values and display them
.get('/save', (req, res)=>{
    console.log(req.query['data'])
    ref.child(req.query['data']).once('value').then(val=>{
        res.send(val.val());
        return;
    }).catch(error=>{
        console.log(error);
        return;
    })
});


exports.app = functions.https.onRequest(app);
