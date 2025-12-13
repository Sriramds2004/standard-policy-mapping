import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { globalTfidf } from './tfidf.js';
import { listEngines, getActiveEngine, setActiveEngine, rankWithEngine } from './engines.js';
import { extractByExtension, extractPdfWithMeta } from './extract.js';
import { aaahcStandardsData } from './aaahc-standards-data.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple disk storage for uploaded raw files (policies). Standards PDF will also be stored.
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '_' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// In-memory stores (Phase 1 only)
let policies = []; // {id, title, filename?, contentText, hash}
let standards = []; // {id, title, section?, source?, contentText, subStandards?}
let mappings = []; // {id, policyId, standardId, mappedBy, confidenceScore?}
let subStandardMappings = []; // {id, policyId, standardId, subStandardId, mappedBy, confidenceScore}

let nextIds = { policy: 1, standard: 1, mapping: 1 };

// Utility: basic cleanup
function normalizeText(t = '') {
  return t.replace(/\r/g, ' ').replace(/\n+/g, '\n').trim();
}

// Simple hash (FNV-1a like) for dedupe
function hashText(str = '') {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}

function addPolicy({ title, contentText, filename }) {
  const norm = normalizeText(contentText || '');
  const hash = hashText((norm || '') + '|' + (title || ''));
  if (policies.some(p => p.hash === hash)) return null; // dedupe
  const policy = { id: 'POL-' + nextIds.policy++, title, filename, contentText: norm, hash };
  policies.push(policy);
  // Augment indexing text to improve matching even if content is empty (use title and filename tokens)
  const indexText = [norm, title || '', filename || ''].filter(Boolean).join('\n');
  if (indexText) globalTfidf.addDocument(policy.id, indexText);
  return policy;
}

function mappingExists(policyId, standardId) {
  return mappings.some(m => m.policyId === policyId && m.standardId === standardId);
}

function createMapping({ policyId, standardId, mappedBy = 'AI', confidenceScore }) {
  if (mappingExists(policyId, standardId)) return null;
  const mapping = { id: 'MAP-' + nextIds.mapping++, policyId, standardId, mappedBy, confidenceScore };
  mappings.push(mapping);
  return mapping;
}

// CRUD: Policies
app.get('/api/policies', (_req, res) => res.json(policies));
app.post('/api/policies', (req, res) => {
  const { title, contentText } = req.body;
  if (!title || !contentText) return res.status(400).json({ error: 'title and contentText required' });
  const policy = addPolicy({ title, contentText });
  if (!policy) return res.status(200).json({ message: 'duplicate skipped' });
  res.status(201).json(policy);
});

// File upload (single or multiple policy documents - content extraction to be added later)
app.post('/api/policies/upload', upload.array('files'), (req, res) => {
  const created = [];
  for (const file of req.files) {
    const policy = addPolicy({ title: file.originalname, filename: file.filename, contentText: '' });
    if (policy) created.push(policy);
  }
  res.status(201).json({ uploaded: created });
});

// CRUD: Standards
app.get('/api/standards', (_req, res) => res.json(standards));
app.post('/api/standards', (req, res) => {
  const { title, contentText, source, section } = req.body;
  if (!title || !contentText) return res.status(400).json({ error: 'title and contentText required' });
  const std = { id: 'STD-' + nextIds.standard++, title, source: source || 'UNKNOWN', section: section || '', contentText: normalizeText(contentText) };
  standards.push(std);
  // Include title and section in index to improve recall
  const indexText = [std.title, std.section, std.contentText].filter(Boolean).join('\n');
  globalTfidf.addDocument(std.id, indexText);
  res.status(201).json(std);
});

