import { init as initialisePlatform } from './platform';
import { fin } from 'openfin-adapter/src/mock';
import { PageLayout } from '@openfin/workspace-platform';
import { appRootUrl, createBrowserWindow, createViewIdentity } from './common';

const selectPageLayout: PageLayout = {
  settings: {
    reorderEnabled: false,
    popoutWholeStack: false,
    constrainDragToContainer: true,
    showPopoutIcon: false,
    showMaximiseIcon: false,
    showCloseIcon: false,
    constrainDragToHeaders: true,
    // @ts-ignore
    preventDragIn: false,
    preventDragOut: false,
    preventSplitterResize: true,
    // @ts-ignore
    reorderEnabled: false,
  },
  content: [
      {
          type: 'stack',
          content: [
              {
                  type: 'component',
                  componentName: 'view',
                  componentState: {
                      identity: createViewIdentity(fin.me.uuid, 'v1'),
                      url: `${appRootUrl}/select.html`,
                      // @ts-ignore
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

window.addEventListener('DOMContentLoaded', async () => {
  let platform = fin.Platform.getCurrentSync();
  platform.once('platform-api-ready', () => {
    console.log('platform-api-ready');
    createBrowserWindow({ title: 'Instrument Selection', layout: selectPageLayout });
  });
  await initialisePlatform();
});