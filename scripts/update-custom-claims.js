const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const uid = process.argv[2];
const claims = JSON.parse(process.argv[3]);

if (!uid || !claims) {
  console.error('Usage: node update-custom-claims.js <uid> \'{"role":"admin","admin":true}\'');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, claims)
  .then(() => {
    console.log(`Successfully set custom claims for user ${uid}:`, claims);
  })
  .catch((error) => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
