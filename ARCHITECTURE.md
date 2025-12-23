# System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer (Frontend)"
        UI[React UI - Vite]
        UI_TABS[UI Components]
        UI_TABS --> DOCS[Documents Tab]
        UI_TABS --> MAP[Mapping Tab]
        UI_TABS --> LIB[Standards Library]
        UI_TABS --> COV[Coverage View]
        UI_TABS --> DATA[Data Management]
    end

    subgraph "API Layer (Backend)"
        API[Express Server :5000]
        API --> ROUTES[REST API Routes]
        ROUTES --> POL_API[Policies API]
        ROUTES --> STD_API[Standards API]
        ROUTES --> MAP_API[Mappings API]
        ROUTES --> AI_API[AI/Auto-Map API]
        ROUTES --> FILE_API[File Processing API]
    end

    subgraph "AI Engine Layer"
        ENGINE[Engine Manager]
        ENGINE --> TFIDF[TF-IDF Engine<br/>Fast, Keyword-based]
        ENGINE --> OPENAI[OpenAI GPT-4o<br/>Reasoning-based]
        ENGINE --> GROQ[Groq Llama 3<br/>Fast & Free]
        TFIDF --> VECTOR[Vectorization]
        TFIDF --> COSINE[Cosine Similarity]
    end

    subgraph "File Processing Layer"
        EXTRACT[Document Extractor]
        EXTRACT --> DOCX[DOCX Parser<br/>mammoth]
        EXTRACT --> PDF[PDF Parser<br/>pdf-parse]
        EXTRACT --> TXT[TXT/MD Parser<br/>fs]
        EXTRACT --> NORM[Text Normalization]
        EXTRACT --> DEDUPE[Deduplication<br/>Hash-based]
    end

    subgraph "Data Storage Layer (In-Memory Phase 1)"
        STORE[Data Store]
        STORE --> POL_STORE[(Policies<br/>589 docs)]
        STORE --> STD_STORE[(Standards<br/>AAAHC)]
        STORE --> MAP_STORE[(Mappings<br/>AI + Manual)]
        STORE --> SUBMAP_STORE[(Sub-Standard<br/>Mappings)]
    end

    subgraph "File System"
        FS[Local Files]
        FS --> UPLOAD[Uploads Directory]
        FS --> POLICY_DOCS[Policies_docs<br/>Directory]
    end

    UI -->|HTTP/JSON| API
    API -->|Query/Rank| ENGINE
    API -->|Extract Content| EXTRACT
    API -->|CRUD Operations| STORE
    EXTRACT -->|Read Files| FS
    API -->|Store Files| FS
    ENGINE -->|Index/Search| STORE
    
    style UI fill:#e1f5ff
    style API fill:#fff4e1
    style ENGINE fill:#f0e1ff
    style EXTRACT fill:#e1ffe1
    style STORE fill:#ffe1e1
    style FS fill:#f5f5f5
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        A[App.jsx<br/>Main Application]
        A --> B[Documents Tab<br/>Policy Upload]
        A --> C[Mapping Tab<br/>AI Suggestions]
        A --> D[Standards Library<br/>Browse Standards]
        A --> E[Coverage View<br/>Analytics]
        A --> F[Data Management<br/>Import/Export]
    end

    subgraph "Backend Modules"
        G[index.js<br/>Express Server]
        G --> H[engines.js<br/>AI Abstraction]
        G --> I[tfidf.js<br/>TF-IDF Engine]
        G --> J[openai.js<br/>OpenAI Client]
        G --> K[groq.js<br/>Groq Client]
        G --> L[extract.js<br/>File Parser]
        G --> M[aaahc-standards-data.js<br/>Sample Data]
    end

    A -->|REST API| G
    H --> I
    H --> J
    H --> K
    
    style A fill:#4a90e2
    style G fill:#f5a623
    style H fill:#bd10e0
    style I fill:#7ed321
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant API as Express API
    participant Engine as AI Engine
    participant Store as Data Store
    participant FS as File System

    Note over User,FS: Document Ingestion Flow
    User->>UI: Upload/Ingest Documents
    UI->>API: POST /api/ingest/fs
    API->>FS: Read files (DOCX/PDF/TXT)
    API->>API: Extract & Normalize Text
    API->>Store: Save Policies
    API->>Engine: Index for TF-IDF
    API->>UI: Return Success
    UI->>User: Show Policy Count

    Note over User,FS: AI Mapping Flow
    User->>UI: Select Policy + Threshold
    UI->>API: POST /api/auto-map
    API->>Store: Get Policy & Standards
    API->>Engine: Rank Similarities
    Engine->>Engine: TF-IDF/OpenAI/Groq
    Engine->>API: Return Ranked Results
    API->>UI: Return Suggestions
    UI->>User: Display Mappings
    User->>UI: Accept Mapping
    UI->>API: POST /api/mappings
    API->>Store: Save Mapping
    API->>UI: Confirm
