import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'devsync-c618f',
        appId: '1:363842488352:web:fbda6625888ace36265445',
        storageBucket: 'devsync-c618f.firebasestorage.app',
        apiKey: 'AIzaSyCEuFU-HY9GrICb4Gob5STtYuBddsS4Hug',
        authDomain: 'devsync-c618f.firebaseapp.com',
        messagingSenderId: '363842488352',
        databaseURL: "https://devsync-c618f-default-rtdb.europe-west1.firebasedatabase.app"
      })
    ),

    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage())
  ]
};