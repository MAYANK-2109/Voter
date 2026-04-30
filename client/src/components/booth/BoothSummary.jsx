import { motion } from 'framer-motion';

export default function BoothSummary({ summary }) {
  if (!summary || summary.total === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Local Summary</p>
        <span className="text-[10px] font-bold text-india-blue bg-india-blue/10 px-2 py-0.5 rounded-full">{summary.total} Reports</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs font-bold text-success">{Math.round((summary.evm.working / summary.total) * 100)}%</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-success" style={{ width: `${(summary.evm.working / summary.total) * 100}%` }} />
          </div>
          <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">EVM OK</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-warning">{Math.round((summary.evm.glitch / summary.total) * 100)}%</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-warning" style={{ width: `${(summary.evm.glitch / summary.total) * 100}%` }} />
          </div>
          <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">GLITCH</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-danger">{Math.round((summary.evm.down / summary.total) * 100)}%</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-danger" style={{ width: `${(summary.evm.down / summary.total) * 100}%` }} />
          </div>
          <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">DOWN</p>
        </div>
      </div>
    </div>
  );
}
