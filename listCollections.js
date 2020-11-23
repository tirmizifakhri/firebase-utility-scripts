// Ignore item #0 and #1 of argv (node bin path and script path)
const [, , arg] = process.argv;

if (arg == "-h" || arg == "--help") {
  console.log(
    "List name and size (number of documents) of all existing collections."
  );
  console.log("Usage\t: node listCollections.js");
  console.log("Example\t: node listCollections.js");
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
  .listCollections()
  .then((snapshot) => {
    console.log("fetching data..");

    let rows = [];
    snapshot.forEach((snaps) => {
      rows.push({
        collection: snaps["_queryOptions"].collectionId,
      });
    });

    if (!rows.length) {
      console.log(
        `[INFO] firestore database for project ${serviceAccount.project_id} did not have any collections yet`
      );
      return;
    }

    console.log(`${rows.length} collections found..`);

    (async () => {
      await Promise.all(
        rows.map(async ({ collection }, i) => {
          const size = await admin
            .firestore()
            .collection(collection)
            .get()
            .then((collectionSnapshot) => collectionSnapshot.size)
            .catch((err) =>
              console.log("[ERROR] could not get collection size:", err.message)
            );
          rows[i].size = size;
        })
      );
      console.table(rows);
    })();
  })
  .catch((error) => console.log(error));
