import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

const config = {
  apiKey: 'AIzaSyAllXCbFgJ3j7POph8iikTkBNOgmjc1vj4',
  authDomain: 'aaa-course-portal.firebaseapp.com',
  databaseURL: 'https://aaa-course-portal.firebaseio.com',
  projectId: 'aaa-course-portal',
  storageBucket: 'aaa-course-portal.appspot.com',
  messagingSenderId: '274665468824',
  appId: '1:274665468824:web:0d3a55a3aca4ce4fc9b1ed',
  measurementId: 'G-4D02VHTXTV'
};

@NgModule({
  imports: [AngularFireModule.initializeApp(config)]
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule,
    private translateService: TranslateService
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }

    this.translateService.use('en');
  }
}