// Upload standards PDF (placeholder - parsing to be implemented later)
app.post('/api/standards/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const { parse = false } = req.body || {};
  if (!parse) {
    return res.status(201).json({ message: 'Standards PDF stored. Set parse=true to attempt naive segmentation (placeholder).', filename: req.file.filename });
  }
  // Placeholder naive segmentation: create one standard referencing the PDF filename.
  const std = { id: 'STD-' + nextIds.standard++, title: 'Imported Standards Document', source: 'PDF', section: '', contentText: `PDF File: ${req.file.originalname}` };
  standards.push(std);
  globalTfidf.addDocument(std.id, std.contentText);
  res.status(201).json({ message: 'Parsed placeholder standards (real PDF parsing TBD)', created: [std] });
});

// Mappings
app.get('/api/mappings', (_req, res) => res.json(mappings));
app.get('/api/sub-mappings', (_req, res) => res.json(subStandardMappings));
app.post('/api/mappings', (req, res) => {
  const { policyId, standardId, mappedBy = 'user', confidenceScore } = req.body;
  if (!policyId || !standardId) return res.status(400).json({ error: 'policyId and standardId required' });
  if (!policies.find(p => p.id === policyId) || !standards.find(s => s.id === standardId)) return res.status(404).json({ error: 'policy or standard not found' });
  const mapping = { id: 'MAP-' + nextIds.mapping++, policyId, standardId, mappedBy, confidenceScore };
  mappings.push(mapping);
  res.status(201).json(mapping);
});

// Bulk ingest endpoint for convenience
app.post('/api/ingest', (req, res) => {
  const { policies: pols = [], standards: stds = [] } = req.body || {};
  const created = { policies: [], standards: [] };
  for (const p of pols) {
    if (p.title && p.contentText) {
      const policy = { id: 'POL-' + nextIds.policy++, title: p.title, contentText: normalizeText(p.contentText) };
      policies.push(policy); created.policies.push(policy);
      globalTfidf.addDocument(policy.id, policy.contentText);
    }
  }
  for (const s of stds) {
    if (s.title && s.contentText) {
      const std = { id: 'STD-' + nextIds.standard++, title: s.title, source: s.source || 'UNKNOWN', section: s.section || '', contentText: normalizeText(s.contentText) };
      standards.push(std); created.standards.push(std);
      globalTfidf.addDocument(std.id, std.contentText);
    }
  }
  res.status(201).json(created);
});

// Filesystem ingest (Phase 1) - traverses Policies_docs directory structure and creates policy stubs.
app.post('/api/ingest/fs', async (req, res) => {
  const { baseDir = 'Policies_docs' } = req.body || {};
  // Try several resolution strategies
  const candidates = [
    path.join(process.cwd(), baseDir),
    path.join(process.cwd(), '..', baseDir),
    path.isAbsolute(baseDir) ? baseDir : null
  ].filter(Boolean);
  let abs = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { abs = c; break; }
  }
  if (!abs) {
    return res.status(400).json({ error: 'Directory not found', tried: candidates });
  }
  let created = [];
  async function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else {
        const text = await extractByExtension(full);
        const policy = addPolicy({ title: ent.name, contentText: text });
        if (policy) created.push(policy);
      }
    }
  }
  await walk(abs);
  res.status(201).json({ baseResolved: abs, ingested: created.length, skippedDuplicates: created.length === 0 ? 'possible all duplicates' : policies.length - created.length, preview: created.slice(0, 20) });
});

// Placeholder auto-map endpoint (will be implemented after TF-IDF utility is added)
app.post('/api/auto-map', async (req, res) => {
  const { policyId, threshold = 0.2, limit = 10, engine } = req.body || {};
  if (!policyId) return res.status(400).json({ error: 'policyId required' });
  const policy = policies.find(p => p.id === policyId);
  if (!policy) return res.status(404).json({ error: 'policy not found' });
  // Ensure it's indexed (in case content updated later).
  globalTfidf.addDocument(policy.id, policy.contentText || '');
  const ranked = await rankWithEngine(engine || getActiveEngine(), policy.id, standards.map(s => s.id));
  const filtered = ranked.filter(r => r.score >= threshold).slice(0, limit);
  res.json({ policyId, threshold, engine: engine || getActiveEngine(), count: filtered.length, matches: filtered.map(r => ({ standardId: r.id, score: r.score })) });
});

