
import { classifyIntent } from '../orchestrators/intent-classifier.js';

async function testIntent() {
    console.log("🧪 Testing Intent Classification Fix...");

    const query = "Tư vấn size áo khoác, cao 175cm nặng 70kg";
    console.log(`\nQuery: "${query}"`);

    try {
        const result = await classifyIntent(query);
        console.log("Result:", JSON.stringify(result, null, 2));

        if (result.intent === 'size_recommendation') {
            console.log("\n✅ PASS: Intent is correctly 'size_recommendation'");
        } else {
            console.log(`\n❌ FAIL: Intent is '${result.intent}' (Expected 'size_recommendation')`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testIntent();
