import { FiClock, FiMapPin, FiThumbsUp, FiActivity } from 'react-icons/fi';
import { QUEUE_STATUS } from '../../utils/constants';

export default function BoothReportList({ reports, loading, onUpvote, onSwitchToReport }) {
  const statusColors = { working: 'status-green', glitch: 'status-yellow', down: 'status-red' };
  const safetyLabels = { peaceful: 'badge-safe', tense: 'badge-caution', disrupted: 'badge-danger' };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (loading && !reports.length) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full" />)}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
          <FiActivity className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-text-muted text-xs font-medium">No reports from this area yet.</p>
        <button onClick={onSwitchToReport} className="mt-4 text-xs font-bold text-saffron hover:underline">BE THE FIRST TO REPORT</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div key={r._id} className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-india-green/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColors[r.evmStatus]} shadow-sm`} />
              <span className="text-xs font-black text-text-primary">BOOTH #{r.boothId}</span>
            </div>
            <span className={`badge ${safetyLabels[r.safetyStatus]} text-[8px] font-black`}>{r.safetyStatus}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-slate-50 p-2 rounded-xl">
              <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Est. Wait Time</p>
              <p className={`text-xs font-bold ${QUEUE_STATUS[r.queueLength]?.color}`}>
                {QUEUE_STATUS[r.queueLength]?.time || '5-15 min'}
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Queue Status</p>
              <p className="text-xs font-bold text-text-primary capitalize">{r.queueLength}</p>
            </div>
          </div>

          {r.description && <p className="text-[10px] text-text-secondary mb-3 leading-relaxed bg-slate-50/50 p-2 rounded-lg">{r.description}</p>}
          
          <div className="flex items-center justify-between border-t border-slate-50 pt-3">
            <div className="flex items-center gap-4">
              <span className="text-[9px] text-text-muted flex items-center gap-1">
                <FiClock className="w-3 h-3" /> {timeAgo(r.timestamp)}
              </span>
              <span className="text-[9px] text-text-muted flex items-center gap-1">
                <FiMapPin className="w-3 h-3" /> {r.city || 'Local'}
              </span>
            </div>
            <button 
              onClick={() => onUpvote(r._id)} 
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-saffron transition-colors cursor-pointer"
            >
              <FiThumbsUp className="w-3.5 h-3.5" /> {r.upvotes || 0}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
