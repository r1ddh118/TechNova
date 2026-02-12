# PhishGuard AI - User Guide

## Quick Start

PhishGuard AI is an offline-capable security tool for detecting phishing attempts in emails, SMS, and messages. This guide will help you use the system effectively.

---

## Screen 1: Threat Scan Console

**Purpose**: Analyze suspicious messages in real-time

### How to Scan a Message

1. **Select Message Type**
   - Click **Email**, **SMS**, or **Chat** button
   - This helps the AI adjust its analysis

2. **Enter Content**
   - **Option A**: Paste message text into the large text box
   - **Option B**: Click the upload icon and select a .txt or .eml file

3. **Run Scan**
   - Click the red **"Scan for Threats"** button
   - Wait 1-2 seconds for analysis

4. **Review Results**
   - **Verdict**: Safe (green), Suspicious (yellow), or Phishing (red)
   - **Confidence**: Percentage showing AI certainty
   - **Risk Level**: Low, Medium, High, or Critical
   - **Detected Indicators**: List of red flags found

### Understanding the Verdict

#### 🟢 SAFE
- No significant phishing indicators detected
- Message appears legitimate
- You can proceed normally

#### 🟡 SUSPICIOUS
- 1-2 phishing indicators found
- Exercise caution
- Verify sender through alternate channel
- Do NOT click links yet

#### 🔴 PHISHING
- 3+ phishing indicators detected
- High-confidence threat
- **DO NOT INTERACT** with the message
- Report to security team immediately

### Taking Action

**Mark as Incident**
- Use for confirmed phishing attempts
- Saves to history with "Incident" flag
- Prioritizes for review

**Save to Log**
- Stores scan for future reference
- Maintains audit trail
- Can be exported later

**Export Report**
- Downloads scan details as PDF/CSV
- Useful for incident reports

**Clear**
- Removes current input
- Resets the console
- Previous scans remain in history

---

## Screen 2: Scan History

**Purpose**: Forensic review of all scans

### Viewing Past Scans

The history table shows:
- **Timestamp**: When scan was performed
- **Type**: Email, SMS, or Chat
- **Content Preview**: First 60 characters
- **Verdict**: Safe/Suspicious/Phishing
- **Risk**: Low/Medium/High/Critical
- **Confidence**: AI certainty percentage
- **Decision**: Operator action taken

### Filtering Scans

**Search Bar**
- Enter keywords to find specific scans
- Searches message content and features

**Verdict Filter**
- Show only Safe, Suspicious, or Phishing
- Default: All Verdicts

**Risk Filter**
- Filter by Low, Medium, High, Critical
- Default: All Risk Levels

### Summary Cards

Top of screen shows:
- **Total Scans**: All-time scan count
- **Phishing Detected**: Total threats found
- **Suspicious**: Messages needing review
- **Safe**: Legitimate messages

### Exporting Data

**Export CSV Button**
- Downloads complete audit log
- Includes all scan details
- Compatible with Excel/Google Sheets
- Filename: `phishing-scan-log-YYYY-MM-DD-HHMM.csv`

---

## Screen 3: Threat Analytics

**Purpose**: Understand threat patterns over time

### Key Metrics (Top Cards)

1. **Scans Today**
   - Number of scans in last 24 hours
   - Resets at midnight

2. **Phishing Detected**
   - Total phishing attempts today
   - Red alert if > 0

3. **Safe Messages**
   - Percentage of legitimate messages
   - Higher is better

4. **Critical Threats**
   - Highest-risk scans
   - Require immediate attention

### Charts and Graphs

#### 7-Day Threat Trend (Line Chart)
- Shows phishing, suspicious, and safe trends
- Helps identify attack campaigns
- X-axis: Dates
- Y-axis: Count

#### Verdict Distribution (Pie Chart)
- Visual breakdown of all verdicts
- Green: Safe
- Yellow: Suspicious
- Red: Phishing

#### Top Detected Indicators (Bar Chart)
- Most common phishing tactics
- Ranked by frequency
- Helps identify attacker methods

#### Risk Level Distribution (Bar Chart)
- Shows risk severity spread
- Useful for prioritizing reviews

### Using Analytics for Security

**Daily Review Checklist**:
1. Check if phishing count increased
2. Review critical threats
3. Identify new attack patterns
4. Export data for weekly reports

**Weekly Tasks**:
1. Analyze trend chart for patterns
2. Share top indicators with team
3. Update training based on tactics

---

## Screen 4: System Status

**Purpose**: Monitor system health and updates

### Connection Status

**Online (Green)**
- Connected to network
- Updates available
- Can check for new rules

**Offline (Yellow)**
- No internet connection
- All core features work
- Updates unavailable

### System Components

All components should show **"Operational"** status:

1. **AI Model**
   - Version number
   - Core detection engine

2. **Local Database**
   - IndexedDB storage
   - Scan history storage

3. **Rule Set**
   - Phishing pattern database
   - Version number

