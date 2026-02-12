import { useEffect, useState } from 'react';
import { 
  Download, 
  Search, 
  Filter,
  Mail,
  MessageSquare,
  FileText,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { getAllScans, exportScansToCSV, deleteScan } from '../lib/db';
import type { ScanRecord } from '../lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function ScanHistory() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, []);

  useEffect(() => {
    filterScans();
  }, [scans, searchQuery, verdictFilter, riskFilter]);

  const loadScans = async () => {
    try {
      const data = await getAllScans();
      // Sort by most recent first
      const sorted = data.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setScans(sorted);
    } catch (error) {
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const filterScans = () => {
    let filtered = [...scans];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(scan =>
        scan.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.triggeredFeatures.some(f => 
          f.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Verdict filter
    if (verdictFilter !== 'all') {
      filtered = filtered.filter(scan => scan.verdict === verdictFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(scan => scan.riskLevel === riskFilter);
    }

    setFilteredScans(filtered);
  };

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
    try {
      await deleteScan(id);
      await loadScans();
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
        return <Badge variant="outline" className="border-green-500 text-green-500">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="border-red-500 text-red-500">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision || decision === 'pending') {
      return <Badge variant="outline" className="border-zinc-700 text-zinc-500">Pending</Badge>;
    }
    if (decision === 'incident') {
      return <Badge variant="destructive">Incident</Badge>;
    }
    if (decision === 'false-positive') {
      return <Badge variant="outline" className="border-blue-500 text-blue-500">False Positive</Badge>;
    }
    return null;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Offline Scan History</h1>
              <p className="text-sm text-zinc-500">
                Forensic audit log of all threat scans (stored locally)
              </p>
            </div>
            <Button onClick={handleExport} className="bg-red-600 hover:bg-red-700">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Total Scans</p>
            <p className="text-2xl font-semibold">{scans.length}</p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Phishing Detected</p>
            <p className="text-2xl font-semibold text-red-500">
              {scans.filter(s => s.verdict === 'phishing').length}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Suspicious</p>
            <p className="text-2xl font-semibold text-yellow-500">
              {scans.filter(s => s.verdict === 'suspicious').length}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Safe</p>
            <p className="text-2xl font-semibold text-green-500">
              {scans.filter(s => s.verdict === 'safe').length}
            </p>
          </Card>
        </div>

        {/* Table */}
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
                    <TableCell className="text-sm">
                      {(scan.confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>{getDecisionBadge(scan.operatorDecision)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(scan.id)}
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
