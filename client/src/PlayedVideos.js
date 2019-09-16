import React from 'react';

class PlayedVideos extends React.PureComponent {

    render () {
        const playedVideos = this.props.playedVideos;
        console.log(playedVideos);
        return (
            <div className="PlayedVideos">
                PlayedVideos
            </div>
        );
    }
};

export default PlayedVideos;