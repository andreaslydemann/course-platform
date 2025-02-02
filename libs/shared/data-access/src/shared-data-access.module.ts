import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AngularFireModule } from '@angular/fire';

import { GraphQLModule } from './resources/graphql.module';
const config = {
  apiKey: 'AIzaSyBq6NhI0djRF8_UmDo_iNvyD6kTrsFP8ls',
  authDomain: 'iaa-course-portal.firebaseapp.com',
  databaseURL: 'https://iaa-course-portal.firebaseio.com',
  projectId: 'iaa-course-portal',
  storageBucket: 'iaa-course-portal.appspot.com',
  messagingSenderId: '274665468824',
  appId: '1:274665468824:web:0d3a55a3aca4ce4fc9b1ed',
  measurementId: 'G-4D02VHTXTV'
};

@NgModule({
  imports: [AngularFireModule.initializeApp(config), GraphQLModule]
})
export class SharedDataAccessModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: SharedDataAccessModule
  ) {
    if (parentModule) {
      throw new Error(
        'SharedDataAccessModule is already loaded. Import only in CoreModule'
      );
    }
  }
}
