import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Search,
  Filter,
  Mail,
  MessageSquare,
  FileText,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { getAllScans, exportScansToCSV, deleteScan } from '../lib/db';
import type { ScanRecord } from '../lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApiHistoryRecord {
  id: number;
  created_at: string;
  mode: string;
  text_preview: string;
  risk_level: string;
  confidence: number;
  rule_score: number;
  explanations: Array<{ feature?: string; reason?: string }>;
}

export function ScanHistory() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void loadScans();

    const interval = window.setInterval(() => {
      void loadScans(true);
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const toRiskLevel = (riskLevel: string): ScanRecord['riskLevel'] => {
    const normalized = riskLevel.toLowerCase();
    if (normalized === 'critical') return 'critical';
    if (normalized === 'high') return 'high';
    if (normalized === 'medium') return 'medium';
    return 'low';
  };

  const toVerdict = (riskLevel: string, confidence: number): ScanRecord['verdict'] => {
    const normalized = riskLevel.toLowerCase();
    if (normalized === 'high' || normalized === 'critical') return 'phishing';
    if (normalized === 'medium' || confidence >= 0.5) return 'suspicious';
    return 'safe';
  };

  const loadApiHistory = async (): Promise<ScanRecord[]> => {
    const response = await fetch('http://localhost:8000/history?limit=200');
    if (!response.ok) {
      throw new Error('History API unavailable');
    }

    const data = (await response.json()) as ApiHistoryRecord[];
    return data.map((item) => ({
      id: `api-${item.id}`,
      timestamp: new Date(item.created_at),
      messageType: item.mode === 'batch' ? 'chat' : 'email',
      content: item.text_preview,
      verdict: toVerdict(item.risk_level, item.confidence),
      confidence: item.confidence,
      riskLevel: toRiskLevel(item.risk_level),
      triggeredFeatures: item.explanations
        .map((explanation) => explanation.feature || explanation.reason)
        .filter((value): value is string => Boolean(value)),
      operatorDecision: 'pending',
    }));
  };

  const loadScans = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [local, remote] = await Promise.allSettled([getAllScans(), loadApiHistory()]);
      const localScans = local.status === 'fulfilled' ? local.value : [];
      const remoteScans = remote.status === 'fulfilled' ? remote.value : [];

      if (local.status === 'rejected' && remote.status === 'rejected' && !silent) {
        toast.error('Failed to load scan history');
      }

      const merged = [...localScans, ...remoteScans].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setScans(merged);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredScans = useMemo(() => {
    let filtered = [...scans];

    if (searchQuery) {
      filtered = filtered.filter(
        (scan) =>
          scan.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          scan.triggeredFeatures.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    if (verdictFilter !== 'all') {
      filtered = filtered.filter((scan) => scan.verdict === verdictFilter);
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter((scan) => scan.riskLevel === riskFilter);
    }

    return filtered;
  }, [scans, searchQuery, verdictFilter, riskFilter]);

  const handleExport = async () => {
    try {
      const csv = await exportScansToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phishing-scan-log-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Scan history exported');
    } catch (error) {
      toast.error('Failed to export scan history');
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('api-')) {
      toast.info('Backend audit records are read-only from UI');
      return;
    }

    try {
      await deleteScan(id);
      await loadScans(true);
      toast.success('Scan deleted');
    } catch (error) {
      toast.error('Failed to delete scan');
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return <Badge className="bg-green-500 text-white border-0">Safe</Badge>;
      case 'suspicious':
        return <Badge className="bg-yellow-500 text-white border-0">Suspicious</Badge>;
      case 'phishing':
        return <Badge className="bg-red-500 text-white border-0">Phishing</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Low
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Medium
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            High
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Critical
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision || decision === 'pending') {
      return (
        <Badge variant="outline" className="border-zinc-700 text-zinc-500">
          Pending
        </Badge>
      );
    }
    if (decision === 'incident') {
      return <Badge variant="destructive">Incident</Badge>;
    }
    if (decision === 'false-positive') {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          False Positive
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Offline + Backend Scan History</h1>
              <p className="text-sm text-zinc-500">Live audit log with 10s auto-refresh</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => void loadScans(true)}
                disabled={isRefreshing}
                className="border-zinc-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExport} className="bg-red-600 hover:bg-red-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-4 bg-zinc-900 border-zinc-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="pl-10 bg-zinc-950 border-zinc-700"
                />
              </div>
            </div>

            <Select value={verdictFilter} onValueChange={setVerdictFilter}>
              <SelectTrigger className="bg-zinc-950 border-zinc-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Verdict" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="phishing">Phishing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="bg-zinc-950 border-zinc-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Total Scans</p>
            <p className="text-2xl font-semibold">{scans.length}</p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Phishing Detected</p>
            <p className="text-2xl font-semibold text-red-500">
              {scans.filter((s) => s.verdict === 'phishing').length}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Suspicious</p>
            <p className="text-2xl font-semibold text-yellow-500">
              {scans.filter((s) => s.verdict === 'suspicious').length}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Safe</p>
            <p className="text-2xl font-semibold text-green-500">
              {scans.filter((s) => s.verdict === 'safe').length}
            </p>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900">
                <TableHead className="text-zinc-400">Timestamp</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Content Preview</TableHead>
                <TableHead className="text-zinc-400">Verdict</TableHead>
                <TableHead className="text-zinc-400">Risk</TableHead>
                <TableHead className="text-zinc-400">Confidence</TableHead>
                <TableHead className="text-zinc-400">Decision</TableHead>
                <TableHead className="text-zinc-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                    Loading scan history...
                  </TableCell>
                </TableRow>
              ) : filteredScans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                    No scans found
                  </TableCell>
                </TableRow>
              ) : (
                filteredScans.map((scan) => (
                  <TableRow key={scan.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-xs text-zinc-400">
                      {format(new Date(scan.timestamp), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-zinc-400">
                        {getMessageIcon(scan.messageType)}
                        <span className="text-xs capitalize">{scan.messageType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-zinc-300">
                      {scan.content.substring(0, 60)}...
                    </TableCell>
                    <TableCell>{getVerdictBadge(scan.verdict)}</TableCell>
                    <TableCell>{getRiskBadge(scan.riskLevel)}</TableCell>
                    <TableCell className="text-sm">{(scan.confidence * 100).toFixed(0)}%</TableCell>
                    <TableCell>{getDecisionBadge(scan.operatorDecision)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(scan.id)}
                        className="text-zinc-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
