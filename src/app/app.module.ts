import { NgReduxModule } from '@angular-redux/store';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';

import { Common } from '../../../../../common';
import { AppComponent } from './app.component';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpModule,
    NgReduxModule,
  ],
})
export class AppModule {
}
