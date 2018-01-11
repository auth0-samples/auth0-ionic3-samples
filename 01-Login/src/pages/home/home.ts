import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AuthService } from './../../services/auth.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  loginSub: Subscription;
  loggedIn: boolean;

  constructor(
    public navCtrl: NavController,
    public auth: AuthService
  ) {}

}
