import io from 'socket.io-client';
import React from 'react';
import axios from 'axios';
import YTPlayer from 'yt-player';

import Login from './Login';
import Playlist from './Playlist';
import Chat from './Chat';
import SearchResults from './SearchResults';

const socket = io('http://localhost:3000');

class Main extends React.Component {

    state = {
        currentSeconds: 0,
        messages: [],
        playedVideos: [],
        player: null,
        playlist: [],
        searchQuery: '',
        searchResults: [],
        username: '',
        users: [],
        videoId: ''
    }

    constructor (args) {
        super(args);

        socket.on('loadData', (data) => {
            const player = new YTPlayer('#yt-player', {
                controls: false,
                info: false,
                rel: false
            });
            
            data.player = player;
            
            this.setState(data, () => {
                player.load(this.state.playlist[0] && this.state.playlist[0].id.videoId);
            });

            player.on('ended', () => {
                const currentVideo = this.state.playlist[0];
                const playedVideos = this.state.playedVideos;

                const playlist = this.state.playlist.filter((v) => {
                    return v.id.videoId !== currentVideo.id.videoId;
                });

                playedVideos.push(currentVideo);

                this.setState({
                    playedVideos,
                    playlist
                }, () => {
                    player.load(playlist[0] && playlist[0].id.videoId);
                });
            });

            player.on('error', (err) => {
                console.log(err);
            });
        });

        socket.on('serverAddedMessage', (messages) => {
            this.setState({ messages });
        });

        socket.on('serverAddedVideo', (video) => {
            const playlist = this.state.playlist;
            const searchResults = this.state.searchResults.filter((r) => {
                return r.id.videoId !== video.id.videoId;
            });

            playlist.push(video);

            this.setState({ playlist, searchResults }, () => {
                const player = this.state.player;

                if (player.getState() === 'unstarted') {
                    player.load(playlist[0].id.videoId, true);
                }
            });
        });

        socket.on('serverDeletedVideo', (video) => {
            const playlist = this.state.playlist.filter((v) => {
                return v.id.videoId !== video.id.videoId;
            });

            this.setState({
                playlist
            });
        })

        socket.on('userJoined', (users) => {
            this.setState({ users });
        });

        socket.on('userLeft', (users) => {
            this.setState({ users });
        });
    }

    onClearSearch () {
        this.setState({
            searchQuery: '',
            searchResults: []
        });
    }

    onLoadResult (video) {
        video.user = this.state.username;
        socket.emit('clientAddedVideo', video);
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

    onSearch (e) {
        e.preventDefault();
        
        const query = this.state.searchQuery;

        if (!query) {
            return false;
        }

        axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: 'AIzaSyBGHs_0KIIfF7ho_HYach8KYkNKQKOPvos',
                type: 'video',
                maxResults: '20',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default',
                q: query
            }
        }).then((res) => {
            this.setState({
                searchResults: res.data.items
            });
        });
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
                        <form onSubmit={(e) => this.onSearch(e)}>
                            <input type="text" value={this.state.searchQuery} placeholder="Enter search term here" onChange={(e) => this.setState({ searchQuery: e.target.value})} />
                            <button type="submit">Search</button>
                        </form>
                        <SearchResults results={this.state.searchResults} onClearSearch={this.onClearSearch.bind(this)} onLoadResult={this.onLoadResult.bind(this)} />
                        <div id="yt-player"></div>
                        <Playlist playedVideos={this.state.playedVideos} playlist={this.state.playlist} username={this.state.username} onVideoDelete={this.onVideoDelete.bind(this)} />
                        <Chat messages={this.state.messages} users={this.state.users} onSubmit={this.onMessage.bind(this)} />
                    </div>
                }
            </div>
        );
    }
}

export default Main;