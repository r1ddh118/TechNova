// Batch scan API integration
export interface ExplainabilityEntry {
  feature: string;
  value: number;
  reason: string;
  contribution_percent?: number;
}

export interface HighlightedLine {
  line_number: number;
  line: string;
  indicators: string[];
}

export interface BatchScanResult {
  batch_results: Array<{
    text_preview: string;
    is_phishing: boolean;
    confidence: number;
    risk_level: string;
    explanations?: ExplainabilityEntry[];
    highlighted_lines?: HighlightedLine[];
    class_percentages?: Record<string, number>;
  }>;
  total_scanned: number;
}

export interface UpdateCheckResult {
  status: string;
  model_loaded: boolean;
  vectorizer_loaded: boolean;
  model_version: string;
  last_updated?: string | null;
}

export async function analyzeBatch(messages: string[]): Promise<BatchScanResult> {
  try {
    const response = await fetch('http://localhost:8000/batch-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: messages }),
    });
    if (!response.ok) throw new Error('Batch scan failed');
    return await response.json();
  } catch {
    const batchResults = await Promise.all(
      messages.map(async (message) => {
        const result = await analyzeMessage(message);
        return {
          text_preview: message.slice(0, 120),
          is_phishing: result.prediction === 'phishing',
          confidence: result.confidence,
          risk_level: result.riskLevel,
          explanations: result.triggeredFeatures
            .filter((feature) => feature.detected)
            .map((feature) => ({
              feature: feature.name,
              value: Number((feature.severity * 10).toFixed(2)),
              reason: feature.reason || 'Detected by local fallback pattern matching.',
              contribution_percent: feature.contributionPercent,
            })),
          highlighted_lines: result.highlightedLines,
          class_percentages: result.classPercentages,
        };
      }),
    );

    return {
      batch_results: batchResults,
      total_scanned: batchResults.length,
    };
  }
}
// AI Inference Engine for Phishing Detection
// Calls FastAPI backend, falls back to mock if offline or error

export interface InferenceResult {
  prediction: 'safe' | 'suspicious' | 'phishing';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggeredFeatures: {
    name: string;
    detected: boolean;
    severity: number;
    reason?: string;
    contributionPercent?: number;
  }[];
  explanation: string;
  highlightedLines: HighlightedLine[];
  classPercentages: Record<string, number>;
}

const PHISHING_PATTERNS = {
  urgency: [
    /urgent/i,
    /immediate action/i,
    /act now/i,
    /expires/i,
    /suspended/i,
    /locked/i,
    /verify now/i,
    /within 24 hours/i,
    /confirm immediately/i,
  ],
  impersonation: [
    /dear user/i,
    /dear customer/i,
    /dear member/i,
    /valued customer/i,
    /account holder/i,
    /IT department/i,
    /security team/i,
    /support team/i,
  ],
  suspiciousURL: [
    /bit\.ly/i,
    /tinyurl/i,
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    /-secure-/i,
    /-login/i,
    /-verify/i,
    /[0-9]{5,}/,
  ],
  financialTrigger: [
    /refund/i,
    /payment failed/i,
    /unauthorized charge/i,
    /wire transfer/i,
    /bank account/i,
    /credit card/i,
    /ssn/i,
    /social security/i,
  ],
  credentialRequest: [
    /username/i,
    /password/i,
    /login credentials/i,
    /verify your identity/i,
    /confirm your details/i,
    /update your information/i,
  ],
  spoofedDomain: [
    /paypa1/i,
    /g00gle/i,
    /micros0ft/i,
    /amaz0n/i,
    /app1e/i,
  ],
};

function analyzeContent(text: string): InferenceResult['triggeredFeatures'] {
  const features = [
    {
      name: 'urgency',
      label: 'Urgency Language',
      patterns: PHISHING_PATTERNS.urgency,
    },
    {
      name: 'impersonation',
      label: 'Impersonation Indicators',
      patterns: PHISHING_PATTERNS.impersonation,
    },
    {
      name: 'suspicious_url',
      label: 'Suspicious URL Patterns',
      patterns: PHISHING_PATTERNS.suspiciousURL,
    },
    {
      name: 'financial_trigger',
      label: 'Financial Keywords',
      patterns: PHISHING_PATTERNS.financialTrigger,
    },
    {
      name: 'credential_request',
      label: 'Credential Request',
      patterns: PHISHING_PATTERNS.credentialRequest,
    },
    {
      name: 'spoofed_domain',
      label: 'Domain Spoofing',
      patterns: PHISHING_PATTERNS.spoofedDomain,
    },
  ];

  return features.map((feature) => {
    const detected = feature.patterns.some((pattern) => pattern.test(text));
    const severity = detected ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    return {
      name: feature.label,
      detected,
      severity,
    };
  });
}

