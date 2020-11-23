// Ignore first, second items of argv (node bin path and script path)
const [, , collectionName, fieldName, findValue] = process.argv;

if (!collectionName || collectionName == "-h" || collectionName == "--help") {
  console.log(
    "Usage\t: node findByField.js <collectionName> <columnName> <findValue>"
  );
  console.log("Example\t: node findByField.js users email john@example.com");
  process.exit(0);
}

const admin = require("firebase-admin");
const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE);

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    process.env.FIRESTORE_DATABASE_URL ||
    `https://${serviceAccount.project_id}.firebaseio.com`,
});

const firestore = firebaseAdmin.firestore();

firestore
  .collection(collectionName)
  .where(fieldName, "==", findValue)
  .get()
  .then((snapshot) => {
    if (snapshot.empty) {
      console.log("[INFO] documents not found");
      return;
    }

    snapshot.forEach((doc) => {
      console.log(doc.data());
    });
  });
