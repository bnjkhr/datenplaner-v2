// addUser.js
const admin = require('firebase-admin');
const serviceAccount = require('./datenprodukt-planer-app-firebase-adminsdk-fbsvc-9d19599f4d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().createUser({
  email: 'sophie.hoyningen-huene@br.de',
  password: 'Modul13!'
})
.then((userRecord) => {
  console.log('✅ Erfolgreich erstellt:', userRecord.uid);
})
.catch((error) => {
  console.error('❌ Fehler:', error.message);
});