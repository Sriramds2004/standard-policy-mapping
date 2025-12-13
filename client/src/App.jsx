import { useState, useEffect } from 'react';
import './App.css';



function App() {
  const [activeTab, setActiveTab] = useState('documents');
  const [standards, setStandards] = useState([]); // from backend
  const [policies, setPolicies] = useState([]);   // from backend
  const [mappings, setMappings] = useState([]);   // accepted mappings (manual or AI)
  const [subMappings, setSubMappings] = useState([]); // accepted sub-standard mappings
  const [manualLinks, setManualLinks] = useState([]); // local only legacy manual links
  const [selectedPolicyLocal, setSelectedPolicyLocal] = useState(''); // index for legacy manual link
  const [selectedStandardLocal, setSelectedStandardLocal] = useState('');

  // AI panel state
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [selectedPolicyIds, setSelectedPolicyIds] = useState([]);
  const [autoMapResults, setAutoMapResults] = useState([]); // {standardId, score}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Coverage view state
  const [coverageData, setCoverageData] = useState(null);
  const [expandedStandards, setExpandedStandards] = useState({});

  // AI Settings
  const [apiKey, setApiKey] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('tfidf'); // 'tfidf' or 'gemini'
  const [showSettings, setShowSettings] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  // Fetch base data
  const fetchAll = async () => {
    try {
      const [pRes, sRes, mRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/policies`),
        fetch(`${API_BASE}/standards`),
        fetch(`${API_BASE}/mappings`),
        fetch(`${API_BASE}/sub-mappings`)
      ]);
      const [pData, sData, mData, subData] = await Promise.all([
        pRes.json(),
        sRes.json(),
        mRes.json(),
        subRes.json()
      ]);
      setPolicies(pData);
      setStandards(sData);
      setMappings(mData);
      setSubMappings(subData);
      // Also fetch coverage data
      await fetchCoverage();
    } catch (e) {
      setError('Failed to fetch data from backend. Ensure server running on port 5000.');
    }
  };

  const fetchCoverage = async () => {
    try {
      const res = await fetch(`${API_BASE}/standards/coverage`);
      const data = await res.json();
      setCoverageData(data);
    } catch (e) {
      console.error('Failed to fetch coverage data:', e);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Trigger filesystem ingestion (server side extraction of docx/pdf)
  const handleIngestFromFS = async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/ingest/fs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseDir: 'Policies_docs' }) });
      if (!res.ok) throw new Error('Ingest failed');
      await fetchAll();
    } catch (e) {
      setError('Filesystem ingest failed. Check that Policies_docs exists at root.');
    }
  };

  // Process AAAHC PDF into standards
  const handleProcessPDF = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/standards/process-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'AAAHC Standard.pdf' })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchAll(); // Refresh all data
        setError('');
      } else {
        let errorMsg = `PDF Processing failed: ${data.error}`;
        if (data.likelyCause) {
          errorMsg += `\n\nLikely cause: ${data.likelyCause}`;
        }
        if (data.suggestions && data.suggestions.length > 0) {
          errorMsg += `\n\nSuggestions:\n${data.suggestions.map(s => `• ${s}`).join('\n')}`;
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError(`PDF Processing failed: ${err.message}`);
    }
  };

  const handleLoadSampleStandards = async () => {
    try {
      const sampleStandards = [
        {
          title: "Patient Safety Standard",
          source: "AAAHC",
          section: "1.A",
          contentText: "The organization must maintain a comprehensive patient safety program that includes incident reporting, analysis, and corrective actions. All staff must be trained in patient safety protocols and participate in continuous improvement activities."
        },
        {
          title: "Quality Management Standard",
          source: "AAAHC",
          section: "1.B",
          contentText: "The organization shall implement a quality management system that monitors clinical outcomes, patient satisfaction, and adherence to evidence-based practices. Regular quality assessments must be conducted and documented."
        },
        {
          title: "Clinical Records Management",
          source: "AAAHC",
          section: "2.A",
          contentText: "Patient clinical records must be maintained in a secure, organized manner with appropriate access controls. Records must be complete, accurate, legible, and include all relevant clinical information and treatment plans."
        },
        {
          title: "Infection Prevention and Control",
          source: "AAAHC",
          section: "3.A",
          contentText: "The organization must establish and maintain an infection prevention and control program that includes policies for hand hygiene, equipment sterilization, environmental cleaning, and outbreak management."
        },
        {
          title: "Staff Credentialing and Privileging",
          source: "AAAHC",
          section: "4.A",
          contentText: "All clinical staff must be properly credentialed and privileged according to their scope of practice. The organization must verify education, training, licensure, and competency on an ongoing basis."
        }
      ];

      for (const std of sampleStandards) {
        await fetch('http://localhost:5000/api/standards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(std)
        });
      }

      await fetchAll();
      setError('');
    } catch (err) {
      setError(`Failed to load sample standards: ${err.message}`);
    }
  };

  // Reset mappings only (policies & standards preserved by backend)
  const handleReset = async () => {
    if (!confirm('Reset will clear all existing mappings only (policies and standards are preserved). Continue?')) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      await fetchAll();
      setAutoMapResults([]);
      setSelectedPolicyId('');
      setError('✅ Mappings cleared. Policies and standards preserved.');
    } catch (e) {
      setError('Reset failed: ' + e.message);
    }
  };

  // Manual linking (local only – not persisted)
  const handleLink = () => {
    if (selectedPolicyLocal !== '' && selectedStandardLocal !== '') {
      if (!manualLinks.some(l => l.policyIdx === selectedPolicyLocal && l.standardIdx === selectedStandardLocal)) {
        setManualLinks(prev => [...prev, { policyIdx: selectedPolicyLocal, standardIdx: selectedStandardLocal }]);
      }
    }
  };
  const handleRemoveLink = (policyIdx, standardIdx) => {
    setManualLinks(prev => prev.filter(l => !(l.policyIdx === policyIdx && l.standardIdx === standardIdx)));
  };

  // Run auto-map for selected policy
  const runAutoMap = async () => {
    if (!selectedPolicyId) return;
    setAutoMapLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auto-map`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policyId: selectedPolicyId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Auto-map failed');
      setAutoMapResults(data.matches || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setAutoMapLoading(false);
    }
  };

  const acceptMapping = async (standardId, score) => {
    try {
      const res = await fetch(`${API_BASE}/mappings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policyId: selectedPolicyId, standardId, mappedBy: 'AI', confidenceScore: score }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mapping failed');
      setMappings(prev => [...prev, data]);
    } catch (e) {
      setError(e.message);
    }
  };

  const runBatchAutoMap = async () => {
    if (selectedPolicyIds.length === 0) {
      setError('Please select at least one policy to map.');
      return;
    }

    if (selectedEngine === 'gemini' && !apiKey) {
      setError('Gemini API Key is required for intelligent mapping.');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auto-map/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyIds: selectedPolicyIds,
          engine: selectedEngine,
          apiKey: apiKey
        })
      });
      const data = await res.json();

      // Refresh mappings
      const [mRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/mappings`),
        fetch(`${API_BASE}/sub-mappings`)
      ]);
      const [mData, subData] = await Promise.all([mRes.json(), subRes.json()]);

      setMappings(mData);
      setSubMappings(subData);
      await fetchCoverage();

      setAutoMapResults(data.details || []);
      setError(`✅ Auto-mapped ${data.policiesProcessed} policies using ${data.engine}. Created ${data.totalCreated} main mappings and ${data.totalSubMappingsCreated} sub-mappings.`);
    } catch (e) {
      setError('Auto-map failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const addStandard = async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const title = form.title.value.trim();
    const section = form.section.value.trim();
    const source = form.source.value.trim() || 'MANUAL';
    const contentText = form.contentText.value.trim();
    if (!title || !contentText) { setError('Title and Content are required for a standard'); return; }
    try {
      const res = await fetch(`${API_BASE}/standards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, section, source, contentText }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add standard');
      await fetchAll();
      form.reset();
      setError('✅ Standard added.');
    } catch (e) {
      setError(e.message);
    }
  };

  const resolvedMappingsForPolicy = (pid) => mappings.filter(m => m.policyId === pid);
  const standardTitle = (sid) => standards.find(s => s.id === sid)?.title || sid;
  const policyTitle = (pid) => policies.find(p => p.id === pid)?.title || pid;

  return (
    <div className="main-container">
      <div className="header">
        <img src="https://via.placeholder.com/50" alt="Logo" style={{ height: 50, marginRight: 15, borderRadius: 8, boxShadow: '0 2px 8px #05358D22' }} />
        <div>
          <h1>Policies and Procedures</h1>
          <span className="center-name">(Test) Raj Corp Surg Center</span>
        </div>
      </div>

      <div className="tab-container">
        <div className="tab-buttons">
          <button
            className={`tab-button${activeTab === 'documents' ? ' active' : ''}`}
            onClick={() => setActiveTab('documents')}
            data-tab="documents"
          >
            Documents
          </button>
          <button
            className={`tab-button${activeTab === 'coverage' ? ' active' : ''}`}
            onClick={() => setActiveTab('coverage')}
            data-tab="coverage"
          >
            Detailed Coverage
          </button>
          <button
            className={`tab-button${activeTab === 'administration' ? ' active' : ''}`}
            onClick={() => setActiveTab('administration')}
            data-tab="administration"
          >
            Administration
          </button>
        </div>

        <div id="documents" className={`tab-content${activeTab === 'documents' ? ' active' : ''}`}>
          <h2 style={{ color: '#05358D', marginBottom: 24 }}>Policy-Standard Mapping Interface</h2>
          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
              marginBottom: '1rem',
              whiteSpace: 'pre-line'
            }}>
              {error}
            </div>
          )}

          {/* Data Overview Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
              <span>Policies: <strong>{policies.length}</strong></span>
              <span>Standards: <strong>{standards.length}</strong></span>
              <span>Mappings: <strong>{mappings.length}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchAll} style={{ background: '#05358D', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Refresh</button>
              <button onClick={handleReset} style={{ background: '#d32f2f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Reset</button>
            </div>
          </div>

          {/* Main Mapping Interface */}
          <div style={{ display: 'flex', gap: 20, height: '70vh', border: '1px solid #e0e7ef', borderRadius: 8, overflow: 'hidden' }}>

            {/* Left Side - Policies */}
            <div style={{ flex: '0 0 45%', borderRight: '1px solid #e0e7ef', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e0e7ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#05358D' }}>Policies ({policies.length})</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#666' }}>Selected: {selectedPolicyIds.length}</span>
                  <button
                    onClick={() => setSelectedPolicyIds(selectedPolicyIds.length === policies.length ? [] : policies.map(p => p.id))}
                    style={{ background: '#1e88e5', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                  >
                    {selectedPolicyIds.length === policies.length ? 'Clear All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {policies.map(policy => (
                  <div
                    key={policy.id}
                    onClick={() => {
                      const isSelected = selectedPolicyIds.includes(policy.id);
                      if (isSelected) {
                        setSelectedPolicyIds(prev => prev.filter(id => id !== policy.id));
                      } else {
                        setSelectedPolicyIds(prev => [...prev, policy.id]);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      margin: '2px 0',
                      backgroundColor: selectedPolicyIds.includes(policy.id) ? '#e3f2fd' : '#fff',
                      border: selectedPolicyIds.includes(policy.id) ? '2px solid #1976d2' : '1px solid #e0e7ef',
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 13
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{policy.title}</div>
                    {policy.filename && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{policy.filename}</div>
                    )}
                    {/* Show mapped standards count */}
                    {(() => {
                      const policyMappings = mappings.filter(m => m.policyId === policy.id);
                      return policyMappings.length > 0 && (
                        <div style={{ fontSize: 10, color: '#2e7d32', marginTop: 2, fontWeight: 600 }}>
                          ✓ Mapped to {policyMappings.length} standards
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Standards & Actions */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e0e7ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#05358D' }}>Standards & Mappings</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ background: '#fff', border: '1px solid #ccc', color: '#333', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  >
                    {showSettings ? 'Hide Settings' : 'AI Settings'}
                  </button>
                  <button
                    onClick={runBatchAutoMap}
                    disabled={loading || selectedPolicyIds.length === 0}
                    style={{ background: loading ? '#ccc' : '#2e7d32', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    {loading ? 'Mapping...' : 'Auto-Map Selected'}
                  </button>
                </div>
              </div>

              {/* AI Settings Panel */}
              {showSettings && (
                <div style={{ padding: '12px 16px', backgroundColor: '#eef2f6', borderBottom: '1px solid #e0e7ef' }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>Mapping Engine</label>
                    <select
                      value={selectedEngine}
                      onChange={(e) => setSelectedEngine(e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}
                    >
                      <option value="tfidf">Basic (TF-IDF) - Fast, Keyword based</option>
                      <option value="openai">Intelligent (OpenAI GPT-4o) - Reasoning based</option>
                      <option value="groq">Fast & Intelligent (Groq Llama 3) - Free & Fast</option>
                    </select>
                  </div>
                  {(selectedEngine === 'openai' || selectedEngine === 'groq') && (
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                        {selectedEngine === 'openai' ? 'OpenAI API Key' : 'Groq API Key'}
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={`Enter your ${selectedEngine === 'openai' ? 'OpenAI' : 'Groq'} API Key`}
                        style={{ width: '100%', padding: '6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}
                      />
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                        Key is used for this session only and not stored permanently.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {standards.map(standard => {
                  // Resolve mappings for this standard among selected policies
                  const standardMappings = mappings.filter(m => m.standardId === standard.id && selectedPolicyIds.includes(m.policyId));

                  return (
                    <div
                      key={standard.id}
                      style={{
                        padding: '12px',
                        margin: '4px 0',
                        backgroundColor: standardMappings.length > 0 ? '#f1f8e9' : '#fff',
                        border: standardMappings.length > 0 ? '2px solid #4caf50' : '1px solid #e0e7ef',
                        borderRadius: 6,
                        fontSize: 13
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: 14 }}>{standard.title}</div>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                            {standard.category} • {standard.section} • v{standard.version}
                          </div>
                        </div>
                        {/* Percentage displays removed as requested */}
                      </div>

                      {/* Show mapped policies for this standard */}
                      {standardMappings.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                          {standardMappings.map(mapping => {
                            const policy = policies.find(p => p.id === mapping.policyId);
                            return (
                              <div key={mapping.id} title={mapping.reasoning || 'No reasoning available'} style={{
                                padding: '2px 6px',
                                backgroundColor: '#e8f5e8',
                                border: '1px solid #c3e6c3',
                                borderRadius: 8,
                                fontSize: 10,
                                color: '#1a1a1a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: mapping.reasoning ? 'help' : 'default'
                              }}>
                                <span>{policy?.title}</span>
                                {mapping.reasoning && <span style={{ fontSize: 9 }}>💡</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Show mapped sub-standards */}
                      {subMappings.filter(m => m.standardId === standard.id && selectedPolicyIds.includes(m.policyId)).length > 0 && (
                        <div style={{ marginTop: 8, padding: '8px', backgroundColor: '#fff', borderRadius: 4, border: '1px solid #eee' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4 }}>Sub-Standard Matches:</div>
                          {subMappings.filter(m => m.standardId === standard.id && selectedPolicyIds.includes(m.policyId)).map(sm => {
                            const sub = standard.subStandards?.find(s => s.id === sm.subStandardId);
                            const policy = policies.find(p => p.id === sm.policyId);
                            return (
                              <div key={sm.id} style={{ fontSize: 11, color: '#333', marginBottom: 2, display: 'flex', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{sm.subStandardId}</span>
                                <span>{sub?.title || 'Unknown Sub-Standard'}</span>
                                <span style={{ color: '#666' }}>({policy?.title})</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Content preview */}
                      <div style={{ fontSize: 11, color: '#555', marginTop: 8, lineHeight: 1.4 }}>
                        {standard.contentText.substring(0, 150)}...
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Standard Form */}
          <div style={{ margin: '20px 0', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 12px', color: '#05358D' }}>Add New Standard</h4>
            <form onSubmit={addStandard} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input name="title" placeholder="Title" style={{ padding: 8, flex: '1 1 220px', border: '1px solid #ccd7e5', borderRadius: 4 }} />
                <input name="section" placeholder="Section" style={{ padding: 8, width: 120, border: '1px solid #ccd7e5', borderRadius: 4 }} />
                <input name="source" placeholder="Source" style={{ padding: 8, width: 160, border: '1px solid #ccd7e5', borderRadius: 4 }} />
              </div>
              <textarea name="contentText" placeholder="Standard Content" rows={3} style={{ padding: 8, width: '100%', border: '1px solid #ccd7e5', borderRadius: 4, resize: 'vertical' }} />
              <div>
                <button type="submit" style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Add Standard</button>
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
            <div className="upload-card" style={{ flex: '1 1 420px' }}>
              <h3>Manual Linking (Local Only)</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <select value={selectedPolicyLocal} onChange={e => setSelectedPolicyLocal(e.target.value)} style={{ minWidth: 160, padding: 6 }}>
                  <option value="">Policy</option>
                  {policies.map((p, idx) => <option key={p.id} value={idx}>{p.title}</option>)}
                </select>
                <span style={{ alignSelf: 'center' }}>→</span>
                <select value={selectedStandardLocal} onChange={e => setSelectedStandardLocal(e.target.value)} style={{ minWidth: 160, padding: 6 }}>
                  <option value="">Standard</option>
                  {standards.map((s, idx) => <option key={s.id} value={idx}>{s.title}</option>)}
                </select>
                <button onClick={handleLink} style={{ background: '#05358D', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Link</button>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#eaf0fb' }}>
                      <th style={{ padding: 6, border: '1px solid #e0e7ef' }}>Policy</th>
                      <th style={{ padding: 6, border: '1px solid #e0e7ef' }}>Standard</th>
                      <th style={{ padding: 6, border: '1px solid #e0e7ef' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualLinks.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 12, color: '#777' }}>No manual links yet.</td></tr>}
                    {manualLinks.map((l, i) => (
                      <tr key={i}>
                        <td style={{ padding: 6, border: '1px solid #e0e7ef' }}>{policies[l.policyIdx]?.title}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ef' }}>{standards[l.standardIdx]?.title}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ef' }}>
                          <button onClick={() => handleRemoveLink(l.policyIdx, l.standardIdx)} style={{ background: '#fff', color: '#d32f2f', border: '1px solid #d32f2f', padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <small style={{ display: 'block', marginTop: 8, color: '#666' }}>Manual links here are not persisted. Use AI Accepted mappings for stored associations.</small>
            </div>
          </div>
        </div>

        <div id="coverage" className={`tab-content${activeTab === 'coverage' ? ' active' : ''}`}>
          <h2 style={{ color: '#05358D', marginBottom: 24 }}>Detailed Standards Coverage</h2>
          {coverageData ? (
            <div>
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                  <span>Total Standards: <strong>{coverageData.totalStandards}</strong></span>
                  <span>Total Policies: <strong>{coverageData.totalPolicies}</strong></span>
                </div>
              </div>

              {coverageData.coverage.map(std => {
                const isExpanded = expandedStandards[std.standardId];
                const subsCovered = std.subStandardsCovered || 0;
                const subsTotal = std.subStandardsTotal || 0;
                const subCoveragePercent = subsTotal > 0 ? ((subsCovered / subsTotal) * 100).toFixed(0) : 0;

                return (
                  <div key={std.standardId} style={{
                    border: '1px solid #e0e7ef',
                    borderRadius: 8,
                    marginBottom: 16,
                    overflow: 'hidden'
                  }}>
                    {/* Standard Header */}
                    <div
                      onClick={() => setExpandedStandards(prev => ({ ...prev, [std.standardId]: !prev[std.standardId] }))}
                      style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', marginBottom: 4 }}>
                          {std.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {std.category} • {std.section} • v{std.version}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#666' }}>Mapped Policies</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1976d2' }}>{std.totalMappedPolicies}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#666' }}>Sub-Standards Coverage</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: subCoveragePercent >= 60 ? '#2e7d32' : subCoveragePercent >= 30 ? '#f57c00' : '#d32f2f' }}>
                            {subCoveragePercent}%
                          </div>
                          <div style={{ fontSize: 11, color: '#999' }}>{subsCovered} of {subsTotal}</div>
                        </div>
                        <div style={{ fontSize: 20, color: '#666' }}>
                          {isExpanded ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>

                    {/* Sub-Standards Detail */}
                    {isExpanded && std.subStandards && std.subStandards.length > 0 && (
                      <div style={{ padding: '16px', backgroundColor: '#fff' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#eaf0fb', borderBottom: '2px solid #ccd7e5' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Sub-Standard ID</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Title</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Mapped Policies</th>
                              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Coverage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {std.subStandards.map(sub => {
                              const covPercent = parseFloat(sub.coveragePercent || 0);
                              return (
                                <tr key={sub.subStandardId} style={{ borderBottom: '1px solid #e0e7ef' }}>
                                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{sub.subStandardId}</td>
                                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{sub.title}</td>
                                  <td style={{ padding: '8px 12px', color: '#666' }}>{sub.description}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{sub.mappedPolicies}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: 4,
                                      backgroundColor: covPercent >= 10 ? '#e8f5e9' : '#fff3e0',
                                      color: covPercent >= 10 ? '#2e7d32' : '#f57c00',
                                      fontWeight: 600,
                                      fontSize: 12
                                    }}>
                                      {sub.coveragePercent}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Loading coverage data...</p>
          )}
        </div>

        <div id="administration" className={`tab-content${activeTab === 'administration' ? ' active' : ''}`}>
          <h2 style={{ color: '#05358D' }}>Administration</h2>
          <p className="placeholder-text">Placeholder for the Administration content.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
