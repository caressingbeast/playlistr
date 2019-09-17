const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const port = process.env.PORT || 5000;

const uuid = require('uuid/v4');

const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'production') {
    app.use(express.static('client/build'));
}

let currentSeconds = 0;
let messages = [];
let playedVideos = [];
let playlist = [];
let users = [];

io.on('connection', (client) => {
    let currentUser = '';

    client.on('clientConnected', () => {
        client.emit('loadUsers', users);
    });

    client.on('userLoggedIn', (username) => {
        currentUser = username;
        
        users.push(currentUser);
        
        client.emit('loadData', {
            apiKey: process.env.API_KEY,
            currentSeconds,
            messages,
            playedVideos,
            playlist
        });

        const message = {
            date: new Date(),
            id: uuid(),
            system: true,
            text: 'joined the room.',
            user: username
        };

        messages.push(message);
        
        io.emit('serverAddedMessage', message);
        io.emit('userJoined', users);
    });

    client.on('clientAddedMessage', (message) => {
        message.date = new Date();
        message.id = uuid();

        if (message.text.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
            message.text = `<a href="${message.text}" target="new">${message.text}</a><br /><img src=${message.text} />`;
        }

        messages.push(message);
        io.emit('serverAddedMessage', message);
    });

    client.on('clientAddedVideo', (video) => {
        playlist.push(video);
        io.emit('serverAddedVideo', video);
    });

    client.on('clientDeletedVideo', (video) => {
        playlist = playlist.filter((v) => {
            return v.id !== video.id;
        });

        io.emit('serverDeletedVideo', video);
    });

    client.on('disconnect', () => {
        users = users.filter((u) => {
            return u !== currentUser;
        });

        console.log(`${currentUser} disconnected`);

        if (currentUser) {
            const message = {
                date: new Date(),
                id: uuid(),
                system: true,
                text: 'left the room.',
                user: currentUser
            };
    
            messages.push(message);
    
            io.emit('serverAddedMessage', message);
        }
        
        io.emit('userLeft', users);

        currentUser = '';

        if (!users.length) {
            currentSeconds = 0;
            messages = [];
            playedVideos = [];
            playlist = [];
            users = [];
        }
    });
});

server.listen(port);
console.log(`Server listening on port: ${port}`);