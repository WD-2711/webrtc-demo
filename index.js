const { Socket } = require('socket.io');

// 后台服务器
var express = require('express');
const { fstat } = require('fs');
var app = express();
var http = require('http').createServer(app);
var fs = require('fs')


let sslOptions = {
    key: fs.readFileSync('./private.key'),
    cert: fs.readFileSync('./cacert.pem')
};
const https = require('https').createServer(sslOptions, app);
var io = require('socket.io')(https);

https.listen(443, () => {
    console.log('https listen on');
});



app.use("/static", express.static('static/'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/camera', (req, res) => {
    res.sendFile(__dirname + '/camera.html');
});


io.on("connection", (socket) => {
    // 连接加入子房间
    socket.join(socket.id);
    console.log("a user connected " + socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected " + socket.id);
        socket.broadcast.emit('user disconnected', socket.id);
    })
    socket.on('message1', (msg) => {
        console.log(socket.id + " say " + msg);
        // 想发给所有人，所以用io.on
        // io.emit("message2", msg); 
        // 不发给自己，发给其他人
        socket.broadcast.emit("message2", msg);
    })

    socket.on('new user greet', (data) => {
        console.log(data)
        console.log(socket.id + " greet " + data.msg);
        socket.broadcast.emit("need connect", {sender: socket.id, msg: data});
    });
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', {sender: data.sender});
    });

    // sdp and candidate
    socket.on('sdp', (data) => {
        console.log('sdp');
        console.log(data.description);
        socket.to(data.to).emit('sdp', {
            description: data.description,
            sender: data.sender
        });
    });
    socket.on('ice candidates', (data) => {
        console.log('ice candidates: ');
        console.log(data);
        socket.to(data.to).emit('ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        });
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});