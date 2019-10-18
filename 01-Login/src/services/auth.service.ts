import { Injectable, NgZone } from '@angular/core';
import { Storage } from '@ionic/storage';
import { SafariViewController } from '@ionic-native/safari-view-controller';

// Import AUTH_CONFIG, Auth0Cordova, and auth0.js
import { AUTH_CONFIG } from './auth.config';
import Auth0Cordova from '@auth0/cordova';
import * as auth0 from 'auth0-js';

@Injectable()
export class AuthService {
  Auth0 = new auth0.WebAuth(AUTH_CONFIG);
  Client = new Auth0Cordova(AUTH_CONFIG);
  accessToken: string;
  user: any;
  loggedIn: boolean;
  cordova: any;
  loading = true;

  constructor(
    public zone: NgZone,
    private storage: Storage,
    public safariViewController: SafariViewController
  ) {
    this.storage.get('profile').then(user => this.user = user);
    this.storage.get('access_token').then(token => this.accessToken = token);
    this.storage.get('expires_at').then(exp => {
      this.loggedIn = Date.now() < JSON.parse(exp);
      this.loading = false;
    });
  }

  login() {
    this.loading = true;
    const options = {
      scope: 'openid profile offline_access'
    };
    // Authorize login request with Auth0: open login page and get auth results
    this.Client.authorize(options, (err, authResult) => {
      if (err) {
        throw err;
      }
      // Set access token
      this.storage.set('access_token', authResult.accessToken);
      this.accessToken = authResult.accessToken;
      // Set access token expiration
      const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
      this.storage.set('expires_at', expiresAt);
      // Set logged in
      this.loading = false;
      this.loggedIn = true;
      // Fetch user's profile info
      this.Auth0.client.userInfo(this.accessToken, (err, profile) => {
        if (err) {
          throw err;
        }
        this.storage.set('profile', profile).then(val =>
          this.zone.run(() => this.user = profile)
        );
      });
    });
  }

  logout() {
    this.storage.remove('profile');
    this.storage.remove('access_token');
    this.storage.remove('expires_at');
    this.accessToken = null;
    this.user = null;
    this.loggedIn = false;

    this.safariViewController.isAvailable()
      .then((available: boolean) => {
        let url = `https://${AUTH_CONFIG.domain}/v2/logout?client_id=${AUTH_CONFIG.clientId}&returnTo=${AUTH_CONFIG.packageIdentifier}://${AUTH_CONFIG.domain}/cordova/${AUTH_CONFIG.packageIdentifier}/callback`;
        if (available) {
          this.safariViewController.show({
            url: url
          })
          .subscribe((result: any) => {
              if(result.event === 'opened') console.log('Opened');
              else if(result.event === 'loaded') console.log('Loaded');
              else if(result.event === 'closed') console.log('Closed');
            },
            (error: any) => console.error(error)
          );
        } else {
          // use fallback browser
          this.cordova.InAppBrowser.open(url, '_system');
        }
      }
    );
  }
}
