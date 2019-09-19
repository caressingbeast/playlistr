const sanitizeHtml = require('sanitize-html');
const uuid = require('uuid/v4');

function checkForImageUrl (text) {
    return text.match(/\.(jpeg|jpg|gif|png)$/) !== null;
}

module.exports = function (io) {
    let currentSeconds = 0;
    let endCount = 0;
    let messages = [];
    let playedVideos = [];
    let playlist = [];
    let users = [];

    function clearData () {
        currentSeconds = 0;
        endCount = 0;
        messages = [];
        playedVideos = [];
        playlist = [];
        users = [];
    }

    function hasValidCommand (text, user) {
        const [command, ...str] = text.split(' ');

        const message = {
            id: uuid(),
            date: new Date(),
            system: false,
            text: '',
            user
        };

        switch (command) {
            case '/help': {
                message.system = true;
                message.text = `<pre><code>${command}</code></pre>`;
                return message;
            }

            case '/me': {
                message.system = true;
                message.text = str.join(' ');
                return message;
            }

            default: {
                return false;
            }
        }
    }

    io.on('connection', function (socket) {
        let currentUser = '';

        if (!users.length) {
            clearData();
        }
    
        // check for valid username
        socket.on('client_checkUsername', function (username) {
            const isDuplicate = users.filter((u) => {
                return u.toLowerCase() === username.toLowerCase();
            }).length > 0;
    
            socket.emit('server_checkUsername', {
                duplicate: isDuplicate,
                username
            });
        });

        socket.on('client_addUser', (username) => {
            currentUser = username;

            socket.emit('server_loadData', {
                apiKey: process.env.API_KEY,
                currentSeconds,
                messages,
                playedVideos,
                playlist,
                users
            });
                    
            const message = {
                id: uuid(),
                date: new Date(),
                system: true,
                text: 'joined the room.',
                user: currentUser
            };

            messages.push(message);
            users.push(username);
            
            // broadcast new message
            io.emit('server_addMessage', message);
    
            // broadcast new user
            io.emit('server_addUser', currentUser);
        });
    
        socket.on('client_addMessage', function (message) {
            message.date = new Date();
            message.id = uuid();

            // check for commands 
            const command = hasValidCommand(message.text, currentUser);
            if (command) {
                return socket.emit('server_addMessage', command);
            }

            // check for image
            if (checkForImageUrl(message.text)) {
                message.text = `<a href="${message.text}" target="new">${message.text}</a><br /><img src="${message.text}" alt="${message.text}" />`;
            }

            message.text = sanitizeHtml(message.text, {
                allowedTags: ['a', 'b', 'br', 'code', 'em', 'i', 'img', 'pre', 'strong', 'u'],
                allowedAttributes: {
                    a: ['href', 'target'],
                    img: ['alt', 'src']
                }
            });

            // TODO: check for URLs

            messages.push(message);

            io.emit('server_addMessage', message);
        });
    
        socket.on('client_addVideo', function (video) {
            const isDuplicate = playlist.find(v => v.id.videoId === video.id.videoId);

            if (isDuplicate) {
                return socket.emit('server_duplicateVideo');
            }

            playlist.push(video);

            io.emit('server_addVideo', video);
        });
    
        socket.on('client_deleteVideo', function (video) {
            playlist = playlist.filter(v => v.id.videoId !== video.id.videoId);
            io.emit('server_deleteVideo', video);
        });
    
        socket.on('client_endVideo', function () {
            endCount++;

            if (endCount !== users.length) {
                return false;
            }
            
            const [currentVideo, ...nextPlaylist] = playlist;

            playedVideos.push(currentVideo);
            playlist = nextPlaylist;

            // tell clients to play the next video
            io.emit('server_playVideo', { playedVideos, playlist });

            // clear the count
            endCount = 0;
        });

        socket.on('client_currentSeconds', function (seconds) {
            currentSeconds = seconds;
        });
    
        socket.on('client_ping', function () {
            // do nothing, keep connection alive
        });
    
        socket.on('disconnect', function () {

            // if the user is just a guest, exit
            if (!currentUser) {
                return false;
            }

            users = users.filter((u) => {
                return u !== currentUser;
            });

            if (users.length) {
                const message = {
                    id: uuid(),
                    date: new Date(),
                    system: true,
                    text: 'left the room.',
                    user: currentUser
                };

                messages.push(message);
        
                io.emit('server_addMessage', message);
                io.emit('server_deleteUser', currentUser);
            } else {
                clearData();
            }
    
            currentUser = '';
        });

        socket.on('test_clearData', () => {
            clearData();
        });

        socket.on('test_addData', function (data) {

            if (data.currentUser) {
                currentUser = data.currentUser;
            }

            if (data.playlist) {
                playlist = data.playlist;
            }

            if (data.messages) {
                messages = data.messages;
            }
            
            if (data.users) {
                users = data.users;
            }
        });
    });
    
    setInterval(() => {
        io.sockets.emit('server_ping');
    }, 15000);
};