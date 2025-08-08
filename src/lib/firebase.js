import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase - los valores deben ser reemplazados por los del proyecto real
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Servicios que se utilizarán en la aplicación
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
