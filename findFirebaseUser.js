// Ignore first, second items of argv (node bin path and script path)
const [, , email] = process.argv;

if (!email || email == "-h" || email == "--help") {
  console.log("Find user in Firebase Authentication by email.");
  console.log("Usage\t: node findFirebaseUser.js <email>");
  console.log("Example\t: node findFirebaseUser.js john@example.com");
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
  .auth()
  .getUserByEmail(email)
  .then((user) => {
    console.log(user.toJSON());
    process.exit();
  })
  .catch((err) => console.log("[ERROR] could not get user:", err.message));