// Batch auto-map: returns matches per policy without persisting
app.post('/api/auto-map/batch', async (req, res) => {
  const { policyIds, threshold = 0.2, limitPerPolicy = 10, engine } = req.body || {};
  const ids = Array.isArray(policyIds) && policyIds.length ? policyIds : policies.map(p => p.id);
  const results = [];
  for (const pid of ids) {
    const policy = policies.find(p => p.id === pid);
    if (!policy) continue;
    globalTfidf.addDocument(policy.id, policy.contentText || '');
    const ranked = await rankWithEngine(engine || getActiveEngine(), policy.id, standards.map(s => s.id));
    const filtered = ranked.filter(r => r.score >= threshold).slice(0, limitPerPolicy);
    results.push({ policyId: pid, matches: filtered.map(r => ({ standardId: r.id, score: r.score })) });
  }
  res.json({ engine: engine || getActiveEngine(), threshold, policiesProcessed: results.length, results });
});

// Apply auto-map suggestions and persist mappings for multiple policies
app.post('/api/auto-map/apply', async (req, res) => {
  const { policyIds, apiKey, engine = 'tfidf' } = req.body;
  if (!policyIds || !Array.isArray(policyIds)) return res.status(400).json({ error: 'policyIds array required' });

  let totalCreated = 0;
  let totalSubMappingsCreated = 0;
  const details = [];

  // If using Gemini, OpenAI, or Groq, we process sequentially to avoid rate limits
  const isGemini = engine === 'gemini';
  const isOpenAI = engine === 'openai';
  const isGroq = engine === 'groq';
  const isAI = isGemini || isOpenAI || isGroq;

  for (const pid of policyIds) {
    const policy = policies.find(p => p.id === pid);
    if (!policy) continue;

    // Get rankings
    // For TF-IDF, we need to explicitly include sub-standards in the target list
    let targetIds = standards.map(s => s.id);
    if (!isAI) {
      for (const s of standards) {
        if (s.subStandards) {
          for (const sub of s.subStandards) {
            targetIds.push(`${s.id}::${sub.id}`);
          }
        }
      }
    }

    let rankings;

    try {
      rankings = await rankWithEngine(engine, pid, targetIds, {
        apiKey,
        policyText: policy.contentText,
        standards: standards
      });
    } catch (e) {
      console.error(`Mapping failed for ${pid}:`, e.message);
      details.push({ policyId: pid, error: e.message });
      continue;
    }

    // Filter for good matches
    // AI engines return { id, score, reasoning, subStandardMatches }
    // TF-IDF returns { id, score } where id might be "STD-X::SUB-Y"

    const bestMatch = rankings.length > 0 ? rankings[0] : null;
    let created = 0;
    let subCreated = 0;

    // Iterate through ALL matches returned by the engine
    for (const match of rankings) {
      // For AI, trust the selection (score > 0). For TF-IDF, use threshold.
      if (match.score >= (isAI ? 0.0 : 0.15)) {

        let stdId = match.id;
        let subId = null;

        // Check if this is a sub-standard match (TF-IDF only)
        if (!isAI && match.id.includes('::')) {
          [stdId, subId] = match.id.split('::');
        }

        // 1. Ensure Main Standard Mapping Exists
        const exists = mappings.find(m => m.policyId === pid && m.standardId === stdId);
        if (!exists) {
          mappings.push({
            id: 'MAP-' + nextIds.mapping++,
            policyId: pid,
            standardId: stdId,
            mappedBy: isAI ? `AI-${engine.charAt(0).toUpperCase() + engine.slice(1)}` : 'AI',
            confidenceScore: match.score,
            reasoning: match.reasoning // Save reasoning
          });
          created++;
          totalCreated++;
        }

        // 2. Handle Sub-Standards
        // Case A: AI Engine (returns subStandardMatches array)
        if (isAI && match.subStandardMatches) {
          for (const sub of match.subStandardMatches) {
            const subExists = subStandardMappings.find(m => m.policyId === pid && m.subStandardId === sub.id);
            if (!subExists) {
              subStandardMappings.push({
                id: 'SUBMAP-' + (subStandardMappings.length + 1),
                policyId: pid,
                standardId: stdId,
                subStandardId: sub.id,
                mappedBy: `AI-${engine.charAt(0).toUpperCase() + engine.slice(1)}`,
                confidenceScore: sub.score || 0.8,
                reasoning: sub.reasoning
              });
              subCreated++;
              totalSubMappingsCreated++;
            }
          }
        }
        // Case B: TF-IDF Engine (returns separate match entry for sub-standard)
        else if (!isAI && subId) {
          const subExists = subStandardMappings.find(m => m.policyId === pid && m.subStandardId === subId);
          if (!subExists) {
            subStandardMappings.push({
              id: 'SUBMAP-' + (subStandardMappings.length + 1),
              policyId: pid,
              standardId: stdId,
              subStandardId: subId,
              mappedBy: 'AI', // TF-IDF
              confidenceScore: match.score,
              reasoning: 'Keyword match via TF-IDF'
            });
            subCreated++;
            totalSubMappingsCreated++;
          }
        }
      }
    }


    details.push({
      policyId: pid,
      created,
      subMappingsCreated: subCreated,
      bestScore: bestMatch ? bestMatch.score : 0
    });
  }

  res.json({
    engine,
    policiesProcessed: policyIds.length,
    totalCreated,
    totalSubMappingsCreated,
    details
  });
});

