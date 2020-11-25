// Ignore item #0 and #1 of argv (node bin path and script path)
const [, , collectionName, fieldsToRetrieve, sortBy, limit = 5] = process.argv;

if (!collectionName || collectionName == "-h" || collectionName == "--help") {
  console.log(
    "Get the latest documents in collection. Limit is set to 5 records by default."
  );
  console.log(
    "Usage\t: node getLatestDocuments.js <collectionName> <fieldsToRetrieve> <sortBy> <limit=5>"
  );
  console.log("Example\t: node listDocumentsTemplate.js users name,email createdAt 5");
  process.exit(0);
}

if (!fieldsToRetrieve || !sortBy){
  console.log('[ERROR] Please specify your documents')
  process.exit(1)
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
  .orderBy(sortBy, 'desc')
  .limit(parseInt(limit))
  .get()
  .then((snapshot) => {
    let rows = [];

    if (snapshot.empty) {
      console.log("[INFO] collection did not contain any documents yet");
      return;
    }

    snapshot.forEach((doc) => {
      let data = {};
      fieldsToRetrieve.split(",").forEach((field) => {
        data.docId = doc.id;
        data[field] = doc.data()[field];
      });
      rows.push(data);
    });

    // Uncomment to display data
    console.table(rows);

    // Add your code here
    // const lastFiveRes = data.orderBy('createdAt', 'desc').limit(5).get();
    // db.collectionName('admin').orderBy("createdAt").limit(5)
    // admin.orderBy("createdAt", desc.limit(5))
  });
