# HALT — Alpha Implementation Reference (v1.0.1-alpha)

> **INTERNAL ALPHA REFERENCE — NOT A CLINICAL, DEPLOYMENT, REGULATORY, OR PERFORMANCE CLAIM.**
>
> This inventory describes candidate source-code capabilities in a closed-beta coordination prototype. Availability, reliability, offline behavior, language quality, clinical safety, privacy, and field suitability require build-specific and deployment-specific validation. AI and protocol outputs are informational aids for qualified human review.

---

## 1. Patient Intake & Registration

Handles entry of patients into the system.

- Patient registration with demographics, allergies, and spoken language
- Rapid triage data capture (priority, hemorrhage class, GCS)
- Ward and bed assignment
- Mass casualty intake mode for rapid registration
- Patient opt-in for public family lookup
- Injury mechanism and body region tracking

> 📂 `api/routes/patients.py` → `POST /api/patients`

**Purpose** — Quickly organize incoming patients during both normal and disaster scenarios.

---

## 2. Patient Records & Detail Panel

Each patient has a full detail panel containing:

- Patient photo (file attachment)
- Draft protocol-reference plan fields (MARCH, medication references, recovery, and escalation) for qualified human review
- Medication list with dosage, route, and regimen
- Vitals history (growing event timeline)
- Notes
- Task history
- Ward and bed location
- Next of kin and spoken language

> 📂 `api/routes/patients.py` → `GET /api/patients/{id}`, model: `PatientRecord`

Candidate interface for consolidating recorded patient data during controlled evaluation.

---

## 3. Patient Monitoring

### Vitals Tracking

- Authorised staff record vitals; trained volunteers may assist only under qualified supervision and local policy
- Vitals automatically added to growing patient chart via event log
- Visual history of patient condition over time

### Medication Tracking

- Medication administration recorded as events
- System can draft the next medication reminder for confirmation by authorised personnel

### Recurring Care Tasks

When recorded care actions occur, the system can propose the next task. Qualified personnel must review and confirm any clinical or medication-related action.

| Trigger | Result |
|---|---|
| Vitals taken | Propose next vitals check |
| Medication administered | Propose next-dose reminder for confirmation |

Tasks include countdown timers, due times, and task ownership.

> 📂 `api/routes/patients.py` → `POST /api/patients/{id}/events`, `api/routes/tasks.py`

---

## 4. Task Coordination System

Non-clinical tasks can be claimed by authorised staff or volunteers. Clinical tasks require assignment and oversight consistent with local policy and professional scope.

- Check vitals
- Record an assigned medication administration under qualified clinical direction
- Reassess patient
- Update records

> 📂 `api/routes/tasks.py`

**Intended purpose** — Support task visibility and workload coordination during controlled evaluation. It does not determine clinical scope or replace supervision.

---

## 5. Public Patient Lookup (QR System)

Family members can locate patients without staff assistance.

### How It Works

1. A single QR code links to the triage server on the local network
2. Patients can opt-in to public visibility during intake
3. Family scans QR code on their phone
4. Displays: patient name, ward, bed location, and photo (if uploaded)

### Benefits

- May reduce routine status enquiries in an approved deployment
- May reduce front-desk lookup workload
- Designed for configured local-network use; privacy, consent, access control, and network behavior require deployment-specific review

> 📂 `api/routes/patients.py:92` → `GET /api/public/patients`
> 📂 `api/routes/mesh.py:382` → `GET /api/mesh/qr` (generates QR with embedded WiFi + app URL)

---

## 6. Ad-Hoc Inventory System

Any location can become a supply inventory.

**Examples** — closet, ambulance, tent, vehicle trunk, supply bin

- Dynamic inventory locations (create, rename, delete)
- Stock tracking with minimum thresholds
- Supply usage logging with user attribution
- Candidate supply-alternative suggestions for staff review when items run low
- Activity log (who consumed/restocked what, when)
- Auto-cascade: deleting a location moves items to default

> 📂 `api/routes/inventory.py` → full CRUD + `PATCH /api/inventory/{id}/consume`

---

## 7. Supply Consumption & Alert Prototypes

Draft protocol-reference plans can be mapped to inventory for staff review.

### Flow

1. Patient checked in
2. Draft plan prepared for qualified review
3. Candidate supplies identified
4. System prompts authorised staff to confirm consumption
5. Inventory updates after confirmation

### Auto-Alert System

When recorded stock drops below a configured threshold, the system can:

| Stock Level | Action |
|---|---|
| Below minimum | Broadcasts `⚠️ SUPPLY ALERT` to all connected devices |
| Reaches zero | Triggers `🚨 SUPPLY EMERGENCY` with candidate alternatives for review |

Alerts are logged to the team chat and pushed via WebSocket to all connected clients.

