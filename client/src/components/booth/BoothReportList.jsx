import { FiClock, FiMapPin, FiThumbsUp, FiActivity } from 'react-icons/fi';
import { QUEUE_STATUS } from '../../utils/constants';

// Fix #24: Extracted to module scope — stable reference across renders,
// no re-allocation on every component call, safe to pass as a memo dep.
const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h` : `${Math.floor(hrs / 24)}d`;
};

const EVM_STATUS_COLORS = {
  working: 'status-green',
  glitch:  'status-yellow',
  down:    'status-red',
};

const SAFETY_BADGE_CLASSES = {
  peaceful:  'badge-safe',
  tense:     'badge-caution',
  disrupted: 'badge-danger',
};

export default function BoothReportList({ reports, loading, onUpvote, onSwitchToReport }) {
  if (loading && !reports.length) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading booth reports">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full" />)}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
          <FiActivity className="w-6 h-6 text-text-muted" aria-hidden="true" />
        </div>
        <p className="text-text-muted text-xs font-medium">No reports from this area yet.</p>
        {/* Fix #25: Explicit type="button" prevents accidental form submission */}
        <button
          type="button"
          onClick={onSwitchToReport}
          className="mt-4 text-xs font-bold text-saffron hover:underline"
        >
          BE THE FIRST TO REPORT
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <div
          key={report._id}
          className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-india-green/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Fix #23: Status dot is now screen-reader-accessible via role + aria-label */}
              <span
                className={`w-2.5 h-2.5 rounded-full ${EVM_STATUS_COLORS[report.evmStatus]} shadow-sm`}
                role="img"
                aria-label={`EVM status: ${report.evmStatus}`}
              />
              <span className="text-xs font-black text-text-primary">BOOTH #{report.boothId}</span>
            </div>
            <span className={`badge ${SAFETY_BADGE_CLASSES[report.safetyStatus]} text-[8px] font-black`}>
              {report.safetyStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-slate-50 p-2 rounded-xl">
              <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Est. Wait Time</p>
              <p className={`text-xs font-bold ${QUEUE_STATUS[report.queueLength]?.color}`}>
                {QUEUE_STATUS[report.queueLength]?.time || '5-15 min'}
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Queue Status</p>
              <p className="text-xs font-bold text-text-primary capitalize">{report.queueLength}</p>
            </div>
          </div>

          {report.description && (
            <p className="text-[10px] text-text-secondary mb-3 leading-relaxed bg-slate-50/50 p-2 rounded-lg">
              {report.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-slate-50 pt-3">
            <div className="flex items-center gap-4">
              <span className="text-[9px] text-text-muted flex items-center gap-1">
                <FiClock className="w-3 h-3" aria-hidden="true" />
                <time dateTime={report.timestamp}>{timeAgo(report.timestamp)}</time>
              </span>
              <span className="text-[9px] text-text-muted flex items-center gap-1">
                <FiMapPin className="w-3 h-3" aria-hidden="true" />
                {report.city || 'Local'}
              </span>
            </div>

            {/* Fix #22: Descriptive aria-label for the upvote action */}
            {/* Fix #25: Explicit type="button" */}
            <button
              type="button"
              onClick={() => onUpvote(report._id)}
              aria-label={`Upvote booth ${report.boothId} report (${report.upvotes || 0} votes)`}
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-saffron transition-colors cursor-pointer"
            >
              <FiThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
              {report.upvotes || 0}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
