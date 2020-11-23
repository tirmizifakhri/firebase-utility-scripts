// Ignore item #0 and #1 of argv (node bin path and script path)
const [, , collectionName, fields, limit = 100] = process.argv;

if (!collectionName || collectionName == "-h" || collectionName == "--help") {
  console.log(
    "List documents in given collection. Limit is set to 100 records by default."
  );
  console.log(
    "Usage\t: node listDocuments.js <collectionName> <fields> <limit=100>"
  );
  console.log("Example\t: node listDocuments.js users id,name,email");
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
  .limit(limit)
  .get()
  .then((snapshot) => {
    let rows = [];

    if (snapshot.empty) {
      console.log("[INFO] collection did not contain any documents yet");
      return;
    }

    if (!fields) {
      console.log(
        "[ERROR] please specify fields to retrieve. possible fields:"
      );
      console.log(Object.keys(snapshot.docs[0].data()));
      return;
    }

    snapshot.forEach((doc) => {
      let data = {};
      fields.split(",").forEach((field) => {
        data.docId = doc.id;
        data[field] = doc.data()[field];
      });
      rows.push(data);
    });
    console.table(rows);
  });
