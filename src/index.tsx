import React from 'react';
import ReactDOM from 'react-dom';

import { fin } from 'openfin-adapter/src/mock';
import log from 'loglevel';

import { FDC3 } from './common';

import App from './components/App';
import './index.css';


window.addEventListener("DOMContentLoaded",  async () => {
    initIntentHandler();

    ReactDOM.render(<App />, document.getElementById('root'));
});



const intentHandler = (ctx) => {
    console.log("Intent Received: ", ctx);
    if (ctx.type === FDC3.ContextType) {
//      setInstrument(ctx);
    }
  };


const initIntentHandler = async() => {
    log.debug(`init intent handler for ${FDC3.IntentName}`);
    // @ts-ignore
    window.fdc3.addIntentListener(FDC3.IntentName, intentHandler);
}