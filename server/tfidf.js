// Simple TF-IDF vectorizer & cosine similarity for Phase 1 (no external heavy deps)
// This can later be replaced by real embeddings transparently.

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export class TfidfStore {
  constructor() {
    this.docs = new Map(); // id -> { text, tokens, termFreq }
    this.df = {}; // term -> doc count
    this.totalDocs = 0;
  }

  addDocument(id, text) {
    if (!text) return;
    const tokens = tokenize(text);
    const termFreq = {};
    tokens.forEach(t => { termFreq[t] = (termFreq[t] || 0) + 1; });
    // Normalize term frequencies
    const maxFreq = Math.max(...Object.values(termFreq));
    Object.keys(termFreq).forEach(t => { termFreq[t] = termFreq[t] / maxFreq; });

    // If document exists, remove prior DF impact
    if (this.docs.has(id)) {
      const prev = this.docs.get(id);
      const uniquePrev = new Set(Object.keys(prev.termFreq));
      uniquePrev.forEach(term => { this.df[term] -= 1; if (this.df[term] <= 0) delete this.df[term]; });
    } else {
      this.totalDocs += 1;
    }

    const unique = new Set(Object.keys(termFreq));
    unique.forEach(term => { this.df[term] = (this.df[term] || 0) + 1; });

    this.docs.set(id, { text, tokens, termFreq });
  }

  removeDocument(id) {
    if (!this.docs.has(id)) return;
    const prev = this.docs.get(id);
    const uniquePrev = new Set(Object.keys(prev.termFreq));
    uniquePrev.forEach(term => { this.df[term] -= 1; if (this.df[term] <= 0) delete this.df[term]; });
    this.docs.delete(id);
    this.totalDocs = Math.max(0, this.totalDocs - 1);
  }

  _idf(term) {
    if (!this.df[term]) return 0;
    return Math.log((1 + this.totalDocs) / (1 + this.df[term])) + 1; // smooth
  }

  vectorize(id) {
    const entry = this.docs.get(id);
    if (!entry) return {};
    const vec = {};
    Object.entries(entry.termFreq).forEach(([term, tf]) => {
      vec[term] = tf * this._idf(term);
    });
    return vec;
  }

  cosineSim(idA, idB) {
    const a = this.vectorize(idA);
    const b = this.vectorize(idB);
    const terms = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0, magA = 0, magB = 0;
    terms.forEach(t => {
      const va = a[t] || 0;
      const vb = b[t] || 0;
      dot += va * vb;
      magA += va * va;
      magB += vb * vb;
    });
    if (!magA || !magB) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // For a source doc, compute similarity to list of target IDs
  rankSimilar(sourceId, targetIds) {
    return targetIds.map(tid => ({ id: tid, score: this.cosineSim(sourceId, tid) }))
      .sort((a, b) => b.score - a.score);
  }
}

export const globalTfidf = new TfidfStore();
