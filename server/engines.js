// Engine abstraction layer.
import { globalTfidf } from './tfidf.js';
import { OpenAIEngine } from './openai.js';
import { GroqEngine } from './groq.js';

// Registry of available engines
const registry = {
    tfidf: {
        name: 'tfidf',
        description: 'Basic (TF-IDF) - Fast, Keyword based',
        rankPolicyAgainstStandards(policyId, standardIds) {
            return globalTfidf.rankSimilar(policyId, standardIds);
        }
    },
    openai: {
        name: 'openai',
        description: 'Intelligent (OpenAI GPT-4o) - Reasoning based',
        async rankPolicyAgainstStandards() {
            throw new Error('OpenAI engine requires direct data access. Use rankWithEngine instead.');
        }
    },
    groq: {
        name: 'groq',
        description: 'Fast & Intelligent (Groq Llama 3) - Free & Fast',
        async rankPolicyAgainstStandards() {
            throw new Error('Groq engine requires direct data access. Use rankWithEngine instead.');
        }
    }
};

let activeEngine = 'tfidf';

export function listEngines() {
    return Object.values(registry).map(e => ({ name: e.name, description: e.description }));
}

export function getActiveEngine() {
    return activeEngine;
}

export function setActiveEngine(name) {
    if (!registry[name]) throw new Error('Unknown engine: ' + name);
    activeEngine = name;
    return activeEngine;
}

/**
 * Rank a policy against standards using the selected engine.
 */
export async function rankWithEngine(engineName, policyId, standardIds, options = {}) {
    const eng = registry[engineName] || registry[activeEngine];

    if (engineName === 'openai') {
        console.log('🤖 OpenAI engine selected – intelligent multi‑mapping mode');
        if (!options.apiKey) throw new Error('API Key required for OpenAI');
        if (!options.policyText) throw new Error('Policy text required for OpenAI');
        if (!options.standards) throw new Error('Standards data required for OpenAI');

        const openai = new OpenAIEngine(options.apiKey);
        const results = await openai.evaluateAllStandards(options.policyText, options.standards);
        console.log(`✅ OpenAI returned ${results.length} matches`);
        return results;
    }

    if (engineName === 'groq') {
        console.log('🤖 Groq engine selected – intelligent multi‑mapping mode');
        if (!options.apiKey) throw new Error('API Key required for Groq');
        if (!options.policyText) throw new Error('Policy text required for Groq');
        if (!options.standards) throw new Error('Standards data required for Groq');

        const groq = new GroqEngine(options.apiKey);
        const results = await groq.evaluateAllStandards(options.policyText, options.standards);
        console.log(`✅ Groq returned ${results.length} matches`);
        return results;
    }

    // Default TF‑IDF path
    return eng.rankPolicyAgainstStandards(policyId, standardIds);
}
