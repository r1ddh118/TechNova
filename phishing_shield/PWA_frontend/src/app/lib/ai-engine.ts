// Mock AI Inference Engine for Phishing Detection
// In production, this would call a TensorFlow.js or ONNX model

export interface InferenceResult {
  prediction: 'safe' | 'suspicious' | 'phishing';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggeredFeatures: {
    name: string;
    detected: boolean;
    severity: number;
  }[];
  explanation: string;
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

  return features.map(feature => {
    const detected = feature.patterns.some(pattern => pattern.test(text));
    const severity = detected ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3;
    return {
      name: feature.label,
      detected,
      severity,
    };
  });
}

export async function analyzeMessage(content: string): Promise<InferenceResult> {
  // Simulate processing delay for realistic UX
  await new Promise(resolve => setTimeout(resolve, 800));

  const features = analyzeContent(content);
  const detectedFeatures = features.filter(f => f.detected);
  
  // Calculate risk score
  let riskScore = 0;
  features.forEach(f => {
    if (f.detected) {
      riskScore += f.severity;
    }
  });

  const normalizedScore = Math.min(riskScore / 3, 1);

  // Determine prediction
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

  // Generate explanation
  let explanation = '';
  if (prediction === 'safe') {
    explanation = 'No significant phishing indicators detected. Message appears legitimate.';
  } else if (prediction === 'suspicious') {
    explanation = `Detected ${detectedFeatures.length} suspicious indicator(s): ${detectedFeatures.map(f => f.name).join(', ')}. Exercise caution.`;
  } else {
    explanation = `High-confidence phishing attempt. Multiple red flags detected: ${detectedFeatures.map(f => f.name).join(', ')}. Do not interact.`;
  }

  return {
    prediction,
    confidence: Math.min(confidence, 0.99),
    riskLevel,
    triggeredFeatures: features,
    explanation,
  };
}

// Model metadata
export const MODEL_INFO = {
  version: '2.3.1',
  lastUpdate: '2026-02-08T14:30:00Z',
  ruleSetVersion: '4.1.0',
  totalFeatures: 47,
  accuracy: 0.94,
};
