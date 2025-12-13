import { GroqEngine } from './groq.js';
import { aaahcStandardsData } from './aaahc-standards-data.js';

// Sample policy text that SHOULD map to Anesthesia (ASG) and Patient Rights (PRR)
const samplePolicyText = `
POLICY TITLE: Anesthesia Informed Consent
EFFECTIVE DATE: 01/01/2024

POLICY:
It is the policy of this facility that all patients undergoing procedures requiring anesthesia must provide informed consent prior to the administration of anesthesia.

PROCEDURE:
1. The anesthesia provider must explain the risks, benefits, and alternatives of the proposed anesthesia plan to the patient.
2. The patient must have the opportunity to ask questions.
3. Informed consent must be documented in the medical record prior to the procedure.
4. The consent form must be signed by the patient (or legal representative) and the anesthesia provider.
5. This process ensures patient rights are respected and safety is maintained.
`;

async function runDebug() {
    const apiKey = process.argv[2];
    if (!apiKey) {
        console.error("❌ Please provide an API key as an argument.");
        process.exit(1);
    }

    console.log("🚀 Starting Groq Debug Script...");
    console.log(`📚 Loaded ${aaahcStandardsData.length} standards.`);

    const engine = new GroqEngine(apiKey);

    console.log("\n📝 Testing Policy: 'Anesthesia Informed Consent'");
    console.log("---------------------------------------------------");

    try {
        const results = await engine.evaluateAllStandards(samplePolicyText, aaahcStandardsData);

        console.log("\n✅ Debug Results:");
        console.log(`Found ${results.length} matches.`);

        if (results.length === 0) {
            console.error("❌ ZERO MAPPINGS FOUND. Debugging needed.");
        } else {
            results.forEach(match => {
                console.log(`\n🔹 MATCH: ${match.id}`);
                console.log(`   Score: ${match.score}`);
                console.log(`   Reasoning: ${match.reasoning}`);
                if (match.subStandardMatches && match.subStandardMatches.length > 0) {
                    console.log(`   Sub-Standards: ${match.subStandardMatches.map(s => s.id).join(', ')}`);
                }
            });
        }

    } catch (error) {
        console.error("❌ Fatal Error:", error);
    }
}

runDebug();
