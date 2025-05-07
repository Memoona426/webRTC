const express = require('express');
const { v4: uuidV4 } = require('uuid');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

// SSL certificate (self-signed)
const sslOptions = {
    key: fs.readFileSync('/etc/nginx/ssl/selfsigned.key'),
    cert: fs.readFileSync('/etc/nginx/ssl/selfsigned.crt')
};

const server = https.createServer(sslOptions, app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get("/", (req, res) => {
    const id = uuidV4();
    res.render("index", { uuid: id });
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

server.listen(3000, () => console.log('🔐 HTTPS Server running on port 3000'));
