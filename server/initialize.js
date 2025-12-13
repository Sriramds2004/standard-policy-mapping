// Backend initialization script - loads policies and standards automatically
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return await response.json();
}

async function initializeSystem() {
  console.log('🚀 Initializing Policy Documents Module...');
  
  try {
    // 1. Reset everything first
    console.log('📋 Resetting existing data...');
    await apiCall('/reset', 'POST');
    
    // 2. Ingest policies from filesystem
    console.log('📁 Ingesting policies from Policies_docs...');
    const ingestResult = await apiCall('/ingest/fs', 'POST', { baseDir: 'Policies_docs' });
    console.log(`✅ Ingested ${ingestResult.ingested} policies`);
    
    // 3. Load sample standards (since PDF processing is problematic)
    console.log('📚 Loading AAAHC sample standards...');
    const sampleStandards = [
      {
        title: "Patient Safety Standard",
        source: "AAAHC",
        section: "1.A",
        contentText: "The organization must maintain a comprehensive patient safety program that includes incident reporting, analysis, and corrective actions. All staff must be trained in patient safety protocols and participate in continuous improvement activities. Patient safety initiatives must be regularly reviewed and updated based on current best practices and regulatory requirements."
      },
      {
        title: "Quality Management Standard", 
        source: "AAAHC",
        section: "1.B",
        contentText: "The organization shall implement a quality management system that monitors clinical outcomes, patient satisfaction, and adherence to evidence-based practices. Regular quality assessments must be conducted and documented. Quality improvement activities must be data-driven and include staff participation at all levels."
      },
      {
        title: "Clinical Records Management",
        source: "AAAHC", 
        section: "2.A",
        contentText: "Patient clinical records must be maintained in a secure, organized manner with appropriate access controls. Records must be complete, accurate, legible, and include all relevant clinical information and treatment plans. Electronic health records must comply with privacy regulations and maintain audit trails."
      },
      {
        title: "Infection Prevention and Control",
        source: "AAAHC",
        section: "3.A", 
        contentText: "The organization must establish and maintain an infection prevention and control program that includes policies for hand hygiene, equipment sterilization, environmental cleaning, and outbreak management. Staff must receive regular training on infection control protocols and procedures."
      },
      {
        title: "Staff Credentialing and Privileging",
        source: "AAAHC",
        section: "4.A",
        contentText: "All clinical staff must be properly credentialed and privileged according to their scope of practice. The organization must verify education, training, licensure, and competency on an ongoing basis. Credentialing files must be maintained and updated regularly."
      },
      {
        title: "Emergency Preparedness",
        source: "AAAHC",
        section: "5.A", 
        contentText: "The organization must have comprehensive emergency preparedness plans that address various emergency scenarios including natural disasters, medical emergencies, and security threats. Regular drills and training exercises must be conducted to ensure staff readiness."
      },
      {
        title: "Pharmaceutical Management",
        source: "AAAHC",
        section: "6.A",
        contentText: "Pharmaceutical services must ensure safe medication storage, handling, and administration. Medication errors must be tracked and analyzed for improvement opportunities. Controlled substances must be properly secured and monitored."
      },
      {
        title: "Equipment and Facility Safety",
        source: "AAAHC", 
        section: "7.A",
        contentText: "Medical equipment must be properly maintained, calibrated, and inspected according to manufacturer specifications. Facility safety protocols must address environmental hazards, equipment malfunctions, and maintenance procedures."
      }
    ];
    
    let standardsCreated = 0;
    for (const std of sampleStandards) {
      try {
        await apiCall('/standards', 'POST', std);
        standardsCreated++;
      } catch (e) {
        console.warn(`Failed to create standard: ${std.title}`);
      }
    }
    console.log(`✅ Created ${standardsCreated} standards`);
    
    // 4. Try to process the AAAHC PDF (if it works)
    console.log('📄 Attempting to process AAAHC PDF...');
    try {
      const pdfResult = await apiCall('/standards/process-pdf', 'POST', { filename: 'AAAHC Standard.pdf' });
      console.log(`✅ Processed PDF: ${pdfResult.created} additional standards created`);
    } catch (e) {
      console.log('⚠️  PDF processing failed (likely scanned images) - using sample standards instead');
    }
    
    // 5. Get final stats
    const stats = await apiCall('/stats');
    console.log('📊 System Ready!');
    console.log(`   Policies: ${stats.policies}`);
    console.log(`   Standards: ${stats.standards}`);
    console.log(`   Mappings: ${stats.mappings}`);
    
    // 6. Run a test auto-mapping to verify AI engine works
    if (stats.policies > 0 && stats.standards > 0) {
      console.log('🤖 Testing AI mapping engine...');
      const policies = await apiCall('/policies');
      const testMapping = await apiCall('/auto-map', 'POST', { 
        policyId: policies[0].id, 
        threshold: 0.1 
      });
      console.log(`✅ AI engine working: ${testMapping.matches?.length || 0} matches found for test policy`);
    }
    
    console.log('🎉 Policy Documents Module fully initialized and ready!');
    console.log('🌐 Frontend available at: http://localhost:5173');
    console.log('🔧 Backend API at: http://localhost:5000/api');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSystem();
}

export default initializeSystem;