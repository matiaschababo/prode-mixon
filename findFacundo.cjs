const admin = require('firebase-admin');

admin.initializeApp({
  projectId: "prode-mixon-2026-36579"
});

const db = admin.firestore();

async function run() {
  try {
    const querySnapshot = await db.collection("users").get();
    querySnapshot.forEach((doc) => {
      if (doc.data().name && doc.data().name.toLowerCase().includes('facundo')) {
        console.log(doc.id, ' => ', doc.data());
      }
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
