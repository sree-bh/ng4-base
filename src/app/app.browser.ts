import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { bootloader } from '@angularclass/hmr/dist';
import { decorateModuleRef } from '../../../common/environment';

import { AppModule } from './app.module';

bootloader(() => {
  return platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .then(decorateModuleRef)
    .catch((err:any) => console.error(err));
});
