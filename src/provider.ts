import { init as initialisePlatform } from './platform';
import { fin } from 'openfin-adapter/src/mock';
import { BrowserCreateWindowRequest, BrowserWindowModule, getCurrentSync, Page, PageWithUpdatableRuntimeAttribs, WorkspacePlatformModule, PageLayout } from '@openfin/workspace-platform';
import { LayoutExtended } from '@openfin/workspace';

const defaultPageLayout: PageLayout = {
  content: [
      {
          type: 'stack',
          content: [
              {
                  type: 'component',
                  componentName: 'view',
                  componentState: {
                      identity: createViewIdentity(fin.me.uuid, 'v1'),
                      url: 'http://localhost:8081/index.html'
                  }
              }
          ]
      }
  ]
};

function createViewIdentity(uuid: string, name: string): OpenFin.Identity {
  const viewIdentity: OpenFin.Identity = { uuid: uuid, name: `${window.crypto.randomUUID()}-${name}` };
  return viewIdentity;
}

async function createPageLayout(layout): Promise<PageLayout> {
  const layoutId: string = `layout-${window.crypto.randomUUID()}`;
  return {
      ...layout,
      layoutDetails: { layoutId }
  } as PageLayout;
}

async function createPageWithLayout(title: string, layout: LayoutExtended): Promise<PageWithUpdatableRuntimeAttribs> {
  const layoutWithDetails = await createPageLayout(layout);
  return {
      pageId: window.crypto.randomUUID(),
      title,
      layout: layoutWithDetails,
      isReadOnly: false,
      hasUnsavedChanges: true
  };
}

export async function createBrowserWindow(): Promise<BrowserWindowModule> {
  const platform: WorkspacePlatformModule = getCurrentSync();
  const page: Page = await createPageWithLayout('Untitled Page', defaultPageLayout);
  const pages: Page[] = [page];

  const options: BrowserCreateWindowRequest = {
      workspacePlatform: { pages },
      defaultCentered: true,
      defaultHeight: 900,
      defaultWidth: 900
  };
  const createdBrowserWin: BrowserWindowModule = await platform.Browser.createWindow(options);
  return createdBrowserWin;
}

window.addEventListener('DOMContentLoaded', async () => {
  let platform = fin.Platform.getCurrentSync();
  platform.once('platform-api-ready', () => {
    console.log('platform-api-ready');
    createBrowserWindow();
  });
  await initialisePlatform();
});