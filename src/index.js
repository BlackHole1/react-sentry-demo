import React from 'react';
import ReactDOM from 'react-dom';
import Raven from "raven-js";
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import SentryBoundary from './SentryBoundary';

Raven.config('https://bea834ff9ce34d329762dca3117ce34d@sentry.io/1248812', {
  environment: process.env.NODE_ENV,
  tags: {
    version: '1.0.0'
  },
  shouldSendCallback: function(data) {
    return (data.environment === "development");
  }
}).install();

ReactDOM.render((
  <div>
    <SentryBoundary>
      <App />
    </SentryBoundary>
  </div>
), document.getElementById('root'));
registerServiceWorker();