> 📂 `api/routes/inventory.py:171` → auto-alert logic inside `consume_inventory()`

---

## 8. Medical Protocol System

Provides structured protocol-reference fields for evaluation by qualified personnel.

- MARCH protocol (Massive hemorrhage, Airway, Respiration, Circulation, Hypothermia)
- Hemorrhage classification
- GCS (Glasgow Coma Scale) categorization
- Triage priority assignment (T1–T4)
- Draft informational plan fields covering medication references, recovery, and escalation for qualified review

> 📂 `api/routes/patients.py:44` → `PatientPlan` model with `march`, `drugs`, `rx`, `recovery`, `escalate`

**Intended purpose** — Present consistent informational references to qualified personnel. The software does not diagnose, prescribe, authorise treatment, or replace clinical judgment.

---

## 9. Real-Time Translation Bridge

A persistent WebSocket translation bridge enabling **real-time person-to-person communication across languages**.

### How It Works

```
Person A speaks Arabic
  → Faster Whisper transcribes to Arabic text
    → Translation Bridge converts Arabic → English
      → English text delivered to Person B
        → Person B responds in English
          → Bridge converts English → Arabic
            → Phoneme conversion via eSpeak
              → Kokoro TTS speaks Arabic aloud to Person A
```

### Two Translation Paths

| Path | Protocol | Use Case |
|---|---|---|
| **Bridge (WebSocket)** | Real-time streaming | Live chat translation between staff and patients |
| **REST API** | Single + batch requests | UI label translation, document export |

### Capabilities

- Interface codes are configured for 42 languages through NLLB-200; translation and voice quality require validation for each language and deployment context
- CTranslate2 runtime (no PyTorch required) — fast, lean
- SentencePiece tokenization with NLLB BCP-47 language codes
- Phoneme transliteration via eSpeak for languages Kokoro wasn't trained on
- Batch translation endpoint for reduced HTTP overhead

> 📂 `api/bridge.py` → WebSocket at `/api/bridge/translate` (real-time translation + phonemization)
> 📂 `api/routes/translate.py` → `POST /api/translate`, `POST /api/translate/batch`

**Intended purpose** — Support multilingual communication on configured local hardware. Accuracy, latency, offline availability, and suitability for medical communication require human validation.

---

## 10. Voice Interface

### Speech-to-Text — Faster Whisper

- Voice intake for hands-free documentation
- Multilingual speech recognition
- Voice-to-text for chat messaging

### Text-to-Speech — Kokoro

- Candidate spoken read-back in the selected language for human confirmation
- Experimental phoneme-based synthesis for languages outside the model's native training coverage
- eSpeak phonemizer converts native text → IPA phonetics → Kokoro output

> 📂 `api/routes/stt.py` (speech-to-text), `api/routes/tts.py` (text-to-speech)
> 📂 `api/bridge.py:125` → `transliterate_phonetics()` (eSpeak → IPA pipeline)

---

## 11. Mesh Network Communication

Real-time WebSocket-based mesh network connecting multiple devices over local WiFi.

### Chat System

- Broadcast messages to all connected staff
- Direct messages (DMs) with per-pair thread storage
- Reply threading (reply-to message references)
- Emoji reactions on messages
- Chat history persistence (last 500 messages)

### Emergency & Announcements

- Emergency broadcasts with category targeting (All Hands, Doctors, Intake, Volunteers, etc.)
- General announcements pushed to all devices
- Emergency and announcement entries auto-logged to team chat

### Voice & Video Calls

- WebRTC signaling relay (offer/answer/ICE candidate forwarding)
- Call request, accept, reject, and end flow
- Voice and video call types

### Device Coordination

- QR onboarding — scan to connect (encodes WiFi SSID + app URL + name/role)
- Real-time patient sync — new/updated patients broadcast to all devices
- Client join/leave notifications
- Stale client auto-pruning (60-second timeout)
- Configuration target of up to 20 concurrent clients; actual capacity requires network and device testing

> 📂 `api/routes/mesh.py` → WebSocket at `/ws/{client_id}`, REST endpoints under `/api/mesh/*`

---

## 12. Leadership & Failover

Role-based hierarchy with automatic failover.

- Leader, Medic, Responder role priority system
- Self-promotion endpoint for leadership takeover
- Full state snapshot for leadership handover (patients, roster, tasks)
- Roster auto-updates on WebSocket connect/disconnect

> 📂 `api/routes/mesh.py:164` → `POST /api/mesh/promote`
> 📂 `api/routes/mesh.py:141` → `GET /api/mesh/snapshot`

**Intended purpose** — Support continuity if a coordinating device becomes unavailable. Recovery behavior and data integrity require deployment-specific testing.

---

## 13. Shift Report System

Handles transition between medical shifts.