// Standards segmentation endpoint
app.post('/api/standards/segment', (req, res) => {
  const { rawText, source = 'SEGMENTED' } = req.body || {};
  if (!rawText) return res.status(400).json({ error: 'rawText required' });

  const segments = segmentStandards(rawText, source);
  let created = [];

  for (const segment of segments) {
    const std = {
      id: 'STD-' + nextIds.standard++,
      title: segment.title,
      source: segment.source,
      section: segment.section,
      contentText: normalizeText(segment.content)
    };
    standards.push(std);
    globalTfidf.addDocument(std.id, std.contentText);
    created.push(std);
  }

  res.status(201).json({
    source,
    segmentsFound: segments.length,
    created: created.length,
    preview: created.slice(0, 10)
  });
});

// Process AAAHC PDF endpoint
app.post('/api/standards/process-pdf', async (req, res) => {
  const { filename = 'AAAHC Standard.pdf', source = 'AAAHC' } = req.body || {};
  const pdfPath = path.join(process.cwd(), '..', filename);

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF file not found', pathTried: pdfPath });
  }

  try {
    const meta = await extractPdfWithMeta(pdfPath);
    if (!meta) {
      return res.status(500).json({ error: 'Failed to parse PDF (library error)' });
    }

    const text = meta.text || '';
    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        error: 'Could not extract text from PDF',
        likelyCause: 'The PDF may be scanned images without a text layer (needs OCR).',
        suggestions: [
          'Upload or provide a text-based version (DOCX/TXT) of the standards',
          'Use an OCR tool to convert the scanned PDF to searchable text and try again',
          'Alternatively, provide a .txt export and use /api/standards/process-txt'
        ],
        numpages: meta.numpages || 0
      });
    }

    const segments = segmentStandards(text, source);
    let created = [];

    for (const segment of segments) {
      const std = {
        id: 'STD-' + nextIds.standard++,
        title: segment.title,
        source: segment.source,
        section: segment.section,
        contentText: normalizeText(segment.content)
      };
      standards.push(std);
      globalTfidf.addDocument(std.id, std.contentText);
      created.push(std);
    }

    res.status(201).json({
      filename,
      textLength: text.length,
      segmentsFound: segments.length,
      created: created.length,
      preview: created.slice(0, 10)
    });
  } catch (e) {
    res.status(500).json({ error: 'PDF processing failed: ' + e.message });
  }
});

