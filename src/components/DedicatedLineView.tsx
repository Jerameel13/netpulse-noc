import {
  Activity,
  ArrowDownUp,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NocSystemState } from '../types/network';
import { formatDateTime } from './StatusUtils';

interface DedicatedLineViewProps {
  state: NocSystemState;
  onFailLine: () => void;
  onRecoverLine: () => void;
  onProbeDedicated: () => void;
}

export function DedicatedLineView({
  state,
  onFailLine,
  onRecoverLine,
  onProbeDedicated,
}: DedicatedLineViewProps) {
  const { dedicatedLine } = state;
  const isOffline = dedicatedLine.status === 'Offline';

  return (
    <div className="space-y-6">
      {/* Header Health Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1222] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl border ${
                isOffline
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {isOffline ? <WifiOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-slate-100">
                  Enterprise Dedicated Line ({dedicatedLine.circuitId})
                </h2>
                <span
                  className={`text-xs font-semibold ${
                    isOffline ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {dedicatedLine.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {dedicatedLine.providerName} · {dedicatedLine.subscribedCapacityMbps} Mbps Symmetrical Fiber · Telemetry:{' '}
                {dedicatedLine.telemetrySource === 'LIVE' ? 'Live ICMP Probe' : 'Demo Simulated'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onProbeDedicated}
              className="px-3 py-2 rounded-lg bg-[#111A2E] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              Run Connectivity Probe
            </button>
            {!isOffline ? (
              <button
                onClick={onFailLine}
                className="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs font-medium text-red-300 transition-colors"
              >
                Simulate Line Interruption
              </button>
            ) : (
              <button
                onClick={onRecoverLine}
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors"
              >
                Restore Dedicated Connection
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Line Visual Path Highlight */}
        <div className="mt-5 rounded-lg border border-slate-800 bg-[#060B17] p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3">
            <div className="rounded-lg border border-slate-700 bg-[#0B1222] p-3 text-center">
              <Globe className="w-5 h-5 text-cyan-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-100 mt-1.5">Primary ISP (ISP 1)</div>
              <div className="text-[11px] font-mono text-slate-400">203.177.40.1</div>
            </div>

            <div className="md:col-span-3 flex flex-col items-center gap-1.5 px-2">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>DL: {dedicatedLine.downloadMbps} Mbps</span>
                <span className={isOffline ? 'text-red-400 font-semibold' : 'text-cyan-300 font-semibold'}>
                  {isOffline ? 'CIRCUIT INTERRUPTED' : '99.9% SLA GUARANTEED FIBER'}
                </span>
                <span>UL: {dedicatedLine.uploadMbps} Mbps</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOffline ? 'bg-red-500 w-full' : 'bg-cyan-400 w-full animate-pulse'
                  }`}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-[#0B1222] p-3 text-center">
              <Wifi className="w-5 h-5 text-sky-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-100 mt-1.5">Edge Router (R1)</div>
              <div className="text-[11px] font-mono text-slate-400">10.0.0.1</div>
            </div>
          </div>
        </div>

        {/* Key Line Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="rounded-lg border border-slate-800 bg-[#060B17] p-3">
            <div className="text-xs text-slate-500">SLA Target</div>
            <div className="text-lg font-mono font-bold text-slate-100 tabular-nums mt-1">
              {dedicatedLine.slaTargetPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#060B17] p-3">
            <div className="text-xs text-slate-500">Current Uptime</div>
            <div
              className={`text-lg font-mono font-bold tabular-nums mt-1 ${
                dedicatedLine.currentUptimePct >= dedicatedLine.slaTargetPct
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {dedicatedLine.currentUptimePct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#060B17] p-3">
            <div className="text-xs text-slate-500">Download / Upload</div>
            <div className="text-lg font-mono font-bold text-cyan-400 tabular-nums mt-1">
              {dedicatedLine.downloadMbps} / {dedicatedLine.uploadMbps}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#060B17] p-3">
            <div className="text-xs text-slate-500">Latency / Jitter</div>
            <div className="text-lg font-mono font-bold text-slate-100 tabular-nums mt-1">
              {dedicatedLine.latencyMs} / {dedicatedLine.jitterMs} ms
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#060B17] p-3">
            <div className="text-xs text-slate-500">Packet Loss</div>
            <div
              className={`text-lg font-mono font-bold tabular-nums mt-1 ${
                dedicatedLine.packetLossPct > 1 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {dedicatedLine.packetLossPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#060B17] p-3">
            <div className="text-xs text-slate-500">Health & Failover</div>
            <div className="text-sm font-semibold mt-1.5 flex items-center gap-1.5">
              {dedicatedLine.failoverActive ? (
                <span className="text-amber-400">ISP 2 Active</span>
              ) : (
                <span className="text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Optimal
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Bandwidth & Latency Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0B1222] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Symmetrical Throughput (Mbps)</h3>
              <p className="text-xs text-slate-400">Video conferencing & cloud backup traffic readiness</p>
            </div>
            <ArrowDownUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.dashboardHistory}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} width={38} />
                <Tooltip contentStyle={{ backgroundColor: '#060B17', borderColor: '#1E293B', fontSize: '12px' }} />
                <Area type="monotone" dataKey="bandwidthInMbps" name="Download Mbps" stroke="#22d3ee" fill="#22d3ee25" strokeWidth={2} />
                <Area type="monotone" dataKey="bandwidthOutMbps" name="Upload Mbps" stroke="#3b82f6" fill="#3b82f625" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B1222] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">SLA Availability & Packet Loss</h3>
              <p className="text-xs text-slate-400">99.9% SLA Reference Threshold</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.dashboardHistory}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis domain={[99.5, 100]} stroke="#64748B" fontSize={10} width={42} />
                <Tooltip contentStyle={{ backgroundColor: '#060B17', borderColor: '#1E293B', fontSize: '12px' }} />
                <ReferenceLine y={99.9} stroke="#F59E0B" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="uptimePct" name="Uptime %" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {dedicatedLine.lastOutageAt && (
        <div className="rounded-xl border border-slate-800 bg-[#0B1222] px-5 py-3.5 text-xs text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          Last recorded circuit interruption: <span className="font-mono">{formatDateTime(dedicatedLine.lastOutageAt)}</span>
        </div>
      )}
    </div>
  );
}
