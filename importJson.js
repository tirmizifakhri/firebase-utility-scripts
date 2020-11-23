// Ignore first, second items of argv (node bin path and script path)
const [, , jsonFile, collectionName, documentId] = process.argv;

if (!collectionName || collectionName == "-h" || collectionName == "--help") {
  console.log("Import data from json file to Firestore.");
  console.log(
    "Usage\t: node importJson.js <collectionName> <jsonFile> <documentId=null>"
  );
  console.log("Example\t: node importJson.js users users.json id");
  process.exit(0);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, ms);
  });
}

async function commitBatches(batches) {
  for (let i = 0; i < batches.length; i++) {
    await sleep(1000);
    await batches[i].commit();
    console.log(`✔ batch ${i + 1} of ${batches.length}`);
  }
}

const fs = require("fs");
const JSONStream = require("JSONStream");
const admin = require("firebase-admin");
const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    process.env.FIRESTORE_DATABASE_URL ||
    `https://${serviceAccount.project_id}.firebaseio.com`,
});

const firestore = admin.firestore();

let rowCount = 0;

let counter = 0;
let commitCounter = 0;
const batches = [];
batches[commitCounter] = firestore.batch();

const fieldTypes = {
  timestamp: [
    "created_at",
    "updated_at",
    "deleted_at",
    "submitted_at",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "submittedAt",
  ],
};

fs.createReadStream(jsonFile)
  .pipe(JSONStream.parse("*"))
  .on("data", (data) => {
    rowCount++;

    if (counter < 499) {
      if (documentId && !data[documentId]) {
        console.log(
          `[ERROR] invalid document id at row ${rowCount}:`,
          data[documentId],
          data
        );
        process.exit();
      }

      let ref = null;
      if (documentId) {
        ref = firestore.collection(collectionName).doc(data[documentId]);
      } else {
        ref = firestore.collection(collectionName).doc();
      }

      if (documentId) {
        delete data[documentId];
      }

      // Uncomment to rename old id field
      if (data.id) {
        data.old_id = data.id;
        delete data.id;
      }

      for (let key in data) {
        // Convert timestamps
        if (fieldTypes.timestamp.includes(key)) {
          data[key] =
            data[key] && new Date(data[key]) != "Invalid Date"
              ? new Date(data[key])
              : null;
        }
      }

      // Add rowNum
      data.rowNum = String(rowCount + 1);

      // Rename created_at to createdAt
      if (data.created_at) {
        data.createdAt = data.created_at;
        delete data.created_at;
      }

      batches[commitCounter].set(ref, data);

      counter++;
    } else {
      counter = 0;
      commitCounter++;
      batches[commitCounter] = firestore.batch();
    }
  })
  .on("end", async () => {
    console.log(
      `[INFO] importing ${rowCount} rows to ${collectionName} collection..`
    );

    await commitBatches(batches);
    console.log("[INFO] import completed");
  });