```

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend Stack"
        FE1[React 19.1.1]
        FE2[Vite 7.1.6]
        FE3[CSS3]
        FE4[ESLint]
    end

    subgraph "Backend Stack"
        BE1[Node.js]
        BE2[Express 4.18.2]
        BE3[ES Modules]
        BE4[CORS]
    end

    subgraph "File Processing"
        FP1[mammoth<br/>DOCX extraction]
        FP2[pdf-parse<br/>PDF extraction]
        FP3[multer<br/>File upload]
        FP4[fs/path<br/>File system]
    end

    subgraph "AI/ML Stack"
        AI1[Custom TF-IDF<br/>Vectorization]
        AI2[openai 6.9.1<br/>GPT-4o API]
        AI3[groq-sdk 0.36.0<br/>Llama 3 API]
        AI4[Cosine Similarity]
    end

    subgraph "Development Tools"
        DT1[Vite Dev Server<br/>:5173]
        DT2[Express Server<br/>:5000]
        DT3[Hot Module Reload]
    end
    
    style FE1 fill:#61dafb
    style BE1 fill:#68a063
    style AI1 fill:#ff6b6b
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV1[Frontend Dev Server<br/>localhost:5173]
        DEV2[Backend API Server<br/>localhost:5000]
        DEV3[File System Storage<br/>./uploads]
        DEV4[Sample Data<br/>Policies_docs/]
    end

    subgraph "Production Ready (Phase 1)"
        PROD1[Static Frontend Build<br/>npm run build]
        PROD2[Node.js Backend<br/>npm start]
        PROD3[In-Memory Data Store]
    end

    subgraph "Future Enhancements (Phase 2)"
        FUT1[(Database<br/>PostgreSQL/SQLite)]
        FUT2[Cloud Storage<br/>S3/Azure Blob]
        FUT3[Authentication<br/>JWT/OAuth]
        FUT4[Container<br/>Docker]
        FUT5[OCR Integration<br/>Tesseract/Azure]
    end

    DEV1 -.->|Build| PROD1
    DEV2 -.->|Deploy| PROD2
    DEV3 -.->|Migrate| FUT2
    PROD3 -.->|Upgrade| FUT1
    
    style PROD1 fill:#90EE90
    style PROD2 fill:#90EE90
    style FUT1 fill:#FFE4B5
    style FUT2 fill:#FFE4B5
    style FUT3 fill:#FFE4B5
```

## System Integration Points

```mermaid
graph LR
    subgraph "External Services (Optional)"
        EXT1[OpenAI API<br/>GPT-4o]
        EXT2[Groq API<br/>Llama 3]
    end

    subgraph "Core System"
        CORE[Policy Mapping System]
    end

    subgraph "File Sources"
        SRC1[Upload UI]
        SRC2[File System<br/>Policies_docs]
        SRC3[Sample Data<br/>AAAHC]
    end

    subgraph "Output/Export"
        OUT1[JSON API]
        OUT2[UI Dashboard]
        OUT3[Statistics]
    end

    EXT1 -->|API Key| CORE
    EXT2 -->|API Key| CORE
    SRC1 -->|Files| CORE
    SRC2 -->|Batch Ingest| CORE
    SRC3 -->|Bootstrap| CORE
    CORE -->|Data| OUT1
    CORE -->|Visualize| OUT2
    CORE -->|Metrics| OUT3
    
    style CORE fill:#4169E1
    style EXT1 fill:#DDA0DD
    style EXT2 fill:#DDA0DD
```

## Key Features Architecture

