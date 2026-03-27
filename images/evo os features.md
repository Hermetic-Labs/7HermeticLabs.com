# Hermetic Labs EVE OS - Features List

This document outlines the comprehensive features of the Hermetic Labs EVE OS ecosystem, derived from a manual analysis of the codebase.

## 1. EVE OS Backend (Python/FastAPI)

**Location:** `Final Production/backend`
The core intelligence engine and operating system backend.

### Core Systems

- **Authentication & RBAC**: Robust user authentication and Role-Based Access Control (`/auth`, `/rbac`).
- **Reflex System**: "Consciousness" loop, thread management, and heartbeat monitoring (`/reflex`, `/api/consciousness`).
  - **Adam Crawler**: Distributed, domain-aware web crawler that feeds the memory system (`adam_crawler.py`).
  - **Consciousness Validation**: Real-time validation framework with WebSocket monitoring (`/ws/validation-monitor`).
- **Vector Store**: Memory cultivation system ("The Pot") for long-term AI memory (`/api/vector`).
- **Ingestion Pipelines**: Multi-modal content ingestion (Audio, Vision, Text) (`/api/ingest`).

### AI & Intelligence

- **LLM Management**: Management of Local LLMs (`/api/model`).
- **Whisper STT**: Integrated Speech-to-Text via Faster-Whisper.
- **Image Generation**: Stable Diffusion Turbo integration (`/api/image`).
- **Tool Calling**: Natural language execution of system commands (`/api/tools`).

### Business & Infrastructure

- **Marketplace (Local)**: Management of installed modules and packages (`/marketplace`).
- **Payments**: Stripe integration for in-app purchases (`/payments`).
- **Analytics & Observability**: System health and usage tracking (`/analytics`, `/observability`).
- **Gateway**: API Gateway functionality (`/gateway`).

### Developer Tools

- **Graph API**: Tools for visual flow graph management (`/api/graph`).
- **Node Management**: System for managing execution nodes (`/nodes`).

---

## 2. EVE OS Frontend (React/Vite)

**Location:** `Final Production/frontend`
The primary user interface for EVE OS.

### Workspaces & Portals

- **Admin Portal**: System administration and user management.
- **Developer Portal**: Tools for building and publishing modules.
- **Seller Dashboard**: Analytics and management for marketplace sellers.

### Creative Suites

- **Flow Studio**: Visual node-based programming environment.
- **Editor 3D**: Three.js based 3D environment editor.
- **Cortex 3D**: Visualizer for system intelligence.

### User Interaction

- **Enhanced Chat**: Rich chat interface with AI personas.
- **Marketplace**: Browse and install system modules.
- **Documentation**: Integrated "features as docs" system.
- **Threads**: Management of conversation threads.

---

## 3. Hermetic Labs API (TypeScript/Azure Functions)

**Location:** `hermetic-labs-api/backend`
Cloud services powering the ecosystem and marketplace.

### Cloud Identity & Commerce

- **Auth Services**: Login, Register, Password Reset (`auth*.ts`).
- **Commerce**: Stripe checkout, subscription management, free claims.
- **Verification**: Purchase verification logic (`verifyPurchase.ts`).

### Package Registry

- **Package Management**: CRUD operations for packages.
- **Library**: User-owned package library.
- **Reviews**: Rating and review system for packages.

### Cloud Tools

- **Code Analysis**: `TSX Scanner` provides a new-style IDE feature, scanning frontend source files for syntax validity and categorization (`tsxScanner.ts`).
- **Remote Execution**: Secure Python execution in the cloud (`executePython.ts`).
- **Diagnostics**: Cloud-based system diagnostics.
- **Seller Services**: Onboarding and status checks for sellers.

---

## 4. Hermetic Labs Exchange (React)

**Location:** `hermetic-labs-exchange`
The web-based public marketplace storefront.

### Storefront Features

- **Product Catalog**: Browsable library of EVE OS modules (`LibraryPage`, `ProductPage`).
- **Seller Tools**: Dashboard for creators to manage products (`SellerDashboardPage`).
- **User Account**: Profile and purchase history management.
- **Authentication**: Buyer/Seller login and registration.

---

## 5. Deployment & Configuration

- **Start Script**: `start.bat` orchestrates all services (Backend, Context, API, Frontends).
- **Mode Switching**: Dynamic toggling between "Development" and "Production" modes.
- **Sync Tools**: `sync-dev-mode.js` ensures environment consistency.

---

## 6. Bespoke Features

Specialized enterprise and vertical-specific modules available via the Marketplace.

### Enterprise Connectors

- **Cloud Connectors**: Integrations for AWS S3, Azure Blob Storage, Google Cloud Storage.
- **Business Systems**: Plug-and-play connectors for Salesforce, SAP, Workday, and LexisNexis.
- **Government & Legal**: Specialized connectors for SAM.gov, USA Spending, and Westlaw.

### Compliance Suites

- **Regulatory Compliance**: Modules ensuring adherence to HIPAA, FedRAMP, ITAR, PCI-DSS, and SOX standards.
- **Privacy Tools**: Automated PHI detection, data masking, and audit trails.

### Vertical Solutions

- **HR & Payroll**: Comprehensive portal for human resources management.
- **Financial Tech**: Stock visualization and real-time market data tools.
- **Immersive Tech**: VR Spatial Engine and Beat Bubble VR experience.

---

## 7. Medical Module Advantages

**Package:** `medical-module`

### Clinical Excellence

- **Real-time Monitoring**: Continuous tracking of patient vitals with HealthKit integration.
- **AI-Powered Safety**: Automated fall detection with instant nurse overflow alerts.
- **Telehealth Ready**: Integrated video calling between patient rooms and nurse stations.

### Operational Efficiency

- **Nurse Station Dashboard**: Centralized multi-room management interface.
- **Digital Intake**: Streamlined patient intake forms replacing paper workflows.
- **Interoperability**: Native FHIR R4 support for seamless data exchange with hospital systems.

### Security & Privacy

- **HIPAA Compliant**: Built-in compliance with comprehensive audit logging.
- **Local-First Architecture**: Resilient local storage with conflict-resolving server synchronization.

---

## 8. Specific Subsystems & Architecture

### Reflex System (Consciousness)

- **Life* Framework**: A validation framework for AI consciousness, treating system events as "life signs".
- **Real-time Logging**: Network consciousness acts as a live log system, broadcasting agent events and validation status via WebSockets for real-time visualization (`/ws/validation-monitor`).
- **Adam Crawler**: A sophisticated "Chewer" mechanism that continuously consumes and "digests" web content (Documentation, Blogs, Academic papers) to cultivate the system's long-term memory (Vector Store).

### VR & Immersive Tech

- **VRM Companion**: Lip-syncing VRM avatar system driven by Kokoro TTS phonemes or audio amplitude (`vrm-companion`).
- **Beat Bubble VR**: A WebXR-ready spherical rhythm game using pure Web Audio API synthesis (`beat-bubble-vr`).

### Local-First Architecture

- **Resilience**: Modules like the Medical Suite typically employ local storage (IndexedDB) for critical operations, ensuring functionality even during network outages.
- **Sync**: Conflict resolution mechanisms handle synchronization with the central server when connectivity is restored.
- **Data Sovereignty**: Privacy-critical data (like PHI in the HIPAA module) is processed locally where possible, with strict controls on what leaves the device.
