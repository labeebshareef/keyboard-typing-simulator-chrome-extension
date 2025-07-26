import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration - In a real deployment, these would be environment variables
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'keyboard-typing-sim.firebaseapp.com',
  databaseURL: 'https://keyboard-typing-sim-default-rtdb.firebaseio.com',
  projectId: 'keyboard-typing-sim',
  storageBucket: 'keyboard-typing-sim.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;
