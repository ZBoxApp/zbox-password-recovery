import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, browserHistory} from 'react-router';

import Root from '../../components/recovery/root.jsx';

ReactDOM.render(
    <div className="container">
        <div className="row">
            <div className="col-xs-8 col-md-6 col-xs-offset-2 col-md-offset-3">
                <Router history={browserHistory}>
                    <Route path="/" component={Root}/>
                </Router>
            </div>
        </div>
    </div>
    ,
    document.getElementById('app'));
