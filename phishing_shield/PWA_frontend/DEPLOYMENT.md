# PhishGuard AI - Deployment Guide for Critical Infrastructure

## Overview

This guide provides step-by-step instructions for deploying PhishGuard AI in air-gapped, restricted, or critical infrastructure environments.

---

## Deployment Scenarios

### Scenario 1: Fully Offline Deployment (Air-Gapped)
**Use Case**: Power grid control rooms, defense facilities, isolated field sites

**Characteristics**:
- No internet access
- High security requirements
- Manual updates via physical media
- Standalone operation

### Scenario 2: Restricted Network Deployment
**Use Case**: Railway operations, oil & gas facilities, government offices

**Characteristics**:
- Limited internet (firewall restrictions)
- Periodic connectivity for updates
- Internal network only
- Centralized monitoring (optional)

### Scenario 3: Mobile/Field Deployment
**Use Case**: Field inspectors, mobile security teams, remote workers

**Characteristics**:
- Intermittent connectivity
- Tablet/laptop deployment
- Sync when online
- Portable operation

---

## Pre-Deployment Requirements

### Hardware Requirements (Minimum)

**Desktop/Kiosk**:
- Processor: Intel Core i3 / AMD Ryzen 3 (2015+)
- RAM: 4 GB
- Storage: 500 MB free space
- Display: 1280x720 minimum

**Tablet/Mobile**:
- Processor: ARM-based, 1.5 GHz quad-core
- RAM: 2 GB
- Storage: 200 MB free space
- Display: 1024x768 minimum

### Software Requirements

**Required**:
- Modern web browser (Chrome 90+, Firefox 88+, Edge 90+)
- JavaScript enabled
- LocalStorage/IndexedDB enabled

**Recommended**:
- Latest stable browser version
- Browser auto-update disabled (for stability)
- Ad-blockers disabled

### Network Requirements

**For Initial Deployment**:
- One-time internet access to download bundle

**For Updates** (if applicable):
- HTTPS access to update server
- Ports: 443 (HTTPS)
- Bandwidth: ~1 MB per update

---

## Installation Methods

### Method 1: Static Web Server (Recommended)

**Best for**: Kiosks, shared workstations, local networks

#### Step 1: Build the Application

```bash
# On a development machine with internet
git clone <repository-url>
cd phishguard-ai
npm install
npm run build
```

This creates a `/dist` folder with all static files.

#### Step 2: Package for Transfer

```bash
# Create deployment package
cd dist
tar -czf phishguard-deployment.tar.gz *
```

Transfer `phishguard-deployment.tar.gz` via:
- USB drive
- Secure file transfer
- Physical media

#### Step 3: Deploy on Target System

```bash
# On target system
mkdir -p /var/www/phishguard
cd /var/www/phishguard
tar -xzf phishguard-deployment.tar.gz
```

#### Step 4: Configure Web Server

**Option A: Nginx**

```nginx
server {
    listen 80;
    server_name phishguard.local;
    
    root /var/www/phishguard;
    index index.html;
    
    # PWA support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

**Option B: Apache**

```apache
<VirtualHost *:80>
    ServerName phishguard.local
    DocumentRoot /var/www/phishguard
    
    <Directory /var/www/phishguard>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # PWA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

**Option C: Simple Python Server** (for testing)

```bash
cd /var/www/phishguard
python3 -m http.server 8080
```

Access at: `http://localhost:8080`

---

### Method 2: Electron Desktop App

**Best for**: Individual workstations, offline laptops

#### Step 1: Build Electron Package

```bash
# Install Electron packager
npm install -g electron-packager

# Package for Windows
electron-packager . PhishGuardAI --platform=win32 --arch=x64 --icon=icon.ico

# Package for macOS
electron-packager . PhishGuardAI --platform=darwin --arch=x64 --icon=icon.icns

# Package for Linux
electron-packager . PhishGuardAI --platform=linux --arch=x64
```

#### Step 2: Distribute Installer

- Windows: Create MSI installer with WiX
- macOS: Create DMG file
- Linux: Create .deb or .rpm package

---

### Method 3: Browser Extension

**Best for**: Shared devices, restricted systems

*Note: Requires browser extension development*

Benefits:
- No server needed
- Works in locked-down browsers
- Portable across machines

---

## Security Hardening

### 1. Content Security Policy

Add to index.html `<head>`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:; 
               connect-src 'self';">
```

### 2. HTTPS Enforcement (Production)

**Self-Signed Certificate** (for internal use):

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

Update Nginx:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ...
}
```

### 3. Database Encryption

