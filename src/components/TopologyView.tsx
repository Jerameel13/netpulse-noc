import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Handle,
  MiniMap,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import {
  Activity,
  AlertTriangle,
  CloudUpload,
  Filter,
  Image as ImageIcon,
  Layers,
  RotateCcw,
  Search,
  ServerCrash,
  ShieldAlert,
  Wrench,
  X,
  ZapOff,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { NetworkDevice, NetworkLink, NocSystemState } from '../types/network';
import { DeviceTypeIcon, getStatusLabel, getStatusTextColor, StatusIcon } from './StatusUtils';

interface DeviceNodeData extends Record<string, unknown> {
  device: NetworkDevice;
  isSelected: boolean;
  isSearchMatch: boolean;
  backupInProgress: boolean;
  backupProgressPct: number;
  onSelect: (id: string) => void;
}

interface CustomLinkData extends Record<string, unknown> {
  link: NetworkLink;
  backupInProgress: boolean;
}

function NetworkDeviceNode({ data }: NodeProps<Node<DeviceNodeData>>) {
  const { device, isSelected, isSearchMatch, backupInProgress, backupProgressPct, onSelect } = data;

  const isOffline = device.status === 'offline';
  const isWarning = device.status === 'warning';
  const isStandby = device.status === 'standby';
  const isDedicated = device.type === 'dedicated-line';
  const isBackupNode =
    device.id === 'main-file-server' ||
    device.id === 'backup-server' ||
    device.id === 'cloud-storage';

  const borderStyle = isOffline
    ? 'border-red-500 bg-red-950/35 shadow-[0_0_24px_rgba(239,68,68,0.22)]'
    : isWarning
    ? 'border-amber-500/80 bg-amber-950/25 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
    : isDedicated
    ? 'border-cyan-400/80 bg-[#0B172C] shadow-[0_0_24px_rgba(34,211,238,0.2)]'
    : isStandby
    ? 'border-dashed border-cyan-500/50 bg-[#081224]'
    : isSelected || isSearchMatch
    ? 'border-cyan-400 bg-[#111D35] ring-2 ring-cyan-400/30'
    : 'border-slate-700/80 bg-[#0B1222] hover:border-cyan-500/60';

  return (
    <div
      onClick={() => onSelect(device.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(device.id);
        }
      }}
      className={`w-[210px] rounded-xl border px-3 py-2.5 cursor-pointer transition-all duration-150 ${borderStyle}`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isOffline
                ? 'bg-red-500/20 text-red-400'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400'
                : isStandby
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'bg-sky-500/15 text-cyan-300'
            }`}
          >
            <DeviceTypeIcon type={device.type} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 truncate">{device.label}</div>
            <div className="text-[10px] font-mono text-slate-400 truncate tabular-nums">{device.ipAddress}</div>
          </div>
        </div>
        <StatusIcon status={device.status} className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className={`font-medium ${getStatusTextColor(device.status)}`}>
          {device.replacedBySpareId ? 'Cold Spare Active' : getStatusLabel(device.status)}
        </span>
        {isStandby ? (
          <span className="font-mono text-cyan-400/80 truncate max-w-[100px]">
            {device.serialNumber || 'Ready'}
          </span>
        ) : (
          <span className="font-mono text-slate-300 tabular-nums">
            {isOffline ? '0 Mbps' : `${device.bandwidthInMbps} Mbps`}
          </span>
        )}
      </div>

      {backupInProgress && isBackupNode && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between text-[10px] text-cyan-300 mb-0.5">
            <span>Cloud Sync</span>
            <span className="font-mono tabular-nums">{backupProgressPct}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${backupProgressPct}%` }}
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
    </div>
  );
}

function AnimatedNetworkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<CustomLinkData>>) {
  const link = data?.link;
  const backupInProgress = Boolean(data?.backupInProgress);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const isDown = link?.status === 'down';
  const isDegraded = link?.status === 'degraded';
  const isStandby = link?.status === 'standby';
  const isDedicated = Boolean(link?.isDedicatedLine);
  const isBackupActive = Boolean(link?.isBackupPath && backupInProgress && !isDown);

  const strokeColor = isDown
    ? '#EF4444'
    : isDegraded
    ? '#F59E0B'
    : isBackupActive
    ? '#10B981'
    : isDedicated
    ? '#22D3EE'
    : isStandby
    ? '#0E7490'
    : '#38BDF8';

  const strokeWidth = isDedicated || isBackupActive ? 3 : isDown ? 2.5 : 1.75;
  const isAnimated = !isDown && !isStandby;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isStandby ? '6 5' : isDown ? '6 4' : undefined,
          opacity: isStandby ? 0.55 : 0.9,
        }}
      />

      {isAnimated && (
        <circle r={isBackupActive || isDedicated ? 4.5 : 3} fill={isBackupActive ? '#34D399' : '#22D3EE'}>
          <animateMotion
            dur={isBackupActive ? '1.1s' : isDedicated ? '1.4s' : '2.4s'}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {(isDown || isDedicated || isBackupActive || isStandby || isDegraded) && link?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
              isDown
                ? 'bg-red-950/90 border-red-500/60 text-red-300'
                : isDegraded
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-300'
                : isBackupActive
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                : isDedicated
                ? 'bg-cyan-950/90 border-cyan-400/60 text-cyan-200'
                : 'bg-[#0B1222]/90 border-slate-700 text-cyan-400'
            }`}
          >
            {isDown ? `DOWN · ${link.label}` : isBackupActive ? `SYNCING ${link.utilizationPct}%` : link.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = {
  networkDevice: NetworkDeviceNode,
};

const edgeTypes = {
  animatedNetwork: AnimatedNetworkEdge,
};

interface TopologyCanvasProps {
  state: NocSystemState;
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
  onTriggerBackup: () => void;
  onFailDedicatedLine: () => void;
  onRecoverDedicatedLine: () => void;
  onFailCoreSwitch: () => void;
  onReplaceCoreWithSpare: () => void;
  onSimulateSnmpAlert: () => void;
  onResetAll: () => void;
  busyAction: string | null;
}

function TopologyInner({
  state,
  selectedDeviceId,
  onSelectDevice,
  onTriggerBackup,
  onFailDedicatedLine,
  onRecoverDedicatedLine,
  onFailCoreSwitch,
  onReplaceCoreWithSpare,
  onSimulateSnmpAlert,
  onResetAll,
  busyAction,
}: TopologyCanvasProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cabinetFilter, setCabinetFilter] = useState<string>('all');
  const [showPhysicalDiagram, setShowPhysicalDiagram] = useState(false);
  const { fitView } = useReactFlow();

  const backupInProgress = state.backup.status === 'In Progress';
  const lineOffline = state.dedicatedLine.status === 'Offline';
  const coreSwitch = state.devices.find((d) => d.id === 'core-switch');
  const coreOffline = coreSwitch?.status === 'offline';
  const availableCoreSpare = state.spares.find(
    (s) => s.status === 'Available' && s.compatibleWith.includes('core-switch')
  );

  const filteredDeviceIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return new Set(
      state.devices
        .filter((d) => {
          if (cabinetFilter !== 'all' && d.cabinet !== cabinetFilter) return false;
          if (typeFilter === 'switching' && !['core-switch', 'distribution-switch', 'access-switch', 'router', 'firewall'].includes(d.type)) {
            return false;
          }
          if (typeFilter === 'servers' && !['server', 'backup-server', 'cloud-storage', 'monitoring-server', 'snmp-system'].includes(d.type)) {
            return false;
          }
          if (typeFilter === 'wan' && !['isp', 'dedicated-line', 'firewall', 'router'].includes(d.type)) {
            return false;
          }
          if (typeFilter === 'spares' && d.type !== 'cold-spare') {
            return false;
          }
          if (q) {
            const match =
              d.name.toLowerCase().includes(q) ||
              d.label.toLowerCase().includes(q) ||
              d.ipAddress.toLowerCase().includes(q) ||
              d.cabinet.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        })
        .map((d) => d.id)
    );
  }, [state.devices, searchQuery, typeFilter, cabinetFilter]);

  const nodes: Node<DeviceNodeData>[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.devices
      .filter((d) => filteredDeviceIds.has(d.id))
      .map((device) => ({
        id: device.id,
        type: 'networkDevice',
        position: device.position,
        data: {
          device,
          isSelected: selectedDeviceId === device.id,
          isSearchMatch: Boolean(q && filteredDeviceIds.has(device.id)),
          backupInProgress,
          backupProgressPct: state.backup.progressPct,
          onSelect: onSelectDevice,
        },
      }));
  }, [
    state.devices,
    filteredDeviceIds,
    selectedDeviceId,
    searchQuery,
    backupInProgress,
    state.backup.progressPct,
    onSelectDevice,
  ]);

  const edges: Edge<CustomLinkData>[] = useMemo(() => {
    return state.links
      .filter((l) => filteredDeviceIds.has(l.source) && filteredDeviceIds.has(l.target))
      .map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
        type: 'animatedNetwork',
        data: {
          link,
          backupInProgress,
        },
      }));
  }, [state.links, filteredDeviceIds, backupInProgress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.14, duration: 250 });
    }, 60);
    return () => clearTimeout(timer);
  }, [typeFilter, cabinetFilter, fitView]);

  const cabinets = Array.from(new Set(state.devices.map((d) => d.cabinet)));

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] min-h-[640px] gap-4">
      {/* Toolbar: Search, Filters & Physical Topology Modal Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1222] border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search device, IP, cabinet..."
              className="pl-9 pr-3 py-1.5 w-60 rounded-lg bg-[#060B17] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#060B17] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Device Types</option>
              <option value="wan">ISP & Dedicated Line</option>
              <option value="switching">Routers & Switches</option>
              <option value="servers">Servers, Backup & SNMP</option>
              <option value="spares">Onsite Cold Spares</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={cabinetFilter}
              onChange={(e) => setCabinetFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#060B17] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Data Cabinets</option>
              {cabinets.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPhysicalDiagram(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A2E] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            Reference Physical Diagram
          </button>
          <button
            onClick={() => fitView({ padding: 0.14, duration: 250 })}
            className="px-3 py-1.5 rounded-lg bg-[#111A2E] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            Fit View
          </button>
        </div>
      </div>

      {/* Live Scenario Demonstration Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B1222] border border-slate-800 rounded-xl px-4 py-2.5">
        <div className="text-xs text-slate-400 font-medium">
          Interactive Scenarios · Click any node to inspect interfaces & telemetry
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onTriggerBackup}
            disabled={backupInProgress || busyAction === 'backup-trigger'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-medium text-emerald-300 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            {backupInProgress ? `Backing Up (${state.backup.progressPct}%)` : '1. Animate Cloud Backup'}
          </button>

          {!lineOffline ? (
            <button
              onClick={onFailDedicatedLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-xs font-medium text-red-300 transition-colors whitespace-nowrap"
            >
              <ZapOff className="w-3.5 h-3.5" />
              2. Interrupt Dedicated Line
            </button>
          ) : (
            <button
              onClick={onRecoverDedicatedLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              <Activity className="w-3.5 h-3.5" />
              2. Recover Dedicated Line
            </button>
          )}

          {!coreOffline ? (
            <button
              onClick={onFailCoreSwitch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-xs font-medium text-red-300 transition-colors whitespace-nowrap"
            >
              <ServerCrash className="w-3.5 h-3.5" />
              3. Fail Core Switch
            </button>
          ) : availableCoreSpare ? (
            <button
              onClick={onReplaceCoreWithSpare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5" />
              3. Replace w/ Cold Spare
            </button>
          ) : null}

          <button
            onClick={onSimulateSnmpAlert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-xs font-medium text-amber-300 transition-colors whitespace-nowrap"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            4. Trigger SNMP Alert
          </button>

          <button
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111A2E] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="flex-1 rounded-xl border border-slate-800 bg-[#060B17] overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.35}
          maxZoom={1.75}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1E293B" />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const dev = (n.data as DeviceNodeData | undefined)?.device;
              if (!dev) return '#38BDF8';
              if (dev.status === 'offline') return '#EF4444';
              if (dev.status === 'warning') return '#F59E0B';
              if (dev.status === 'standby') return '#06B6D4';
              return '#10B981';
            }}
            maskColor="rgba(6, 11, 23, 0.78)"
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-14 z-10 flex flex-wrap items-center gap-4 px-3 py-2 rounded-lg bg-[#0B1222]/90 border border-slate-800 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Normal / Online
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Enterprise Dedicated Line
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Warning / SNMP Alert
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Offline / Link Down
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-cyan-400" /> Onsite Cold Spare
          </span>
        </div>

        {/* Active Fault Callout Banner inside Canvas */}
        {(coreOffline || lineOffline) && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/90 border border-red-500/60 text-xs text-red-200 max-w-md">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              {coreOffline
                ? 'Core Switch CSW-01 is offline. Downstream distribution links are severed — click "3. Replace w/ Cold Spare" to restore service.'
                : 'Enterprise Dedicated Line is offline. Failover active on Secondary ISP (ISP 2).'}
            </span>
          </div>
        )}
      </div>

      {/* Reference Physical Topology Modal */}
      {showPhysicalDiagram && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#0B1222] border border-slate-700 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Reference Physical Topology (Central ICT, CID, SGOD, OSDS, Library & Guest Cabinets)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Original physical cabling blueprint mapped into the live interactive NOC topology.
                </p>
              </div>
              <button
                onClick={() => setShowPhysicalDiagram(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto bg-white">
              <img
                src="/assets/aistudio/ciscoFINAL1.drawio_a8a86e79.png"
                alt="Physical Network Topology Blueprint"
                className="w-full h-auto rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopologyView(props: TopologyCanvasProps) {
  return (
    <ReactFlowProvider>
      <TopologyInner {...props} />
    </ReactFlowProvider>
  );
}
