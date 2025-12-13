import Groq from 'groq-sdk';

export class GroqEngine {
    constructor(apiKey) {
        if (!apiKey) throw new Error('Groq API Key required');
        this.groq = new Groq({ apiKey });
        // List of models to try in order of preference
        this.models = [
            'llama-3.1-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768'
        ];
    }

    async evaluateAllStandards(policyText, allStandards) {
        for (const model of this.models) {
            try {
                console.log(`🤖 Groq Engine: Attempting to use model ${model}`);
                return await this._evaluateWithModel(model, policyText, allStandards);
            } catch (e) {
                console.warn(`⚠️ Model ${model} failed: ${e.message}`);
                if (e.message.includes('400') || e.message.includes('decommissioned') || e.message.includes('not found')) {
                    continue; // Try next model
                }
                // If it's a different error (e.g. auth), stop trying
                break;
            }
        }
        console.error('❌ All Groq models failed.');
        return [];
    }

    async _evaluateWithModel(model, policyText, allStandards) {
        console.log(`🔍 Groq Engine: Evaluating policy length ${policyText.length} against ${allStandards.length} standards`);

        const standardsList = allStandards.map((std, idx) => 
            `${idx + 1}. ID: ${std.id}\n   Title: ${std.title}\n   Content: ${std.contentText.substring(0, 500)}...\n   Sub-Standards: ${std.subStandards?.map(s => s.id).join(', ') || 'None'}`
        ).join('\n\n');

        const prompt = `You are an expert AAAHC surveyor analyzing medical facility policies.

TASK: Read this policy and determine which AAAHC standards it satisfies. A policy can map to MULTIPLE standards if relevant.

POLICY DOCUMENT:
"""
${policyText.substring(0, 20000)}
"""

AVAILABLE AAAHC STANDARDS:
${standardsList}

INSTRUCTIONS:
- Carefully read the policy content.
- Identify ALL standards that this policy addresses, satisfies, OR is relevant to.
- BE PERMISSIVE: If a policy mentions a topic (e.g., "Anesthesia"), it SHOULD map to the corresponding standard (e.g., "Anesthesia Services"), even if it's just a partial match.
- A policy can map to multiple standards.
- For each match, identify which sub-standards (if any) are also satisfied.

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "matches": [
    {
      "standardId": "<standard ID>",
      "reasoning": "<brief explanation of why this policy satisfies this standard>",
      "confidence": <number 0.5-1.0>,
      "subStandardMatches": [
        {"id": "<sub-standard id>", "reasoning": "<why>"}
      ]
    }
  ]
}

Return ONLY the JSON, no other text.`;

        console.log("🚀 Sending request to Groq...");
        const completion = await this.groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model,
            response_format: { type: "json_object" },
            temperature: 0.1 // Low temperature for consistent JSON
        });

        const text = completion.choices[0]?.message?.content || "{}";
        console.log(`📝 Groq Raw Response:\n${text}`);

        const data = JSON.parse(text);
        console.log(`✅ Groq found ${data.matches?.length || 0} standard matches`);
        
        return (data.matches || []).map(match => ({
            id: match.standardId,
            score: match.confidence || 0.9,
            reasoning: match.reasoning,
            subStandardMatches: match.subStandardMatches || []
        }));
    }
}