```mermaid
mindmap
  root((Policy Mapping<br/>System))
    Frontend
      React UI
      Responsive Design
      Interactive Tables
      Real-time Updates
    Backend
      REST API
      File Processing
      Data Management
      CORS Enabled
    AI Engine
      TF-IDF Similarity
      OpenAI Integration
      Groq Integration
      Confidence Scoring
    File Processing
      DOCX Extraction
      PDF Parsing
      Text Normalization
      Deduplication
    Data Management
      In-Memory Storage
      CRUD Operations
      Batch Processing
      Sample Data Loading
    Mapping Features
      Auto-Mapping
      Manual Mapping
      Confidence Threshold
      Batch Operations
      Coverage Analytics
```

## Security & Data Flow

```mermaid
graph TB
    subgraph "Security Layers"
        SEC1[CORS Protection<br/>Cross-Origin Control]
        SEC2[Input Validation<br/>Request Sanitization]
        SEC3[File Type Validation<br/>DOCX/PDF/TXT Only]
        SEC4[Hash-based Deduplication<br/>Content Integrity]
        SEC5[API Key Management<br/>External Services]
    end

    subgraph "Data Processing Pipeline"
        PIPE1[File Upload] --> PIPE2[Extract Content]
        PIPE2 --> PIPE3[Normalize Text]
        PIPE3 --> PIPE4[Generate Hash]
        PIPE4 --> PIPE5[Check Duplicates]
        PIPE5 --> PIPE6[Store/Index]
        PIPE6 --> PIPE7[Ready for Mapping]
    end

    SEC1 --> PIPE1
    SEC2 --> PIPE1
    SEC3 --> PIPE2
    SEC4 --> PIPE5
    SEC5 --> PIPE7
    
    style SEC1 fill:#ff6b6b
    style SEC2 fill:#ff6b6b
    style SEC3 fill:#ff6b6b
    style SEC4 fill:#ff6b6b
    style SEC5 fill:#ff6b6b
```

## API Endpoint Architecture

```mermaid
graph LR
    API[Express API<br/>localhost:5000]
    
    subgraph "Core Data Endpoints"
        POL[/api/policies<br/>GET, POST]
        STD[/api/standards<br/>GET, POST]
        MAP[/api/mappings<br/>GET, POST, DELETE]
        SUB[/api/sub-mappings<br/>GET, POST, DELETE]
    end
    
    subgraph "AI Endpoints"
        AUTO[/api/auto-map<br/>POST]
        BATCH[/api/auto-map/batch<br/>POST]
        ENG[/api/engines<br/>GET, POST]
    end
    
    subgraph "File Processing Endpoints"
        UP[/api/policies/upload<br/>POST]
        ING[/api/ingest/fs<br/>POST]
        PROC[/api/standards/process-pdf<br/>POST]
        TXT[/api/standards/process-txt<br/>POST]
    end
    
    subgraph "Utility Endpoints"
        STAT[/api/stats<br/>GET]
        RESET[/api/reset<br/>POST]
        SAMPLE[/api/standards/sample<br/>POST]
        COV[/api/standards/coverage<br/>GET]
    end
    
    API --> POL
    API --> STD
    API --> MAP
    API --> SUB
    API --> AUTO
    API --> BATCH
    API --> ENG
    API --> UP
    API --> ING
    API --> PROC
    API --> TXT
    API --> STAT
    API --> RESET
    API --> SAMPLE
    API --> COV
    
    style API fill:#f5a623
    style AUTO fill:#bd10e0
    style BATCH fill:#bd10e0
```

---

## Summary

This architecture represents a modern full-stack healthcare policy management system with the following key characteristics:

### Current State (Phase 1)
- **Frontend**: React + Vite with interactive UI components
- **Backend**: Node.js + Express REST API
- **AI Engine**: TF-IDF similarity with pluggable architecture (OpenAI, Groq)
- **Storage**: In-memory data structures
- **File Processing**: DOCX/PDF/TXT extraction and normalization
- **Status**: ✅ Fully functional with 589 policies ingested

### Future Enhancements (Phase 2)
- Database persistence (PostgreSQL/SQLite)
- Cloud storage integration
- Advanced embeddings (transformers, sentence-BERT)
- User authentication and authorization
- OCR for scanned documents
- Export functionality (CSV, reports)
- Analytics dashboard
- Containerization (Docker)

### Key Strengths
1. **Modular Architecture**: Clean separation of concerns
2. **Pluggable AI**: Easy to swap between TF-IDF, OpenAI, and Groq
3. **Extensible Design**: Ready for Phase 2 enhancements
4. **Full-Stack**: Complete end-to-end solution
5. **Developer-Friendly**: Hot reload, clear API structure, comprehensive documentation
