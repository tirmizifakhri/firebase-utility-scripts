// Ignore first, second items of argv (node bin path and script path)
const [, , collectionName] = process.argv;

if (!collectionName || collectionName == "-h" || collectionName == "--help") {
  console.log("Usage\t: node countDocuments.js <collectionName>");
  console.log("Example\t: node countDocuments.js users");
  process.exit(0);
}

const admin = require("firebase-admin");
const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    process.env.FIRESTORE_DATABASE_URL ||
    `https://${serviceAccount.project_id}.firebaseio.com`,
});

admin
  .firestore()
  .collection(collectionName)
  .get()
  .then((snapshot) => {
    if (snapshot.empty) {
      console.log("[INFO] collection did not contain any documents yet");
      return;
    }
    console.log(`[INFO] size of ${collectionName}:`, snapshot.size);
  });