**Enable in production**:

Edit `/src/app/lib/db.ts` to add encryption:

```typescript
import { subtle } from 'crypto';

// Generate encryption key
const key = await subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Encrypt before saving
async function encryptData(data: string): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );
  return encrypted;
}
```

### 4. Access Control

**Kiosk Mode**:

```bash
# Chrome kiosk mode (Linux)
chromium-browser --kiosk --app=http://localhost/phishguard

# Windows
chrome.exe --kiosk --app=http://localhost/phishguard

# Disable developer tools
--disable-dev-tools
```

**Session Timeout**:

Add to App.tsx:
```typescript
useEffect(() => {
  let timeout: NodeJS.Timeout;
  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Clear sensitive data
      localStorage.clear();
      window.location.reload();
    }, 15 * 60 * 1000); // 15 minutes
  };
  
  window.addEventListener('click', resetTimeout);
  window.addEventListener('keypress', resetTimeout);
  
  return () => {
    window.removeEventListener('click', resetTimeout);
    window.removeEventListener('keypress', resetTimeout);
  };
}, []);
```

---

## Configuration

### Environment Variables

Create `.env.production`:

```env
VITE_APP_NAME=PhishGuard AI
VITE_MODEL_VERSION=2.3.1
VITE_UPDATE_SERVER=https://updates.internal.local
VITE_MAX_DB_SIZE=52428800  # 50 MB
VITE_SESSION_TIMEOUT=900000  # 15 minutes
```

### Custom Branding

**Logo**: Replace `/public/icon-192.png` and `/public/icon-512.png`

**Colors**: Edit `/src/styles/theme.css`

```css
:root {
  --color-primary: #your-color;
  --theme-color: #your-color;
}
```

**App Name**: Edit `/public/manifest.json`

```json
{
  "name": "Your Organization - PhishGuard",
  "short_name": "PhishGuard"
}
```

---

## Update Management

### Manual Updates (Air-Gapped)

#### Step 1: Prepare Update Package

```bash
# On development machine
npm run build
cd dist
tar -czf phishguard-update-v2.4.0.tar.gz *

# Create checksum
sha256sum phishguard-update-v2.4.0.tar.gz > checksum.txt
```

#### Step 2: Transfer Securely

- USB drive (scan for malware)
- Encrypted file transfer
- Physical delivery

#### Step 3: Verify and Apply

```bash
# Verify checksum
sha256sum -c checksum.txt

# Backup current version
cp -r /var/www/phishguard /var/www/phishguard.backup

# Apply update
cd /var/www/phishguard
tar -xzf phishguard-update-v2.4.0.tar.gz

# Restart web server
sudo systemctl restart nginx
```

#### Step 4: Test

1. Open application
2. Check System Status screen
3. Verify new version number
4. Test core functionality

### Automatic Updates (Connected Systems)

**Update Server Setup**:

```javascript
// update-server.js
const express = require('express');
const app = express();

app.get('/api/version', (req, res) => {
  res.json({
    version: '2.4.0',
    releaseDate: '2026-02-15',
    critical: false,
    downloadUrl: '/updates/phishguard-2.4.0.tar.gz'
  });
});

app.listen(8443, () => {
  console.log('Update server running on port 8443');
});
```

---

## Monitoring & Maintenance

### Health Checks

**System Monitoring**:

```bash
# Check web server
curl -I http://localhost/phishguard

# Check service worker
curl http://localhost/phishguard/sw.js

# Check disk space
df -h /var/www/phishguard
```

**Application Monitoring**:

Add to HTML:
```javascript
// Basic error tracking
window.addEventListener('error', (event) => {
  console.error('App Error:', event.error);
  // Send to monitoring system if available
});
```

### Backup Strategy

**Automated Backup Script**:

