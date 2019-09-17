import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

class SearchResults extends React.Component {

    render () {
        const { query, results } = this.props;

        if (!results.length) {
            return null;
        }

        return (
            <div className="SearchResults">
                <div className="resultsHeader">
                    <span>{results.length} results for "{query}"</span>
                    <button onClick={this.props.onClearSearch}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <div className="resultsList">
                    {results.map((r) => {
                        return (
                            <div key={r.id.videoId} className="result" onClick={() => this.props.onLoadResult(r)}>
                                <div className="thumbnail"><img src={r.snippet.thumbnails.default.url} alt={r.snippet.title} /></div>
                                <h3>{r.snippet.title}</h3>
                                <p>{r.snippet.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default SearchResults;