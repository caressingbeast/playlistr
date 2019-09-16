import React from 'react';

class Playlist extends React.PureComponent {

    onDelete (video) {
        this.props.onDelete(video);
    }

    render () {
        return (
            <div className="Playlist">
                <h3>Playlist</h3>
                {this.props.playlist.map((video) => {
                    return (
                        <div key={video.id} className="video">
                            {video.title}
                            <button onClick={() => this.onDelete(video)}>delete</button>
                            {this.props.username === video.user &&
                                <button onClick={this.props.onVideoDelete(video)}>delete</button>
                            }
                        </div>
                    );
                })}
            </div>
        );
    }
};

export default Playlist;