```bash
#!/bin/bash
# backup-phishguard.sh

BACKUP_DIR="/backup/phishguard"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup application files
tar -czf "$BACKUP_DIR/app-$DATE.tar.gz" /var/www/phishguard

# Backup user data (if centralized)
# Note: IndexedDB is browser-local, this is for server-side data
tar -czf "$BACKUP_DIR/data-$DATE.tar.gz" /var/lib/phishguard/data

# Rotate old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Run daily via cron:
```cron
0 2 * * * /usr/local/bin/backup-phishguard.sh
```

### Log Management

**Nginx Access Logs**:
```bash
tail -f /var/log/nginx/access.log | grep phishguard
```

**Application Logs**:
- Browser Console (F12)
- Service Worker logs (chrome://serviceworker-internals)

---

## Troubleshooting

### Issue: Service Worker not registering

**Symptoms**: Offline mode doesn't work

**Solution**:
1. Check HTTPS requirement (or localhost exception)
2. Verify `/sw.js` is accessible
3. Check browser console for errors
4. Clear browser cache and reload

### Issue: IndexedDB quota exceeded

**Symptoms**: "Database full" errors

**Solution**:
1. Go to Scan History
2. Delete old scans
3. Or increase browser quota (if permitted)

```javascript
// Request persistent storage
navigator.storage.persist().then(granted => {
  console.log('Persistent storage:', granted);
});
```

### Issue: Application won't load

**Symptoms**: Blank screen

**Solution**:
1. Check web server is running
2. Verify files in `/var/www/phishguard`
3. Check browser console for errors
4. Verify JavaScript is enabled
5. Try incognito mode

### Issue: Updates not applying

**Symptoms**: Version number doesn't change

**Solution**:
1. Hard refresh (Ctrl+Shift+R)
2. Unregister service worker
3. Clear browser cache
4. Verify update files deployed correctly

---

## Compliance & Audit

### Audit Logging

**Enable comprehensive logging**:

```typescript
// Add to db.ts
async function logAuditEvent(event: AuditEvent) {
  await db.put('audit', {
    id: `audit-${Date.now()}`,
    timestamp: new Date(),
    event: event.type,
    user: event.user,
    details: event.details,
    ipAddress: event.ip,
  });
}
```

### Data Retention

**Compliance script**:

```javascript
// Auto-delete scans older than 90 days
async function enforceRetention() {
  const db = await getDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const oldScans = await db.getAll('scans');
  for (const scan of oldScans) {
    if (new Date(scan.timestamp) < cutoffDate) {
      await db.delete('scans', scan.id);
    }
  }
}

// Run daily
setInterval(enforceRetention, 24 * 60 * 60 * 1000);
```

---

## Scaling Considerations

### Multi-Site Deployment

**Centralized Management**:

1. **Update Distribution**:
   - Central update server
   - Automated deployment pipeline
   - Version tracking

2. **Aggregated Reporting**:
   - Collect anonymized threat data
   - Cross-site threat intelligence
   - Unified dashboard

3. **Configuration Management**:
   - Ansible playbooks
   - Docker containers
   - Infrastructure as Code

### Load Balancing (High-Traffic Sites)

```nginx
upstream phishguard_backend {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}

server {
    listen 443 ssl;
    server_name phishguard.internal;
    
    location / {
        proxy_pass http://phishguard_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Testing Before Deployment

### Pre-Deployment Checklist

- [ ] Build completes without errors
- [ ] All pages load correctly
- [ ] Scan functionality works
- [ ] History saves and loads
- [ ] Analytics display data
- [ ] System status shows correct info
- [ ] Offline mode works (disable network)
- [ ] Export CSV works
- [ ] Service worker registers
- [ ] No console errors

### Load Testing

```bash
# Apache Bench (simple load test)
ab -n 1000 -c 10 http://localhost/phishguard/

# Expected: No errors, fast response times
```

### Security Testing

- [ ] XSS attempts blocked
- [ ] SQL injection (if applicable) blocked
- [ ] CSRF protection enabled
- [ ] Secure headers present
- [ ] HTTPS enforced (production)
- [ ] No sensitive data in logs

---

## Support & Resources

### Documentation Locations

- **User Guide**: `/USER_GUIDE.md`
- **Architecture**: `/ARCHITECTURE.md`
- **This Guide**: `/DEPLOYMENT.md`

### Common Commands Reference

```bash
# Build
npm run build

# Development server
npm run dev

# Check for updates (if configured)
curl https://updates.internal/api/version

# View logs
tail -f /var/log/nginx/access.log

# Restart service
sudo systemctl restart nginx
```

---

## Emergency Procedures

### System Failure Recovery

1. **Application Crash**:
   - Reload browser page
   - Check console for errors
   - Restart browser if needed

2. **Data Corruption**:
   - Export remaining data
   - Clear browser storage
   - Reimport from backup

3. **Server Failure**:
   - Restore from backup
   - Verify file integrity
   - Restart services

### Rollback Procedure

```bash
# Stop web server
sudo systemctl stop nginx

# Restore previous version
rm -rf /var/www/phishguard
cp -r /var/www/phishguard.backup /var/www/phishguard

# Restart web server
sudo systemctl start nginx

# Verify
curl http://localhost/phishguard
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 12, 2026  
**Deployment Environment**: Critical Infrastructure / Air-Gapped Systems
