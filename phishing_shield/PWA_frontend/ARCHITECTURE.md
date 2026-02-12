# PhishGuard AI - Architecture Documentation

## System Overview

PhishGuard AI is an **offline-first Progressive Web Application (PWA)** designed for critical infrastructure environments where internet connectivity is limited or restricted. It provides real-time AI-powered phishing detection with explainable results.

## Core Features

### 1. Offline-First Architecture
- **No internet dependency** for core functionality
- Local IndexedDB storage for scan history
- Service Worker for offline caching
- Full functionality in airplane mode

### 2. AI Inference Engine
- **On-device pattern matching** using regex-based detection
- Analyzes 6 key threat indicators:
  - Urgency language
  - Impersonation attempts
  - Suspicious URL patterns
  - Financial trigger words
  - Credential requests
  - Domain spoofing
- Returns explainable results with confidence scores

### 3. Security-Grade UI
- **Dark mode by default** for control room environments
- High contrast design for readability
- Minimal animations to reduce distraction
- Professional SOC-style interface

## Technical Stack

### Frontend Framework
- **React 18.3.1** with TypeScript
- **React Router 7** for multi-page navigation
- **Tailwind CSS v4** for styling

### Key Libraries
- **idb** - IndexedDB wrapper for local storage
- **Recharts** - Data visualization for analytics
- **Lucide React** - Icon system
- **Sonner** - Toast notifications
- **date-fns** - Date formatting

### State Management
- React hooks for local state
- IndexedDB for persistent storage
- No external state management library needed

## Application Structure

```
/src
├── /app
│   ├── /components
│   │   ├── RootLayout.tsx         # Main navigation shell
│   │   └── /ui                    # Reusable UI components
│   ├── /pages
│   │   ├── ThreatScanConsole.tsx  # Main scanning interface
│   │   ├── ScanHistory.tsx        # Forensic audit logs
│   │   ├── ThreatAnalytics.tsx    # Dashboard with charts
│   │   └── SystemStatus.tsx       # System health monitoring
│   ├── /lib
│   │   ├── db.ts                  # IndexedDB operations
│   │   └── ai-engine.ts           # Phishing detection logic
│   ├── routes.ts                  # React Router configuration
│   └── App.tsx                    # Root component
├── /styles
│   ├── index.css                  # Global styles
│   ├── theme.css                  # Design tokens
│   └── tailwind.css               # Tailwind entry
└── main.tsx                       # Application entry point

/public
├── manifest.json                  # PWA manifest
└── sw.js                          # Service Worker
```

## Database Schema

### IndexedDB Stores

#### `scans` Store
```typescript
interface ScanRecord {
  id: string;                      // Unique scan ID
  timestamp: Date;                 // When scan was performed
  messageType: 'email' | 'sms' | 'chat' | 'file';
  content: string;                 // Message content (encrypted in production)
  verdict: 'safe' | 'suspicious' | 'phishing';
  confidence: number;              // 0-1 confidence score
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggeredFeatures: string[];     // Detected threat indicators
  operatorDecision?: 'incident' | 'false-positive' | 'pending';
  operator?: string;               // Operator ID (future)
}
```

**Indexes:**
- `by-date` - Sort by timestamp
- `by-verdict` - Filter by threat verdict
- `by-risk` - Filter by risk level

#### `settings` Store
Key-value store for application settings and preferences.

## Component Hierarchy

### RootLayout
- Persistent sidebar navigation
- Online/offline status indicator
- Version information display

### ThreatScanConsole (Main Screen)
**Input Section:**
- Multi-line text input
- File upload (.txt, .eml)
- Message type selector (Email/SMS/Chat)

**AI Result Panel:**
- Threat verdict with color-coded status
- Confidence score with progress bar
- Risk level badge
- Explainable AI feature breakdown
- Operator action buttons

### ScanHistory
- Searchable forensic log table
- Multi-filter support (verdict, risk, date)
- CSV export functionality
- Inline scan deletion

### ThreatAnalytics
**Key Metrics:**
- Total scans today
- Phishing attempts detected
- Safe message percentage
- Critical threats count

