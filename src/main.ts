/// <reference types="@angular/localize" />

import Clarity from '@microsoft/clarity';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

Clarity.init('whnnuai8ok');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
