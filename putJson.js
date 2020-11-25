// Ignore item #0 and #1 of argv (node bin path and script path)
const [, , collectionName, json, id] = process.argv;

if (!collectionName || collectionName == "-h" || collectionName == "--help") {
  console.log("Create new document based on given JSON.");
  console.log("Usage\t: node putJson.js <collectionName> <json> <id=autoid>");
  console.log('Example\t: node putJson.js users \'{"name":"John Doe"}\'');
  process.exit(0);
}

if (!json) {
  console.log("[ERROR] json must be specified.");
  process.exit(1);
}

const admin = require("firebase-admin");
const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    process.env.FIRESTORE_DATABASE_URL ||
    `https://${serviceAccount.project_id}.firebaseio.com`,
});

const collectionRef = admin.firestore().collection(collectionName);

const payload = JSON.parse(json);

// If `docId` key exist in payload, use it as firestore document id.
// Else, use `id` from argument or fallback to auto id from firestore.
let docId = null;
if (payload.docId) {
  docId = payload.docId;
  delete payload.docId;
}

(docId || id ? collectionRef.doc(docId || id) : collectionRef.doc())
  .create(payload)
  .then((doc) => {
    console.log("[INFO] document created");
  })
  .catch((err) => {
    console.log("[ERROR] could not create document:", err.message);
  });
