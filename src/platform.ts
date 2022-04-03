import { init as workspacePlatformInit, BrowserInitConfig } from '@openfin/workspace-platform';
import { InteropBroker } from "openfin-adapter/src/api/interop";
import { PageLayout } from '@openfin/workspace-platform';
import { FDC3, createBrowserWindow } from './common';
import log from 'loglevel';

export async function init() {
    console.log("Initialising platform");
    const browser: BrowserInitConfig = {
        // @ts-ignore
        defaultViewOptions: {
            fdc3InteropApi: '1.2',
        },
        interopOverride: async (InteropBroker, provider, options, ...args) => {
            return new PlatformInteropBroker(provider, options, ...args);
        }
    };
    console.log("Specifying following browser options: ", browser);
    await workspacePlatformInit({
        browser,
//        theme: validateThemes(settings?.themeProvider?.themes),
    });
}

const plotViewName = 'main-plot-view';
const plotPageLayout: PageLayout = {
    content: [
        {
            type: 'stack',
            content: [
                {
                    type: 'component',
                    componentName: 'view',
                    componentState: {
//                        identity: createViewIdentity(fin.me.uuid, 'v1'),
                        // @ts-ignore
                        name: plotViewName,
                        url: 'http://localhost:8081/index.html',
                    }
                }
            ]
        }
    ]
};
  
class PlatformInteropBroker extends InteropBroker {
    async handleFiredIntent(intent: OpenFin.Intent) {
        console.log("Received request for a raised intent: ", intent);
        if (intent.name === FDC3.IntentName && intent.context.type === FDC3.ContextType) {
            await createBrowserWindow({ title: 'Instrument Plot', layout: plotPageLayout });
            const targetIdentity = { uuid: fin.me.uuid, name: plotViewName };
            log.debug(`setIntentTarget`, targetIdentity);
            super.setIntentTarget(intent, targetIdentity);
            return {source: targetIdentity.uuid}
        }
    }    
}