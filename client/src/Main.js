import io from 'socket.io-client';
import React from 'react';

import Login from './Login';
import Playlist from './Playlist';
import Chat from './Chat';

const socket = io('http://localhost:3000');

class Main extends React.Component {

    state = {
        currentSeconds: 0,
        messages: [],
        username: '',
        users: [],
        videoId: ''
    }

    constructor (args) {
        super(args);

        socket.emit('userConnected');

        socket.on('loadData', (data) => {
            console.log(data);
            this.setState(data);
        });

        socket.on('serverAddedMessage', (messages) => {
            this.setState({ messages });
        });

        socket.on('serverUpdatedPlaylist', (playlist) => {
            this.setState({ playlist });
        });

        socket.on('userJoined', (users) => {
            this.setState({ users });
        });

        socket.on('userLeft', (users) => {
            this.setState({ users });
        });
    }

    onLogin (username) {
        const userFound = this.state.users.find(u => u === username);

        if (userFound) {
            return alert('Please select a unique username.');
        }

        this.setState({ username });

        socket.emit('userLoggedIn', username);
    }

    onMessage (message) {
        message.user = this.state.username;

        socket.emit('clientAddedMessage', message);
    }

    onVideoDelete (video) {
        socket.emit('clientDeletedVideo', video);
    }

    render () {
        const loggedIn = !!this.state.username;

        return (
            <div className="Main">
                {!loggedIn && <Login onSubmit={this.onLogin.bind(this)} />}
                {loggedIn &&
                    <div>
                        <div className="header">Welcome, {this.state.username}!</div>
                        <Playlist playlist={this.state.playlist} username={this.state.username} onDelete={this.onVideoDelete.bind(this)} />
                        <Chat messages={this.state.messages} users={this.state.users} onSubmit={this.onMessage.bind(this)} />
                    </div>
                }
            </div>
        );
    }
}

export default Main;