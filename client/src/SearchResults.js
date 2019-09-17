import React from 'react';

class SearchResults extends React.Component {

    render () {
        const results = this.props.results;

        if (!results || !results.length) {
            return null;
        }

        return (
            <div className="SearchResults">
                <h3>SearchResults <button onClick={this.props.onClearSearch}>clear</button></h3>
                {results.map((r) => {
                    return (
                        <div key={r.id.videoId} className="result" onClick={() => this.props.onLoadResult(r)}>
                            <img src={r.snippet.thumbnails.default.url} alt={r.snippet.title} />
                            <h4>{r.snippet.title}</h4>
                            <p>{r.snippet.description}</p>
                        </div>
                    );
                })}
            </div>
        );
    }
}

export default SearchResults;