- All active patients grouped by ward
- Sorted by triage priority (T1 first)
- Latest vitals, medications, allergies at a glance
- Print-ready HTML output
- Multilingual export (pass `?lang=xx`)

> 📂 `api/routes/patients.py:557` → `GET /api/reports/shift`

**Intended purpose** — Assist qualified teams with shift handoff; generated reports require review against the source record.

---

## 14. Patient Export & Medevac Handoff

Print-ready patient records for transfer or evacuation.

### PDF Export

- Recorded patient data rendered as PDF for review (no external PDF library)
- Demographics, triage, vitals, MARCH protocol, medications, timeline

### HTML Export (Medevac)

- Print-optimized HTML with recorded operational and clinical fields
- Multilingual — UI labels and dynamic content translated via NLLB
- Includes triage color-coding, event timeline (last 20), and draft plan entries requiring qualified review

### Data Replication

- Full patient snapshot API for backup
- Restore endpoint to ingest snapshot on new device

> 📂 `api/routes/patients.py:259` → `GET /api/patients/{id}/pdf` (PDF)
> 📂 `api/routes/patients.py:392` → `GET /api/patients/{id}/export` (HTML medevac)
> 📂 `api/routes/patients.py:662` → `GET /api/patients/snapshot` + `POST /api/patients/restore`

---

## 15. Emergency Alert System

A dynamic emergency notification system.

- Emergency broadcasts with categories: All Hands, Expediters, Inventory, Bed Assist, Doctors, Intake, Volunteers
- Supply depletion emergencies triggered automatically by inventory system
- Alerts logged to team chat for audit trail
- Sound notifications on receiving devices

> 📂 `api/routes/mesh.py:217` → `POST /api/mesh/emergency`
> 📂 `api/routes/mesh.py:264` → `POST /api/mesh/announcement`
> 📂 `api/routes/mesh.py:189` → `POST /api/mesh/alert` (targeted or broadcast)

**Intended purpose** — Support rapid notification of configured personnel; delivery and response times are not guaranteed.

---

## 16. AI Model Layer

| Model | Role | Runtime |
|---|---|---|
| MedGemma 4B | Informational suggestions for qualified review; not diagnosis, prescribing, or medical advice | llama.cpp (GGUF) |
| NLLB-200 600M | Neural machine translation (42 languages) | CTranslate2 |
| Faster Whisper | Speech-to-text (multilingual) | CTranslate2 |
| Kokoro | Text-to-speech (multilingual via phoneme bridge) | ONNX Runtime |

The default alpha design supports local model execution. Operator configuration, downloads, updates, integrations, and optional external services may create network traffic or data egress and require separate privacy and security review.

> 📂 `api/routes/inference.py` → MedGemma (prefers `medgemma*.gguf`)
> 📂 `api/routes/translate.py` → NLLB-200 via CTranslate2
> 📂 `api/routes/stt.py` → Faster Whisper
> 📂 `api/routes/tts.py` → Kokoro via ONNX Runtime

---

## 17. Auto-Download Distribution System

The alpha build can download model packs during setup. Network access, storage, licensing, integrity checks, and operator confirmation may be required.

- 4 model packs: Voice (89 MB), STT (141 MB), Translation (2.3 GB), AI (2.4 GB)
- Resumable downloads (HTTP Range support)
- Server-Sent Events (SSE) progress streaming
- SHA-256 checksum verification
- Sequential multi-pack download queue

> 📂 `api/routes/distribution.py` → `POST /api/distribution/download`, `GET /api/distribution/progress`
> 📂 `start.py:88` → `ensure_models()` (auto-download from public R2 bucket)

---

## 18. Portable Runtime Environment

The alpha build is designed as a portable local package; platform coverage and dependency behavior require build-specific verification.

- Portable Python (standalone, no system install required)
- Embedded dependencies (all wheels bundled)
- Bundled AI models (auto-download on first launch)
- Progressive Web App (PWA) with service worker for offline frontend
- Cross-platform: Windows (Electron) and macOS (standalone Python)

### Benefits

- Intended for controlled evaluation of field-coordination workflows
- Guided startup through `python start.py`; setup and environment validation may still be required
- Designed for evaluation in low-infrastructure environments
- Core local workflows are designed to continue without permanent internet after required assets are installed

> 📂 `start.py` → unified entry point
> 📂 `dev/build_and_deploy.py` → `--platform win` / `--platform mac`

---

## 19. Roster & Staff Management

Track all personnel on duty.

- Staff registration with name and role
- Connection status tracking (connected/offline/pending)
- Auto-status updates via WebSocket (connect → "connected", disconnect → "offline")

> 📂 `api/routes/roster.py`

---

## 20. Ward Management

Organize the physical layout of the field hospital.

- Ward CRUD (create, update, delete)
- Room/bed assignment per ward
- Visual ward map with patient placement

> 📂 `api/routes/wards.py`
