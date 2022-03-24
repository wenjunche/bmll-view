import { fin } from 'openfin-adapter/src/mock';
import { CustomThemes } from '@openfin/workspace-platform';


async function getConfiguredSettings() {
    const app = await fin.Application.getCurrent();
    const manifest = await app.getManifest();
  
    return manifest;
}

export async function getSettings() {
    return getConfiguredSettings();
}