// Alternative: process a plain text file of standards
app.post('/api/standards/process-txt', async (req, res) => {
  const { filename, source = 'TXT' } = req.body || {};
  if (!filename) return res.status(400).json({ error: 'filename required' });
  const txtPath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), '..', filename);
  if (!fs.existsSync(txtPath)) {
    return res.status(404).json({ error: 'Text file not found', pathTried: txtPath });
  }
  try {
    const text = fs.readFileSync(txtPath, 'utf8');
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Text file appears empty or too short' });
    }
    const segments = segmentStandards(text, source);
    let created = [];
    for (const segment of segments) {
      const std = {
        id: 'STD-' + nextIds.standard++,
        title: segment.title,
        source: segment.source,
        section: segment.section,
        contentText: normalizeText(segment.content)
      };
      standards.push(std);
      globalTfidf.addDocument(std.id, std.contentText);
      created.push(std);
    }
    res.status(201).json({ filename, segmentsFound: segments.length, created: created.length, preview: created.slice(0, 10) });
  } catch (e) {
    res.status(500).json({ error: 'TXT processing failed: ' + e.message });
  }
});

// Quick stats endpoint
app.get('/api/stats', (_req, res) => {
  res.json({ policies: policies.length, standards: standards.length, mappings: mappings.length });
});

