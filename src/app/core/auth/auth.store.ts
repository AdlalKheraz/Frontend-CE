// state.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthStoreService {
  // Créer un signal avec un état initial
  private state = signal({
    logged: false,
  });

  get isLogin() {
    return this.state().logged;
  }

  setLogged(logged: boolean) {
    this.state.update(state => ({
      ...state,
      logged
    }));
  }
}