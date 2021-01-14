// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: 'AIzaSyBq6NhI0djRF8_UmDo_iNvyD6kTrsFP8ls',
    authDomain: 'iaa-course-portal.firebaseapp.com',
    databaseURL: 'https://iaa-course-portal.firebaseio.com',
    projectId: 'iaa-course-portal',
    storageBucket: 'iaa-course-portal.appspot.com',
    messagingSenderId: '1040195954821',
    appId: '1:1040195954821:web:704acc57f1bd58cea5e1ec',
    measurementId: 'G-YZ6YTD97HR'
  },
  courseServiceUrl: 'http://localhost:5000/iaa-course-portal/us-central1/api'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
