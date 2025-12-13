import OpenAI from 'openai';

export class OpenAIEngine {
  constructor(apiKey) {
    if (!apiKey) throw new Error('OpenAI API Key required');
    this.openai = new OpenAI({ apiKey });
    this.model = 'gpt-4o'; // Using the latest flagship model
  }

  async evaluateAllStandards(policyText, allStandards) {
    console.log(`🔍 OpenAI Engine: Evaluating policy length ${policyText.length} against ${allStandards.length} standards`);

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

    try {
      console.log("🚀 Sending request to OpenAI...");
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        response_format: { type: "json_object" },
        temperature: 0.1 // Low temperature for consistent JSON
      });

      const text = completion.choices[0].message.content;
      console.log(`📝 OpenAI Raw Response:\n${text}`);

      const data = JSON.parse(text);
      console.log(`✅ OpenAI found ${data.matches?.length || 0} standard matches`);

      return data.matches.map(match => ({
        id: match.standardId,
        score: match.confidence || 0.9,
        reasoning: match.reasoning,
        subStandardMatches: match.subStandardMatches || []
      }));

    } catch (e) {
      console.error(`❌ OpenAI evaluation failed:`, e.message);
      if (e.response) {
        console.error('Response data:', e.response.data);
      }
      return [];
    }
  }
}