4. **Service Worker**
   - Offline functionality
   - Cache management

### Model Information Panel

- **Model Version**: Current AI version
- **Rule Set**: Pattern database version
- **Total Features**: Number of indicators
- **Accuracy**: Model performance rating
- **Last Updated**: Last successful update

### Local Storage Panel

- **Database Type**: IndexedDB
- **Total Scans**: Stored scan count
- **Database Size**: Storage used in KB
- **Storage Used**: Progress bar of quota

### Update Controls

**Check for Updates**
- Click to query update server
- Requires internet connection
- Shows available updates

**Apply Secure Update**
- Installs verified updates
- Only works when online
- System remains functional during update

### System Integrity Panel

Four security checks:
- ✅ Model Verified
- ✅ Database Healthy
- ✅ Rules Current
- ✅ No Errors

All should show green checkmarks.

---

## Best Practices

### For Operators

1. **Always scan before clicking links**
   - Even from known senders
   - Especially with urgent language

2. **Mark incidents immediately**
   - Don't wait for confirmation
   - Better safe than sorry

3. **Review history weekly**
   - Look for patterns
   - Share findings with team

4. **Export logs monthly**
   - For compliance
   - Backup critical data

### For Security Teams

1. **Monitor analytics daily**
   - Check for attack campaigns
   - Identify trends early

2. **Update rules monthly**
   - New phishing tactics emerge
   - Keep model current

3. **Train on real examples**
   - Use detected phishing for training
   - Show explainable AI results

4. **Maintain offline capability**
   - Test without internet regularly
   - Ensure critical infrastructure readiness

---

## Common Indicators Explained

### Urgency Language
- "Act now", "Immediate action required"
- "Account will be suspended"
- "Expires in 24 hours"
**Why it matters**: Creates panic to bypass judgment

### Impersonation
- Generic greetings: "Dear user", "Dear customer"
- Fake authority: "IT Department", "Security Team"
**Why it matters**: Real companies use your name

### Suspicious URL
- Shortened links (bit.ly, tinyurl)
- IP addresses instead of domains
- Lots of numbers in domain
**Why it matters**: Hides true destination

### Financial Trigger
- "Refund available", "Payment failed"
- "Unauthorized charge detected"
- "Wire transfer", "Bank account"
**Why it matters**: Creates urgency around money

### Credential Request
- Asking for username/password
- "Verify your identity"
- "Confirm your details"
**Why it matters**: Legitimate companies never ask this way

### Domain Spoofing
- paypa1.com instead of paypal.com
- g00gle.com instead of google.com
- micros0ft.com instead of microsoft.com
**Why it matters**: Looks real at quick glance

---

## Troubleshooting

### Issue: Scan button disabled
**Solution**: Enter text or upload a file first

### Issue: "Offline Mode" showing
**Solution**: This is normal! All features still work

### Issue: Can't export CSV
**Solution**: Check browser download permissions

### Issue: Database full warning
**Solution**: 
1. Go to Scan History
2. Delete old scans
3. Or export and clear history

### Issue: Slow performance
**Solution**:
1. Close other browser tabs
2. Clear browser cache
3. Delete old scan history

### Issue: Update failed
**Solution**:
1. Check internet connection
2. Try again later
3. Contact system admin if persistent

---

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus search in History
- **Ctrl/Cmd + N**: New scan (clears console)
- **Ctrl/Cmd + S**: Save current scan
- **Ctrl/Cmd + E**: Export history

---

## Privacy & Security Notes

### Data Storage
- All data stored **locally** on your device
- No cloud synchronization
- IndexedDB database in browser

### Data Security
- Data persists until manually deleted
- Shared devices: Use private/incognito mode
- Production systems: Data is encrypted

### What's Collected
- Message content (for analysis)
- Scan results and timestamps
- Operator decisions
- **NOT** collected: Personal info, credentials

### Data Deletion
1. Go to Scan History
2. Click trash icon on specific scans
3. Or clear browser data to delete all

---

## Support & Feedback

### Reporting False Positives
If a safe message is marked as phishing:
1. Note the scan ID
2. Review triggered indicators
3. Report to security team
4. They can update rules

### Reporting False Negatives
If phishing is marked as safe:
1. Mark as Incident anyway
2. Note what indicators were missed
3. Report to security team
4. Critical for model improvement

### Feature Requests
Contact your security team with:
- What feature you need
- Why it would help
- How you'd use it

---

## Compliance & Audit

### Audit Trail
Every scan creates a record with:
- Exact timestamp
- Full message content
- AI verdict and confidence
- Operator decision
- All metadata

### Retention Policy
Default: Indefinite
Recommended: 90 days minimum
Check your organization's policy

### Compliance Features
- Complete scan history
- CSV export for reporting
- Immutable timestamps
- Operator attribution (future)

---

**Need Help?**
Contact your IT security team or system administrator.

**Document Version**: 1.0.0  
**Last Updated**: February 12, 2026
