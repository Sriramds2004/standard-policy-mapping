// Complete AAAHC Standards with Sub-Standards Structure
export const aaahcStandardsData = [
  {
    title: "Administration (ADM)",
    source: "AAAHC",
    category: "ADM",
    version: "2024",
    section: "ADM.1",
    contentText: "The organization has a governing body that is responsible for the quality of care provided and for compliance with applicable laws and regulations. The governing body ensures adequate resources, policies, and procedures to support safe, quality patient care. Administrative leadership must be clearly defined with appropriate delegation of authority and responsibility.",
    subStandards: [
      { id: "ADM.1.A", title: "Governing Body Structure", description: "Organization has a defined governing body with documented authority and accountability" },
      { id: "ADM.1.B", title: "Leadership Responsibilities", description: "Administrative leadership roles are clearly defined with appropriate delegation" },
      { id: "ADM.1.C", title: "Resource Allocation", description: "Adequate resources are allocated to support quality patient care" },
      { id: "ADM.1.D", title: "Policy Framework", description: "Comprehensive policies and procedures are established and maintained" },
      { id: "ADM.1.E", title: "Regulatory Compliance", description: "Organization complies with all applicable laws and regulations" }
    ]
  },
  {
    title: "Anesthesia and Surgery (ASG)",
    source: "AAAHC",
    category: "ASG", 
    version: "2024",
    section: "ASG.1",
    contentText: "Anesthesia services are provided by qualified practitioners in accordance with professional standards. Pre-operative assessment, intra-operative monitoring, and post-operative care protocols must be established. Surgical procedures require appropriate credentialing, equipment, and emergency preparedness protocols.",
    subStandards: [
      { id: "ASG.1.A", title: "Practitioner Qualifications", description: "Anesthesia providers are appropriately credentialed and qualified" },
      { id: "ASG.1.B", title: "Pre-operative Assessment", description: "Comprehensive pre-operative patient assessment protocols are established" },
      { id: "ASG.1.C", title: "Intra-operative Monitoring", description: "Continuous patient monitoring during procedures per professional standards" },
      { id: "ASG.1.D", title: "Post-operative Care", description: "Post-anesthesia care protocols ensure safe patient recovery" },
      { id: "ASG.1.E", title: "Emergency Preparedness", description: "Emergency equipment and protocols are in place for surgical procedures" }
    ]
  },
  {
    title: "Care Management and Coordination (CMC)",
    source: "AAAHC",
    category: "CMC",
    version: "2024", 
    section: "CMC.1",
    contentText: "Patient care is coordinated across all services and providers within the organization. Care plans are developed, implemented, and monitored to ensure continuity of care. Communication and coordination mechanisms are established between all care team members and external providers when appropriate.",
    subStandards: [
      { id: "CMC.1.A", title: "Care Coordination", description: "Patient care is coordinated across all services and providers" },
      { id: "CMC.1.B", title: "Care Planning", description: "Individual care plans are developed and implemented for patients" },
      { id: "CMC.1.C", title: "Continuity of Care", description: "Processes ensure continuity of care across all settings" },
      { id: "CMC.1.D", title: "Team Communication", description: "Effective communication mechanisms between all care team members" },
      { id: "CMC.1.E", title: "External Coordination", description: "Coordination with external providers and referrals when appropriate" }
    ]
  },
  {
    title: "Credentialing and Privileging (CPV)",
    source: "AAAHC",
    category: "CPV",
    version: "2024",
    section: "CPV.1", 
    contentText: "All practitioners providing patient care services are appropriately credentialed and privileged. The organization verifies education, training, licensure, experience, and competency. Ongoing monitoring and reappointment processes ensure continued competency and compliance with organizational standards.",
    subStandards: [
      { id: "CPV.1.A", title: "Initial Credentialing", description: "Comprehensive initial credentialing process for all practitioners" },
      { id: "CPV.1.B", title: "Verification Process", description: "Education, training, licensure, and experience are verified" },
      { id: "CPV.1.C", title: "Competency Assessment", description: "Practitioner competency is assessed and documented" },
      { id: "CPV.1.D", title: "Ongoing Monitoring", description: "Continuous monitoring of practitioner performance and compliance" },
      { id: "CPV.1.E", title: "Reappointment Process", description: "Periodic reappointment ensures continued competency" }
    ]
  },
  {
    title: "Clinical Records (CRD)",
    source: "AAAHC",
    category: "CRD",
    version: "2024",
    section: "CRD.1",
    contentText: "Patient clinical records are maintained in accordance with professional standards and regulatory requirements. Records must be complete, accurate, legible, and readily accessible. Documentation includes assessment, diagnosis, treatment plans, and outcomes. Privacy and security of patient information is maintained at all times.",
    subStandards: [
      { id: "CRD.1.A", title: "Record Maintenance", description: "Clinical records are maintained per professional and regulatory standards" },
      { id: "CRD.1.B", title: "Documentation Quality", description: "Records are complete, accurate, and legible" },
      { id: "CRD.1.C", title: "Record Accessibility", description: "Records are readily accessible to authorized personnel" },
      { id: "CRD.1.D", title: "Content Requirements", description: "Records include all required clinical information and treatment plans" },
      { id: "CRD.1.E", title: "Privacy and Security", description: "Patient information privacy and security are maintained" }
    ]
  },
  {
    title: "Emergency Management (EMG)",
    source: "AAAHC",
    category: "EMG", 
    version: "2024",
    section: "EMG.1",
    contentText: "The organization has comprehensive emergency management plans and procedures for medical emergencies, natural disasters, and other emergency situations. Staff are trained in emergency procedures and equipment is readily available. Coordination with local emergency services and transfer agreements are established.",
    subStandards: [
      { id: "EMG.1.A", title: "Emergency Plans", description: "Comprehensive emergency management plans are documented" },
      { id: "EMG.1.B", title: "Medical Emergency Response", description: "Procedures for responding to medical emergencies are established" },
      { id: "EMG.1.C", title: "Disaster Preparedness", description: "Plans for natural disasters and other emergencies are in place" },
      { id: "EMG.1.D", title: "Staff Training", description: "All staff are trained in emergency procedures" },
      { id: "EMG.1.E", title: "External Coordination", description: "Coordination with local emergency services and transfer agreements exist" }
    ]
  },
  {
    title: "Facilities and Equipment (FAC)",
    source: "AAAHC",
    category: "FAC",
    version: "2024",
    section: "FAC.1", 
    contentText: "Facilities are designed, constructed, and maintained to support safe patient care. Equipment is properly selected, installed, tested, and maintained according to manufacturer specifications and professional standards. Environmental safety and infection control requirements are met throughout all areas.",
    subStandards: [
      { id: "FAC.1.A", title: "Facility Design", description: "Facilities are designed and constructed to support safe patient care" },
      { id: "FAC.1.B", title: "Facility Maintenance", description: "Ongoing maintenance ensures safe and functional facilities" },
      { id: "FAC.1.C", title: "Equipment Management", description: "Equipment is properly selected, installed, tested, and maintained" },
      { id: "FAC.1.D", title: "Environmental Safety", description: "Environmental safety requirements are met throughout all areas" },
      { id: "FAC.1.E", title: "Infection Control Environment", description: "Facility supports infection prevention and control requirements" }
    ]
  },
  {
    title: "Governance (GOV)",
    source: "AAAHC",
    category: "GOV",
    version: "2024",
    section: "GOV.1",
    contentText: "The organization has an effective governance structure that provides oversight and accountability for all operations. Leadership responsibilities are clearly defined with appropriate authority and accountability. Performance improvement activities are systematically implemented and monitored.",
    subStandards: [
      { id: "GOV.1.A", title: "Governance Structure", description: "Effective governance structure with oversight and accountability" },
      { id: "GOV.1.B", title: "Leadership Definition", description: "Leadership responsibilities and authority are clearly defined" },
      { id: "GOV.1.C", title: "Accountability Systems", description: "Systems ensure accountability at all organizational levels" },
      { id: "GOV.1.D", title: "Performance Improvement", description: "Performance improvement activities are systematically implemented" },
      { id: "GOV.1.E", title: "Monitoring and Oversight", description: "Ongoing monitoring of organizational performance and compliance" }
    ]
  },
  {
    title: "Infection Prevention and Control (IPC)",
    source: "AAAHC", 
    category: "IPC",
    version: "2024",
    section: "IPC.1",
    contentText: "Comprehensive infection prevention and control programs are implemented to minimize the risk of healthcare-associated infections. Policies and procedures address hand hygiene, equipment sterilization, environmental cleaning, isolation precautions, and outbreak management. Staff education and competency validation are ongoing.",
    subStandards: [
      { id: "IPC.1.A", title: "IPC Program", description: "Comprehensive infection prevention and control program is implemented" },
      { id: "IPC.1.B", title: "Hand Hygiene", description: "Hand hygiene policies and compliance monitoring are established" },
      { id: "IPC.1.C", title: "Sterilization Procedures", description: "Equipment sterilization and disinfection procedures are documented" },
      { id: "IPC.1.D", title: "Environmental Cleaning", description: "Environmental cleaning protocols are established and followed" },
      { id: "IPC.1.E", title: "Isolation and Outbreak Management", description: "Isolation precautions and outbreak management procedures are in place" },
      { id: "IPC.1.F", title: "Staff Education", description: "Ongoing staff education and competency validation for IPC" }
    ]
  },
  {
    title: "Laboratory and Radiology (LRD)",
    source: "AAAHC",
    category: "LRD", 
    version: "2024",
    section: "LRD.1",
    contentText: "Laboratory and radiology services are provided by qualified personnel using appropriate equipment and procedures. Quality control and quality assurance programs ensure accurate and timely results. Safety protocols protect patients and staff from radiation and chemical hazards.",
    subStandards: [
      { id: "LRD.1.A", title: "Personnel Qualifications", description: "Lab and radiology services are provided by qualified personnel" },
      { id: "LRD.1.B", title: "Equipment and Procedures", description: "Appropriate equipment and procedures are used for all services" },
      { id: "LRD.1.C", title: "Quality Control", description: "Quality control programs ensure accurate results" },
      { id: "LRD.1.D", title: "Quality Assurance", description: "Quality assurance programs ensure timely and reliable services" },
      { id: "LRD.1.E", title: "Safety Protocols", description: "Safety protocols protect against radiation and chemical hazards" }
    ]
  },
  {
    title: "Medication Management (MED)",
    source: "AAAHC",
    category: "MED",
    version: "2024",
    section: "MED.1", 
    contentText: "Medication management systems ensure safe prescribing, dispensing, administration, and monitoring of medications. Policies address medication reconciliation, adverse event reporting, controlled substance management, and staff competency. Pharmacy services meet professional and regulatory standards.",
    subStandards: [
      { id: "MED.1.A", title: "Prescribing Safety", description: "Safe prescribing practices and protocols are established" },
      { id: "MED.1.B", title: "Dispensing Procedures", description: "Medication dispensing follows professional and regulatory standards" },
      { id: "MED.1.C", title: "Administration Protocols", description: "Safe medication administration procedures are implemented" },
      { id: "MED.1.D", title: "Medication Reconciliation", description: "Medication reconciliation occurs at all transitions of care" },
      { id: "MED.1.E", title: "Adverse Event Management", description: "Adverse drug events are reported and managed appropriately" },
      { id: "MED.1.F", title: "Controlled Substances", description: "Controlled substance management meets regulatory requirements" }
    ]
  },
  {
    title: "Other Clinical Services (OCS)",
    source: "AAAHC",
    category: "OCS",
    version: "2024", 
    section: "OCS.1",
    contentText: "All clinical services not covered by other standards are provided according to professional standards and regulatory requirements. Services include but are not limited to diagnostic procedures, therapeutic interventions, and specialized care services. Quality assurance and safety protocols are implemented for all services.",
    subStandards: [
      { id: "OCS.1.A", title: "Service Standards", description: "Clinical services meet professional and regulatory standards" },
      { id: "OCS.1.B", title: "Diagnostic Procedures", description: "Diagnostic procedures are performed according to established protocols" },
      { id: "OCS.1.C", title: "Therapeutic Interventions", description: "Therapeutic interventions follow evidence-based practices" },
      { id: "OCS.1.D", title: "Quality Assurance", description: "Quality assurance protocols are implemented for all services" },
      { id: "OCS.1.E", title: "Safety Protocols", description: "Safety protocols are established for all clinical services" }
    ]
  },
  {
    title: "Quality (QUA)",
    source: "AAAHC",
    category: "QUA",
    version: "2024",
    section: "QUA.1",
    contentText: "A comprehensive quality management program monitors and improves patient care and safety. Quality indicators are established, data is collected and analyzed, and improvement activities are implemented. Patient feedback and outcomes are systematically evaluated and used for continuous improvement.",
    subStandards: [
      { id: "QUA.1.A", title: "Quality Program", description: "Comprehensive quality management program is established" },
      { id: "QUA.1.B", title: "Quality Indicators", description: "Quality indicators are defined and monitored" },
      { id: "QUA.1.C", title: "Data Collection and Analysis", description: "Quality data is systematically collected and analyzed" },
      { id: "QUA.1.D", title: "Improvement Activities", description: "Quality improvement activities are implemented based on data" },
      { id: "QUA.1.E", title: "Patient Feedback", description: "Patient feedback and outcomes are evaluated for improvement" }
    ]
  },
  {
    title: "Patient Rights, Responsibilities and Protections (PRR)",
    source: "AAAHC", 
    category: "PRR",
    version: "2024",
    section: "PRR.1",
    contentText: "Patient rights and responsibilities are clearly defined and communicated. Patients receive information about their care, treatment options, and expected outcomes. Informed consent processes are implemented and patient privacy and confidentiality are protected. Mechanisms for addressing patient concerns and complaints are established.",
    subStandards: [
      { id: "PRR.1.A", title: "Rights Definition", description: "Patient rights and responsibilities are clearly defined" },
      { id: "PRR.1.B", title: "Patient Communication", description: "Patients receive information about care and treatment options" },
      { id: "PRR.1.C", title: "Informed Consent", description: "Informed consent processes are implemented for all procedures" },
      { id: "PRR.1.D", title: "Privacy and Confidentiality", description: "Patient privacy and confidentiality are protected" },
      { id: "PRR.1.E", title: "Complaint Resolution", description: "Mechanisms address patient concerns and complaints" }
    ]
  },
  {
    title: "Safety (SAF)",
    source: "AAAHC",
    category: "SAF", 
    version: "2024",
    section: "SAF.1",
    contentText: "Comprehensive patient safety programs identify, analyze, and reduce risks to patients and staff. Safety policies and procedures address hazard identification, incident reporting, root cause analysis, and corrective actions. Safety education and training are provided to all staff members.",
    subStandards: [
      { id: "SAF.1.A", title: "Safety Program", description: "Comprehensive patient safety program is established" },
      { id: "SAF.1.B", title: "Hazard Identification", description: "Systems identify and assess safety hazards" },
      { id: "SAF.1.C", title: "Incident Reporting", description: "Incident reporting system encourages and tracks safety events" },
      { id: "SAF.1.D", title: "Root Cause Analysis", description: "Root cause analysis is conducted for significant events" },
      { id: "SAF.1.E", title: "Corrective Actions", description: "Corrective actions are implemented to prevent recurrence" },
      { id: "SAF.1.F", title: "Safety Education", description: "Safety education and training are provided to all staff" }
    ]
  },
  {
    title: "Validation (VAL)",
    source: "AAAHC",
    category: "VAL",
    version: "2024",
    section: "VAL.1", 
    contentText: "The organization participates in external validation processes to demonstrate compliance with standards and commitment to quality improvement. Self-assessment and external review processes are used to identify opportunities for improvement and ensure ongoing compliance with accreditation standards.",
    subStandards: [
      { id: "VAL.1.A", title: "External Validation", description: "Organization participates in external validation processes" },
      { id: "VAL.1.B", title: "Self-Assessment", description: "Regular self-assessment processes are conducted" },
      { id: "VAL.1.C", title: "External Review", description: "External review processes verify compliance with standards" },
      { id: "VAL.1.D", title: "Improvement Opportunities", description: "Review processes identify improvement opportunities" },
      { id: "VAL.1.E", title: "Ongoing Compliance", description: "Processes ensure ongoing compliance with accreditation standards" }
    ]
  }
];
