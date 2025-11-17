import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthComponent} from './components/auth/auth.component';
import {ResetPasswordComponent} from './components/reset-password/reset-password.component';
import {VoiceMessageComponent} from './components/voice-message/voice-message.component';
import {AuthGuard} from './auth.guard';

const routes: Routes = [
  {path: '', component: AuthComponent},
  {path: 'set-password', component: ResetPasswordComponent},
  {path: 'voice-message', component: VoiceMessageComponent, canActivate: [AuthGuard]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
