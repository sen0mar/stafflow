import dotenv from "dotenv";

dotenv.config({ path: "../.env.local", quiet: true });
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

process.env.NODE_ENV = "test";
process.env.CLIENT_URL ??= "http://localhost:5173";
process.env.DATABASE_URL ??= "postgresql://localhost/stafflow_validation";
process.env.DEMO_MODE ??= "false";
process.env.DEMO_UPLOADS_ENABLED ??= "false";
