import io from 'socket.io-client';
import React from 'react';
import axios from 'axios';
import YTPlayer from 'yt-player';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import Login from './Login';
import Playlist from './Playlist';
import Chat from './Chat';
import SearchResults from './SearchResults';

const socket = io('http://localhost:5000');

class Main extends React.Component {

    state = {
        apiKey: '',
        currentSeconds: 0,
        messages: [],
        playedVideos: [],
        player: null,
        playlist: [],
        searchInput: '',
        searchQuery: '',
        searchResults: [],
        timer: null,
        username: '',
        users: [],
        videoId: ''
    }

    constructor (props) {
        super(props);

        socket.on('loadUsers', (users) => {
            this.setState({ users });
        });

        socket.on('loadData', (data) => {
            const player = new YTPlayer('#ytPlayer', {
                controls: false,
                info: false,
                rel: false,
                width: '100%'
            });
            
            data.player = player;
            
            this.setState(data, () => {
                this.loadVideo(this.state.playlist[0]);
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
                    this.loadVideo(playlist[0]);
                });
            });

            // on error, load the next video
            player.on('error', (err) => {
                player.trigger('ended');
            });
        });

        socket.on('serverAddedMessage', (message) => {
            const messages = this.state.messages;

            messages.push(message);

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
                    this.loadVideo(playlist[0]);
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

    loadVideo (video) {
        if (!video) {
            return false;
        }

        this.state.player.load(video.id.videoId, true);
    }

    onClearSearch () {
        this.setState({
            searchInput: '',
            searchQuery: '',
            searchResults: []
        });
    }

    onLoadResult (video) {
        video.user = this.state.username;
        socket.emit('clientAddedVideo', video);
    }

    onLogin (username) {
        const userFound = this.state.users.find(u => u.toLowerCase() === username.toLowerCase());

        if (userFound) {
            return alert('That username is already taken.');
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
        
        const query = this.state.searchInput;

        if (!query) {
            return false;
        }

        axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: this.state.apiKey,
                type: 'video',
                maxResults: '20',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default',
                q: query
            }
        }).then((res) => {
            this.setState({
                searchQuery: query,
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
                    <React.Fragment>
                        <div className="header">
                            <div className="column floatLeft">
                                <h1>playlistr</h1>
                            </div>
                            <div className="column floatRight">
                                <form onSubmit={(e) => this.onSearch(e)}>
                                    <input type="text" value={this.state.searchInput} placeholder="Search YouTube" onChange={(e) => this.setState({ searchInput: e.target.value})} />
                                    <button type="submit"><FontAwesomeIcon icon={faSearch} /></button>
                                </form>
                            </div>
                        </div>
                        <div className="content">
                            <div className="column floatLeft">
                                {this.state.searchResults.length > 0 && <SearchResults query={this.state.searchQuery} results={this.state.searchResults} onClearSearch={this.onClearSearch.bind(this)} onLoadResult={this.onLoadResult.bind(this)} />}
                                {!this.state.searchResults.length && <Chat messages={this.state.messages} user={this.state.username} users={this.state.users} onSubmit={this.onMessage.bind(this)} />}
                            </div>
                            <div className="column floatRight">
                                <div className="playerContent">
                                    <div className="playerOverlay"></div>
                                    <div id="ytPlayer"></div>
                                </div>
                                <Playlist playedVideos={this.state.playedVideos} playlist={this.state.playlist} username={this.state.username} onVideoDelete={this.onVideoDelete.bind(this)} />
                            </div>
                        </div>
                        <div className="footer">made by <a href="https://github.com/caressingbeast/playlistr">caressingbeast</a></div>
                    </React.Fragment>   
                }
            </div>
        );
    }
}

export default Main;