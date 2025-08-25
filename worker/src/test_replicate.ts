// worker/src/test_replicate.ts

import * as dotenv from "dotenv";
import Replicate from "replicate";

// 1. Load environment variables
dotenv.config();

// 2. The Critical Diagnostic
const token = process.env.REPLICATE_API_TOKEN;

if (!token) {
    console.error("CRITICAL ERROR: REPLICATE_API_TOKEN is not defined in process.env!");
} else {
    console.log("--- Replicate Authentication Test ---");
    console.log(`Token found. Starts with: "${token.substring(0, 5)}", Ends with: "${token.substring(token.length - 5)}"`);
    console.log("Attempting to initialize Replicate client...");
}

// 3. The Test
async function runTest() {
    try {
        // Initialize the client. By default, it automatically looks for
        // the REPLICATE_API_TOKEN environment variable. We will not pass it manually.
        const replicate = new Replicate();

        console.log("Client initialized. Making a test API call to list models...");
        
        // Make a simple, low-cost API call to verify authentication works
        const models = await replicate.models.list();
        
        console.log("\n✅ SUCCESS! Authentication is working.");
        console.log(`Successfully fetched a model: ${models?.results[0]?.name}`);

    } catch (error) {
        console.error("\n❌ FAILED! The API call was rejected.");
        console.error("This confirms a fundamental issue with the Replicate library or authentication.");
        console.error("Error details:", error);
    }
}

// Only run the test if the token exists
if (token) {
    runTest();
}