// Engines endpoints
app.get('/api/engines', (_req, res) => {
  res.json({ active: getActiveEngine(), available: listEngines() });
});
app.post('/api/engines/activate', (req, res) => {
  try {
    const { engine } = req.body || {};
    if (!engine) return res.status(400).json({ error: 'engine required' });
    const active = setActiveEngine(engine);
    res.json({ active });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Coverage endpoint
app.get('/api/standards/coverage', (_req, res) => {
  const coverage = standards.map(std => {
    const stdMappings = mappings.filter(m => m.standardId === std.id);
    const uniquePolicies = [...new Set(stdMappings.map(m => m.policyId))];

    let subStandardsCovered = 0;
    let subStandardsTotal = 0;
    let subStandardsDetails = [];

    if (std.subStandards && std.subStandards.length > 0) {
      subStandardsTotal = std.subStandards.length;
      subStandardsDetails = std.subStandards.map(sub => {
        const subMappings = subStandardMappings.filter(m =>
          m.standardId === std.id && m.subStandardId === sub.id
        );
        const subPolicies = [...new Set(subMappings.map(m => m.policyId))];
        if (subPolicies.length > 0) subStandardsCovered++;

        return {
          subStandardId: sub.id,
          title: sub.title,
          description: sub.description,
          mappedPolicies: subPolicies.length,
          coveragePercent: subPolicies.length > 0 ? '100' : '0' // Simple binary coverage for now
        };
      });
    }

    return {
      standardId: std.id,
      title: std.title,
      category: std.category,
      section: std.section,
      version: std.version,
      totalMappedPolicies: uniquePolicies.length,
      subStandardsTotal,
      subStandardsCovered,
      subStandards: subStandardsDetails
    };
  });

  res.json({
    totalStandards: standards.length,
    totalPolicies: policies.length,
    coverage
  });
});

// Reset all in-memory data
// Helper: rebuild TF-IDF index from current policies/standards
function rebuildTfidfIndex() {
  try {
    if (globalTfidf?.docs?.clear) {
      globalTfidf.docs.clear();
    }
    globalTfidf.df = {};
    globalTfidf.totalDocs = 0;
  } catch (_) {
    // no-op if structure differs
  }
  // Re-index policies (content + title + filename when available)
  for (const p of policies) {
    const indexText = [p.contentText || '', p.title || '', p.filename || ''].filter(Boolean).join('\n');
    if (indexText) globalTfidf.addDocument(p.id, indexText);
  }
  // Re-index standards (include category when present)
  for (const s of standards) {
    const indexText = [s.title || '', s.category || '', s.section || '', s.contentText || ''].filter(Boolean).join('\n');
    if (indexText) globalTfidf.addDocument(s.id, indexText);
  }
}

// Reset endpoint: by default only clears mappings; optional flags allow full reset
// Body or query params supported:
// - dropPolicies: boolean (default false)
// - dropStandards: boolean (default false)
// - reindex: boolean (default true if any drop flags true; otherwise false)
app.post('/api/reset', (req, res) => {
  const qp = req.query || {};
  const body = req.body || {};
  const dropPolicies = (body.dropPolicies ?? (qp.policies === 'true')) || false;
  const dropStandards = (body.dropStandards ?? (qp.standards === 'true')) || false;
  const explicitReindex = body.reindex ?? (qp.reindex === 'true' ? true : (qp.reindex === 'false' ? false : undefined));

  // Always clear mappings by default
  const prev = { policies: policies.length, standards: standards.length, mappings: mappings.length, subStandardMappings: subStandardMappings.length };
  mappings = [];
  subStandardMappings = [];
  nextIds.mapping = 1; // reset mapping counter only

  // Optionally drop policies/standards
  if (dropPolicies) {
    policies = [];
    nextIds.policy = 1;
  }
  if (dropStandards) {
    standards = [];
    nextIds.standard = 1;
  }

  // Determine if we should reindex TF-IDF
  const shouldReindex = explicitReindex !== undefined ? explicitReindex : (dropPolicies || dropStandards);
  if (shouldReindex) {
    rebuildTfidfIndex();
  }

  res.json({
    message: 'Reset completed.',
    actions: {
      clearedMappings: true,
      droppedPolicies: !!dropPolicies,
      droppedStandards: !!dropStandards,
      reindexed: !!shouldReindex
    },
    before: prev,
    after: { policies: policies.length, standards: standards.length, mappings: mappings.length }
  });
});

// Utility function to segment standards text
function segmentStandards(text, source) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for heading patterns
    const sectionMatch = line.match(/^SECTION\s+(\d+)\s*[:-]?\s*(.*)$/i);
    const numberMatch = line.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);
    const numberedTitleMatch = line.match(/^(\d+(?:\.\d+)*)\s*[:-]?\s*(.*)$/);

    if (sectionMatch) {
      // Save previous segment
      if (currentSegment) {
        segments.push(currentSegment);
      }
      // Start new segment
      currentSegment = {
        title: `Section ${sectionMatch[1]}: ${sectionMatch[2] || 'Untitled'}`,
        section: `SECTION ${sectionMatch[1]}`,
        source,
        content: ''
      };
    } else if (numberMatch && numberMatch[2].length > 3) {
      // Save previous segment
      if (currentSegment) {
        segments.push(currentSegment);
      }
      // Start new segment
      currentSegment = {
        title: `${numberMatch[1]} ${numberMatch[2]}`,
        section: numberMatch[1],
        source,
        content: ''
      };
    } else {
      // Add content to current segment
      if (currentSegment) {
        currentSegment.content += (currentSegment.content ? '\n' : '') + line;
      }
    }
  }

  // Don't forget the last segment
  if (currentSegment) {
    segments.push(currentSegment);
  }

  // Filter out very short segments (likely headers/footers)
  return segments.filter(s => s.content && s.content.length > 50);
}

