import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 5000;
const databaseConnected = await connectDatabase();

console.log(databaseConnected ? "MongoDB connected" : "Running without MongoDB");

app.listen(port, () => {
  console.log(`Nextexa API listening on port ${port}`);
});
