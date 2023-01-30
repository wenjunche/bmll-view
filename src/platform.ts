import { init as workspacePlatformInit, BrowserInitConfig } from '@openfin/workspace-platform';
import { PageLayout } from '@openfin/workspace-platform';
import { FDC3, createBrowserWindow, appRootUrl } from './common';
import log from 'loglevel';

export async function init() {
    console.log("Initialising platform");
    const browser: BrowserInitConfig = {
        // @ts-ignore
        defaultViewOptions: {
            fdc3InteropApi: '1.2',
        },
        interopOverride: async (InteropBroker, provider, options, ...args): Promise<OpenFin.InteropBroker> => {
            class PlatformInteropBroker extends InteropBroker {
                async handleFiredIntent(intent: OpenFin.Intent) {
                    console.log("Received request for a raised intent: ", intent);
                    if (intent.name === FDC3.IntentName && (intent.context.type === FDC3.ContextType || intent.context.type === FDC3.LegacyContextType)) {
                        await launchPlotWindow();
                        const targetIdentity = { uuid: fin.me.uuid, name: plotViewName };
                        super.setIntentTarget(intent, targetIdentity);
                        return {source: targetIdentity.uuid}
                    }
                }
                async setContext({ context }: { context: OpenFin.Context;
                }, clientIdentity: OpenFin.ClientIdentity) {
                    console.log("Setting context: ", context);
                    if (context.type === FDC3.ContextType || context.type === FDC3.LegacyContextType) {
                        await launchPlotWindow();
                    }
                    super.setContext({ context }, clientIdentity);
                }
            
            }

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
    settings: {
        reorderEnabled: true,
        popoutWholeStack: false,
        constrainDragToContainer: true,
        showPopoutIcon: false,
        showMaximiseIcon: false,
        showCloseIcon: false,
        constrainDragToHeaders: false,
        // @ts-ignore
        preventDragIn: true,
        preventDragOut: true,
        //@ts-ignore
        preventSplitterResize: true,        
    },
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
                        url: `${appRootUrl}/index.html`,
                        isClosable: false,
                        interop: {
                            currentContextGroup: 'green'
                          }
                    }
                }
            ]
        }
    ]
};
  
let plotWindowCreated = false;
const launchPlotWindow = async () => {
    if (!plotWindowCreated) {
        plotWindowCreated = true;
        const wmodule = await createBrowserWindow({ title: 'Instrument Plot', layout: plotPageLayout });
        wmodule.openfinWindow.once('closed', () => {
            plotWindowCreated = false;
        });
    }
}

