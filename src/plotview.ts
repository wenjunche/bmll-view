import log from 'loglevel';
import { fin } from 'openfin-adapter/src/mock';

import { FDC3 } from './common';

const intentHandler = (ctx) => {
    console.log("Intent Received: ", ctx);
    if (ctx.type === FDC3.ContextType) {
//      setInstrument(ctx);
    }
  };


export const initIntentHandler = async() => {
    // @ts-ignore
    window.fdc3.addIntentListener(FDC3.IntentName, intentHandler);
}