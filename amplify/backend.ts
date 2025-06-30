import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { userSync } from "./functions/user-sync/resource";

const backend = defineBackend({
  auth,
  data,
  userSync,
});

// Only grant the user-sync function access to the database
backend.userSync.addEnvironment(
  "USER_TABLE_NAME",
  backend.data.resources.tables["User"].tableName
);
backend.data.resources.tables["User"].grantWriteData(
  backend.userSync.resources.lambda
);
