// Ignore first, second items of argv (node bin path and script path)
const [, , email, claims] = process.argv;

if (!email || email == "-h" || email == "--help") {
  console.log("Update `roles` value of Firebase user custom claims.");
  console.log("Usage\t: node setRoles.js <email> <claims>");
  console.log("Example\t: node setRoles.js john@example.com ADMIN,TECH");
  process.exit(0);
}

if (!claims) {
  console.log("[ERROR] please specify one or more claims. example:");
  console.log(`node setRoles.js ${email} ADMIN,TECH`);
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

const auth = admin.auth();

auth
  .getUserByEmail(email)
  .then(async (user) => {
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      roles: claims.split(","),
    });

    // Reload user
    user = await auth.getUserByEmail(email);

    console.log("[INFO] roles updated. customClaims is now:");
    console.log(user.toJSON().customClaims);
    process.exit();
  })
  .catch((err) => {
    console.log("[ERROR] could not get user:", err.message);
    process.exit(1);
  });
