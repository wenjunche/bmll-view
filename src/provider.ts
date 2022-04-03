import { init as initialisePlatform } from './platform';
import { fin } from 'openfin-adapter/src/mock';
import { PageLayout } from '@openfin/workspace-platform';
import { createBrowserWindow, createViewIdentity } from './common';

const selectPageLayout: PageLayout = {
  content: [
      {
          type: 'stack',
          content: [
              {
                  type: 'component',
                  componentName: 'view',
                  componentState: {
                      identity: createViewIdentity(fin.me.uuid, 'v1'),
                      url: 'http://localhost:8081/select.html',
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