import { useMemo, useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Scan,
  FileText,
  Upload,
  Trash2,
  Flag,
  Save,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { analyzeMessage, analyzeBatch, BatchScanResult } from '../lib/ai-engine';
import type { InferenceResult } from '../lib/ai-engine';
import { saveScan } from '../lib/db';
import { toast } from 'sonner';

export default function ThreatScanConsole() {
const [inputText, setInputText] = useState('');
const [isScanning, setIsScanning] = useState(false);
const [result, setResult] = useState<InferenceResult | null>(null);
const [messageType, setMessageType] = useState<'email' | 'sms' | 'chat'>('email');
const [batchMode, setBatchMode] = useState(false);
const [batchResults, setBatchResults] = useState<BatchScanResult | null>(null);
const [batchInput, setBatchInput] = useState<string[]>([]);

const handleScan = async () => {
  if (batchMode) {
    if (batchInput.length === 0) {
      toast.error('Please upload or enter messages for batch scan');
      return;
    }
    setIsScanning(true);
    setBatchResults(null);
    try {
      const res = await analyzeBatch(batchInput);
      setBatchResults(res);
      setSelectedBatchResult(0);
    } catch (error) {
      toast.error('Batch scan failed.');
    } finally {
      setIsScanning(false);
    }
  } else {
    if (!inputText.trim()) {
      toast.error('Please enter content to scan');
      return;
    }
    setIsScanning(true);
    try {
      const scanResult = await analyzeMessage(inputText);
      setResult(scanResult);
    } catch (error) {
      toast.error('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }
};

const handleClear = () => {
  setInputText('');
  setResult(null);
};

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (batchMode) {
        // Split by lines, filter empty
        setBatchInput(text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0));
      } else {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  }
};

const handleDownloadReport = () => {
  if (!result) return;

  const data = {
    messageType,
    content: inputText,
    verdict: result.prediction,
    confidence: result.confidence,
    riskLevel: result.riskLevel,
    triggeredFeatures: result.triggeredFeatures
      .filter(f => f.detected)
      .map(f => f.name),
    timestamp: new Date(),
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `scan-report-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

const handleSaveToLog = async () => {
  if (!result) return;

  try {
    await saveScan({
      id: `scan-${Date.now()}`,
      timestamp: new Date(),
      messageType,
      content: inputText,
      verdict: result.prediction,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      triggeredFeatures: result.triggeredFeatures
        .filter(f => f.detected)
        .map(f => f.name),
      explainability: {
        explanations: result.triggeredFeatures
          .filter((feature) => feature.detected)
          .map((feature) => ({
            feature: feature.name,
            value: Number((feature.severity * 10).toFixed(2)),
            reason: feature.reason || result.explanation,
            contribution_percent: feature.contributionPercent || 0,
          })),
        highlighted_lines: result.highlightedLines,
        class_percentages: result.classPercentages,
      },
      operatorDecision: 'pending',
    });
    toast.success('Scan saved to history');
  } catch (error) {
    toast.error('Failed to save scan');
  }
};


const handleMarkIncident = async () => {
  if (!result) return;

  try {
    await saveScan({
      id: `scan-${Date.now()}`,
      timestamp: new Date(),
      messageType,
      content: inputText,
      verdict: result.prediction,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      triggeredFeatures: result.triggeredFeatures
        .filter(f => f.detected)
        .map(f => f.name),
      explainability: {
        explanations: result.triggeredFeatures
          .filter((feature) => feature.detected)
          .map((feature) => ({
            feature: feature.name,
            value: Number((feature.severity * 10).toFixed(2)),
            reason: feature.reason || result.explanation,
            contribution_percent: feature.contributionPercent || 0,
          })),
        highlighted_lines: result.highlightedLines,
        class_percentages: result.classPercentages,
      },
      operatorDecision: 'incident',
    });
    toast.success('Marked as security incident');
  } catch (error) {
    toast.error('Failed to mark incident');
  }
};

const getVerdictConfig = (verdict: string) => {
  switch (verdict) {
    case 'safe':
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        label: 'SAFE',
      };
    case 'suspicious':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        label: 'SUSPICIOUS',
      };
    case 'phishing':
      return {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: 'PHISHING',
      };
    default:
      return {
        icon: Shield,
        color: 'text-zinc-500',
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/20',
        label: 'UNKNOWN',
      };
  }
};

const getRiskConfig = (risk: string) => {
  switch (risk) {
    case 'low':
      return { color: 'text-green-500', bg: 'bg-green-500' };
    case 'medium':
      return { color: 'text-yellow-500', bg: 'bg-yellow-500' };
    case 'high':
      return { color: 'text-orange-500', bg: 'bg-orange-500' };
    case 'critical':
      return { color: 'text-red-500', bg: 'bg-red-500' };
    default:
      return { color: 'text-zinc-500', bg: 'bg-zinc-500' };
  }
};


const formatBatchRisk = (riskLevel: string) => {
  const normalized = String(riskLevel || '').toLowerCase();
  if (normalized === 'critical') return 'Critical';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return 'Unknown';
};

const [selectedBatchResult, setSelectedBatchResult] = useState<number | null>(null);

const activeBatchResult = useMemo(() => {
  if (!batchResults || batchResults.batch_results.length === 0) return null;
  const index = selectedBatchResult ?? 0;
  return batchResults.batch_results[index] || null;
}, [batchResults, selectedBatchResult]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Threat Scan Console</h1>
          <p className="text-sm text-zinc-500">
            Analyze messages for phishing indicators using on-device AI
          </p>
        </div>

        <div className="mb-4 flex gap-4 items-center">
          <label className="text-sm font-medium">Scan Mode:</label>
          <Button
            variant={batchMode ? "outline" : "default"}
            size="sm"
            onClick={() => setBatchMode(false)}
            disabled={isScanning}
          >
            Single
          </Button>
          <Button
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => setBatchMode(true)}
            disabled={isScanning}
          >
            Batch
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <div className="space-y-4">
              {!batchMode ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Input Message</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setMessageType('email')}
                        disabled={isScanning}
                      >
                        <FileText className={`w-3 h-3 mr-1 ${messageType === 'email' ? 'text-red-500' : ''}`} />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setMessageType('sms')}
                        disabled={isScanning}
                      >
                        SMS
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setMessageType('chat')}
                        disabled={isScanning}
                      >
                        Chat
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste email content, SMS text, or message here..."
                    className="min-h-[300px] bg-zinc-950 border-zinc-700 text-zinc-100 resize-none font-mono text-sm"
                    disabled={isScanning}
                  />
                </>
              ) : (
                <>
                  <label className="text-sm font-medium">Batch Input</label>
                  <div className="space-y-2">
                    {batchInput.map((msg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={msg}
                          onChange={e => {
                            const updated = [...batchInput];
                            updated[idx] = e.target.value;
                            setBatchInput(updated);
                          }}
                          placeholder={`Message #${idx + 1}`}
                          className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm font-mono"
                          disabled={isScanning}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700"
                          onClick={() => setBatchInput(batchInput.filter((_, i) => i !== idx))}
                          disabled={isScanning}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700"
                      onClick={() => setBatchInput([...batchInput, ''])}
                      disabled={isScanning}
                    >
                      + Add Message
                    </Button>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleScan}
                  disabled={isScanning || (!batchMode ? !inputText.trim() : batchInput.length === 0)}
                >
                  {isScanning ? (
                    <>
                      <Scan className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Scan for Threats
                    </>
                  )}
                </Button>

                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    className="border-zinc-700"
                    disabled={isScanning}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                    </span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.eml"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isScanning}
                  />
                </label>

                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={handleClear}
                  disabled={isScanning}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Results Section */}
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            {!batchMode ? (
              !result ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-zinc-600">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No scan results yet</p>
                    <p className="text-xs mt-1">Enter content and click \"Scan for Threats\"</p>
                  </div>
                </div>
              ) : (
                // ...existing single scan result UI...
                <div className="space-y-6">
                  {/* Verdict */}
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-3 block">
                      Threat Verdict
                    </label>
                    <div className={`p-4 rounded-lg border ${getVerdictConfig(result.prediction).bg} ${getVerdictConfig(result.prediction).border}`}>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = getVerdictConfig(result.prediction).icon;
                          return <Icon className={`w-8 h-8 ${getVerdictConfig(result.prediction).color}`} />;
                        })()}
                        <div>
                          <p className={`text-xl font-semibold ${getVerdictConfig(result.prediction).color}`}>
                            {getVerdictConfig(result.prediction).label}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {result.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Level */}
                  {/* Threat Probabilities */}
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                      Model Explainability
                    </label>
                    <div className="space-y-2">
                      {Object.entries(result.classPercentages).map(([label, percent]) => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400 capitalize">{label}</span>
                            <span className="text-zinc-300">{Number(percent).toFixed(1)}%</span>
                          </div>
                          <Progress value={Number(percent)} className="h-1.5 bg-zinc-800" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                      Risk Level
                    </label>
                    <Badge 
                      className={`${getRiskConfig(result.riskLevel).color} ${getRiskConfig(result.riskLevel).bg} border-0 px-3 py-1 text-xs font-semibold uppercase`}
                    >
                      {result.riskLevel}
                    </Badge>
                  </div>

                  {/* Triggered Features */}
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-3 block">
                      Detected Indicators
                    </label>
                    <div className="space-y-2">
                      {result.triggeredFeatures.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded border ${
                            feature.detected
                              ? 'bg-red-500/5 border-red-500/20'
                              : 'bg-zinc-800/50 border-zinc-800'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-sm ${feature.detected ? 'text-red-400' : 'text-zinc-600'}`}>
                              {feature.name}
                            </span>
                            {feature.detected && feature.reason && (
                              <span className="text-[11px] text-zinc-400 mt-1">
                                {feature.reason} ({(feature.contributionPercent || 0).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                          {feature.detected && (
                            <Badge variant="destructive" className="text-xs">
                              DETECTED
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlighted Content */}
                  {result.highlightedLines.length > 0 && (
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-wider mb-3 block">
                        Highlighted Suspicious Lines
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.highlightedLines.map((line) => (
                          <div key={`${line.line_number}-${line.line}`} className="p-2 rounded border border-red-500/30 bg-red-500/5">
                            <div className="text-[11px] text-red-300 mb-1">Line {line.line_number} · {line.indicators.join(', ')}</div>
                            <div className="text-xs text-zinc-200 font-mono">{line.line}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-zinc-800">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleMarkIncident}
                      className="flex-1"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Mark as Incident
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveToLog}
                      className="border-zinc-700"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700"
                        onClick={handleDownloadReport}
                          >
                          <Download className="w-4 h-4" />
                          </Button>

                  </div>
                </div>
              )
            ) : (
              !batchResults ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-zinc-600">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No batch scan results yet</p>
                    <p className="text-xs mt-1">Upload or enter multiple messages and click \"Scan for Threats\"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider mb-3 block">
                    Batch Scan Results ({batchResults.total_scanned})
                  </label>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {batchResults.batch_results.map((res, idx) => (
                      <div key={idx} onClick={() => setSelectedBatchResult(idx)} className={`p-3 rounded border bg-zinc-900 flex flex-col gap-1 cursor-pointer ${selectedBatchResult === idx ? 'border-red-500/60' : 'border-zinc-800'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-400 flex-1 truncate">{res.text_preview}</span>
                          <Badge className={res.is_phishing ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}>
                            {res.is_phishing ? 'Phishing' : 'Safe'}
                          </Badge>
                          <span className="text-xs text-zinc-400 ml-2">{(res.confidence * 100).toFixed(1)}%</span>
                          <Badge className={`ml-2 ${formatBatchRisk(res.risk_level) === 'High' || formatBatchRisk(res.risk_level) === 'Critical' ? 'bg-red-500' : formatBatchRisk(res.risk_level) === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                            {formatBatchRisk(res.risk_level)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeBatchResult && (
                    <div className="mt-3 p-3 rounded border border-zinc-800 bg-zinc-950 space-y-3">
                      <p className="text-xs uppercase tracking-wider text-zinc-500">Selected message explainability</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {Object.entries(activeBatchResult.class_percentages || {}).map(([label, percent]) => (
                          <div key={label} className="p-2 rounded border border-zinc-800 bg-zinc-900">
                            <p className="text-[11px] text-zinc-500 capitalize">{label}</p>
                            <p className="text-sm font-semibold">{Number(percent).toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Indicators</p>
                        {(activeBatchResult.explanations || []).length === 0 ? (
                          <p className="text-xs text-zinc-500">No indicator explanations for this message.</p>
                        ) : (
                          (activeBatchResult.explanations || []).map((item, itemIndex) => (
                            <div key={`${item.feature}-${itemIndex}`} className="p-2 rounded border border-zinc-800 bg-zinc-900">
                              <p className="text-xs text-zinc-200">{item.feature || 'Indicator'}</p>
                              <p className="text-[11px] text-zinc-400 mt-1">{item.reason || 'No reason provided'}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Highlighted suspicious lines</p>
                        {(activeBatchResult.highlighted_lines || []).length === 0 ? (
                          <p className="text-xs text-zinc-500">No lines highlighted for this message.</p>
                        ) : (
                          (activeBatchResult.highlighted_lines || []).map((line) => (
                            <div key={`${line.line_number}-${line.line}`} className="p-2 rounded border border-red-500/30 bg-red-500/5">
                              <p className="text-[11px] text-red-300 mb-1">Line {line.line_number} · {line.indicators.join(', ')}</p>
                              <p className="text-xs text-zinc-200 font-mono">{line.line}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
