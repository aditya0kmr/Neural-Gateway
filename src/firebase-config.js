import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyCOI2izcckQumJ9JnhLG-3Xrd1uSqyRGTU",
    authDomain: "neural-gateway.firebaseapp.com",
    projectId: "neural-gateway",
    storageBucket: "neural-gateway.firebasestorage.app",
    messagingSenderId: "358711638377",
    appId: "1:358711638377:web:5d76e55275b21f7213e5f8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
