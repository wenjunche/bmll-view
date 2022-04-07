import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { fin } from 'openfin-adapter/src/mock';
import log from 'loglevel';

import { FDC3 } from './common';

import App from './components/App';

import store, { setISIN } from './store';

import './index.css';


window.addEventListener("DOMContentLoaded",  async () => {
    initIntentHandler();

    ReactDOM.render(
            <Provider store={store}>
                <App /> 
            </Provider>,
        document.getElementById('root'));
});

const intentHandler = (ctx) => {
    console.log("Intent Received: ", ctx);
    if (ctx.type === FDC3.ContextType) {
        // { type: FDC3.ContextType, id: { ticker: isinSelectRef.current.value} };
        store.dispatch(setISIN(ctx.id.ticker));
    }
};

const contextHandler = (ctx) => {
    console.log("Context Received: ", ctx);
    if (ctx.type === FDC3.LegacyContextType) {
        store.dispatch(setISIN(ctx.id.ticker));
    }
};

const initIntentHandler = async() => {
    log.debug(`init intent handler for ${FDC3.IntentName}`);
    // @ts-ignore
    window.fdc3.addIntentListener(FDC3.IntentName, intentHandler);
    // @ts-ignore
    window.fdc3.addContextListener(contextHandler);
}