**Visualizations:**
- 7-day trend line chart
- Verdict distribution pie chart
- Top detected indicators bar chart
- Risk level distribution

### SystemStatus
- AI model version and metadata
- Local database statistics
- System component health checks
- Update management (requires online)

## AI Engine Logic

### Feature Detection Flow

1. **Input Processing**
   - Normalize text (lowercase, trim)
   - Extract URLs and domains
   - Tokenize content

2. **Pattern Matching**
   - Apply regex patterns for each feature
   - Calculate severity score per feature
   - Aggregate detected indicators

3. **Risk Calculation**
   ```
   Risk Score = Σ(detected features × severity)
   Normalized Score = min(Risk Score / 3, 1)
   
   If Score < 0.3: SAFE
   If Score < 0.6: SUSPICIOUS
   If Score ≥ 0.6: PHISHING
   ```

4. **Confidence Estimation**
   - Safe: 85-95%
   - Suspicious: 70-85%
   - Phishing: 80-99%

5. **Explanation Generation**
   - List all triggered features
   - Provide actionable verdict
   - Include risk context

## Offline Capabilities

### What Works Offline
✅ All scanning functionality
✅ Scan history access
✅ Analytics dashboard
✅ Data export to CSV
✅ System status monitoring

### What Requires Online
❌ Model updates
❌ Rule set updates
❌ System synchronization

### Service Worker Strategy
- **Network-first** for API calls
- **Cache-fallback** for static assets
- **Offline notification** in UI

## Security Considerations

### Current Implementation (Demo)
⚠️ Data stored in **unencrypted** IndexedDB
⚠️ No user authentication
⚠️ Client-side only validation

### Production Requirements
🔒 **Encrypt local database** using Web Crypto API
🔒 **Implement authentication** with role-based access
🔒 **Add content security policy** headers
🔒 **Use HTTPS only** deployment
🔒 **Implement audit logging** for compliance
🔒 **Add data retention policies**
🔒 **Sanitize all user inputs**

## Deployment Strategy

### For Critical Infrastructure

1. **Offline Package**
   - Build static bundle (`npm run build`)
   - Package with Electron or similar
   - Distribute via secure internal channels

2. **Kiosk Mode**
   - Lock to fullscreen
   - Disable developer tools
   - Read-only file system

3. **Update Distribution**
   - Secure update server (when online)
   - Cryptographic signature verification
   - Rollback capability

## Future Enhancements

### Planned Features
- [ ] Multilingual support (10+ languages)
- [ ] Voice-to-text scanning
- [ ] OCR for image-based phishing
- [ ] TensorFlow.js ML model integration
- [ ] Centralized reporting dashboard
- [ ] Mobile native apps (React Native)
- [ ] Biometric authentication
- [ ] Advanced threat intelligence feeds

### Scalability Considerations
- Replace regex with trained ML model
- Add Web Workers for heavy processing
- Implement virtual scrolling for large datasets
- Add pagination for scan history
- Optimize IndexedDB queries with cursors

## Performance Metrics

### Target Performance
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Scan Processing**: < 1s
- **Database Query**: < 100ms
- **Export Generation**: < 2s for 1000 records

### Bundle Size Goals
- **Initial JS**: < 300 KB (gzipped)
- **Total Assets**: < 1 MB
- **IndexedDB**: Up to 50 MB local storage

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Chromium-based browsers

### Required APIs
- IndexedDB
- Service Workers
- Web Workers
- LocalStorage
- Fetch API

## Testing Strategy

### Recommended Tests
1. **Unit Tests** - AI engine pattern matching
2. **Integration Tests** - Database operations
3. **E2E Tests** - User workflows
4. **Offline Tests** - Service worker functionality
5. **Performance Tests** - Large dataset handling
6. **Security Tests** - XSS, injection attempts

## Maintenance

### Regular Tasks
- Update phishing patterns monthly
- Review false positives
- Optimize database size
- Update dependencies
- Security patches

### Monitoring
- Track scan accuracy
- Monitor storage usage
- Log error rates
- Measure user engagement

---

**Version**: 1.0.0  
**Last Updated**: February 12, 2026  
**Model Version**: 2.3.1  
**Rule Set**: 4.1.0
