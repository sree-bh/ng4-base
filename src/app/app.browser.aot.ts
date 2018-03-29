import { platformBrowser } from '@angular/platform-browser';
import { decorateModuleRef } from '../../../common/environment';

import { AppModuleNgFactory } from '../../../../aot/src/app/app.module.ngfactory';

document.addEventListener('DOMContentLoaded', () => {
  return platformBrowser()
    .bootstrapModuleFactory(AppModuleNgFactory)
    .then(decorateModuleRef)
    .catch((err:any) => console.error(err));
});