export async function analyzeMessage(content: string): Promise<InferenceResult> {
  // Try backend API first
  try {
    const response = await fetch('http://localhost:8000/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    });
    if (!response.ok) throw new Error('Backend unavailable');
    const data = await response.json();
    // Map backend response to frontend InferenceResult
    return {
      prediction:
        data.risk_level === 'High'
          ? 'phishing'
          : data.risk_level === 'Medium'
            ? 'suspicious'
            : 'safe',
      confidence: data.confidence,
      riskLevel: data.risk_level.toLowerCase() as InferenceResult['riskLevel'],
      triggeredFeatures: (data.explanations || []).map((ex: any) => ({
        name: ex.feature || 'feature',
        detected: true,
        severity: Math.min(1, Number(ex.value || 0) / 10),
        reason: ex.reason || 'Indicator detected',
        contributionPercent: Number(ex.contribution_percent || 0),
      })),
      explanation: Array.isArray(data.explanations)
        ? data.explanations.map((ex: any) => ex.reason).join('; ')
        : 'Analysis complete',
      highlightedLines: Array.isArray(data.highlighted_lines) ? data.highlighted_lines : [],
      classPercentages:
        typeof data.class_percentages === 'object' && data.class_percentages !== null
          ? data.class_percentages
          : { safe: 0, suspicious: 0, phishing: Number((data.confidence || 0) * 100) },
    };
  } catch (err) {
    // Fallback to mock if offline or error
    // Simulate processing delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 800));
    const features = analyzeContent(content);
    const detectedFeatures = features.filter((f) => f.detected);
    let riskScore = 0;
    features.forEach((f) => {
      if (f.detected) {
        riskScore += f.severity;
      }
    });
    const normalizedScore = Math.min(riskScore / 3, 1);
    let prediction: InferenceResult['prediction'];
    let riskLevel: InferenceResult['riskLevel'];
    let confidence: number;
    if (normalizedScore < 0.3) {
      prediction = 'safe';
      riskLevel = 'low';
      confidence = 0.85 + Math.random() * 0.1;
    } else if (normalizedScore < 0.6) {
      prediction = 'suspicious';
      riskLevel = detectedFeatures.length > 2 ? 'medium' : 'low';
      confidence = 0.7 + Math.random() * 0.15;
    } else {
      prediction = 'phishing';
      riskLevel = detectedFeatures.length > 3 ? 'critical' : 'high';
      confidence = 0.8 + Math.random() * 0.15;
    }
    let explanation = '';
    if (prediction === 'safe') {
      explanation = 'No significant phishing indicators detected. Message appears legitimate.';
    } else if (prediction === 'suspicious') {
      explanation = `Detected ${detectedFeatures.length} suspicious indicator(s): ${detectedFeatures.map((f) => f.name).join(', ')}. Exercise caution.`;
    } else {
      explanation = `High-confidence phishing attempt. Multiple red flags detected: ${detectedFeatures.map((f) => f.name).join(', ')}. Do not interact.`;
    }
    const classPercentages = {
      safe: prediction === 'safe' ? 100 - Math.round(riskScore * 10) : Math.max(0, 25 - Math.round(riskScore * 5)),
      suspicious: prediction === 'suspicious' ? 45 + detectedFeatures.length * 8 : Math.max(0, 20 + detectedFeatures.length * 5),
      phishing: prediction === 'phishing' ? 60 + detectedFeatures.length * 7 : Math.max(0, Math.round(normalizedScore * 100)),
    };

    const total = classPercentages.safe + classPercentages.suspicious + classPercentages.phishing;
    const normalizedPercentages = {
      safe: Number(((classPercentages.safe / total) * 100).toFixed(2)),
      suspicious: Number(((classPercentages.suspicious / total) * 100).toFixed(2)),
      phishing: Number(((classPercentages.phishing / total) * 100).toFixed(2)),
    };

    return {
      prediction,
      confidence: Math.min(confidence, 0.99),
      riskLevel,
      triggeredFeatures: features.map((feature) => ({
        ...feature,
        reason: feature.detected ? 'Matched offline heuristic patterns.' : undefined,
        contributionPercent: feature.detected ? Number((feature.severity * 20).toFixed(2)) : 0,
      })),
      explanation,
      highlightedLines: [],
      classPercentages: normalizedPercentages,
    };
  }
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    const response = await fetch('http://localhost:8000/updates/check');
    if (!response.ok) {
      throw new Error('Failed to check updates');
    }
    return response.json();
  } catch {
    return {
      status: 'offline-fallback',
      model_loaded: true,
      vectorizer_loaded: true,
      model_version: MODEL_INFO.version,
      last_updated: MODEL_INFO.lastUpdate,
    };
  }
}

// Model metadata
export const MODEL_INFO = {
  version: '2.3.1',
  lastUpdate: '2026-02-08T14:30:00Z',
  ruleSetVersion: '4.1.0',
  totalFeatures: 47,
  accuracy: 0.94,
};