// Auto-initialize with sample data on startup
async function autoInitialize() {
  console.log('🚀 Auto-initializing Policy Documents Module...');

  try {
    // Load policies from filesystem
    console.log('📁 Loading policies from Policies_docs...');
    // When running from server dir vs root, need to check both paths
    let policiesBase = path.join(process.cwd(), 'Policies_docs');
    if (!fs.existsSync(policiesBase)) {
      policiesBase = path.join(process.cwd(), '..', 'Policies_docs');
    }
    if (!fs.existsSync(policiesBase)) {
      // Try one more: server/../Policies_docs when cwd is server
      policiesBase = path.join(__dirname, '..', 'Policies_docs');
    }
    console.log(`   📂 Looking for policies at: ${policiesBase}`);
    console.log(`   📂 Directory exists: ${fs.existsSync(policiesBase)}`);
    if (fs.existsSync(policiesBase)) {
      let created = [];
      let skipped = 0;
      let errors = 0;
      async function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            await walk(full);
          } else {
            try {
              const text = await extractByExtension(full);
              const policy = addPolicy({ title: ent.name, contentText: text, filename: ent.name });
              if (policy) {
                created.push(policy);
              } else {
                skipped++;
              }
            } catch (err) {
              errors++;
              console.log(`   ⚠️  Error processing ${ent.name}: ${err.message}`);
            }
          }
        }
      }
      await walk(policiesBase);
      console.log(`✅ Loaded ${created.length} policies (${skipped} duplicates skipped, ${errors} errors)`);
    } else {
      console.log(`   ❌ Policies directory not found at ${policiesBase}`);
    }

    // Load comprehensive AAAHC standards with sub-standards
    console.log('📚 Loading comprehensive AAAHC standards...');

    for (const stdData of aaahcStandardsData) {
      const std = {
        id: 'STD-' + nextIds.standard++,
        title: stdData.title,
        source: stdData.source,
        category: stdData.category,
        version: stdData.version,
        section: stdData.section,
        contentText: normalizeText(stdData.contentText),
        subStandards: stdData.subStandards || []
      };
      standards.push(std);
      // Include category and version in index for better matching
      const indexText = [std.title, std.category, std.section, std.contentText].filter(Boolean).join('\n');
      globalTfidf.addDocument(std.id, indexText);

      // Also index each sub-standard individually for granular mapping
      if (std.subStandards && std.subStandards.length > 0) {
        for (const subStd of std.subStandards) {
          const subIndexText = [subStd.title, subStd.description].filter(Boolean).join(' ');
          // Store sub-standard reference with parent standard ID
          globalTfidf.addDocument(`${std.id}::${subStd.id}`, subIndexText);
        }
      }
    }

    const totalSubStandards = aaahcStandardsData.reduce((sum, std) => sum + (std.subStandards?.length || 0), 0);
    console.log(`✅ Loaded ${aaahcStandardsData.length} AAAHC standards with ${totalSubStandards} sub-standards`);

    // Try to process AAAHC PDF if it exists
    const pdfPath = path.join(process.cwd(), '..', 'AAAHC Standard.pdf');
    if (fs.existsSync(pdfPath)) {
      console.log('📄 Processing AAAHC PDF...');
      try {
        const text = await extractByExtension(pdfPath);
        if (text && text.length > 100) {
          const segments = segmentStandards(text, 'AAAHC-PDF');
          for (const segment of segments) {
            const std = {
              id: 'STD-' + nextIds.standard++,
              title: segment.title,
              source: segment.source,
              section: segment.section,
              contentText: normalizeText(segment.content)
            };
            standards.push(std);
            globalTfidf.addDocument(std.id, std.contentText);
          }
          console.log(`✅ Processed PDF: ${segments.length} additional standards created`);
        } else {
          console.log('⚠️  PDF has no extractable text (likely scanned images)');
        }
      } catch (e) {
        console.log('⚠️  PDF processing failed:', e.message);
      }
    }

    console.log('📊 System initialized:');
    console.log(`   Policies: ${policies.length}`);
    console.log(`   Standards: ${standards.length}`);
    console.log(`   Ready for AI mapping!`);

  } catch (error) {
    console.error('❌ Auto-initialization failed:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await autoInitialize();
  console.log('🎉 Policy Documents Module ready for use!');
});
