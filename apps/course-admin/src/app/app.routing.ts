import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@course-platform/shared/feat-auth';
import { RedirectIfAuthenticatedResolver } from './core/auth/redirect-if-authenticated.service';
import { SchoolIdResolver } from './school-id.resolver';

const routes: Routes = [
  {
    path: ':schoolId',
    resolve: [SchoolIdResolver],
    children: [
      {
        path: '',
        resolve: [RedirectIfAuthenticatedResolver],
        loadChildren: () =>
          import('./login/login.module').then(m => m.LoginModule)
      },
      {
        path: 'courses',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./courses/courses.module').then(m => m.CoursesModule)
      },
      {
        path: 'course-admin',
        loadChildren: () =>
          import('./course-admin/course-admin.module').then(
            m => m.CourseAdminModule
          )
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  },
  {
    path: '**',
    redirectTo: `andreaslydemann-22gwh`
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
