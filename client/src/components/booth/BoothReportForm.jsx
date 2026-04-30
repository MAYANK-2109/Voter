import { FiAlertCircle, FiSend, FiCamera } from 'react-icons/fi';

export default function BoothReportForm({ 
  form, 
  setForm, 
  nearbyBooths, 
  submitting, 
  handleSubmit 
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3 mb-2">
        <FiAlertCircle className="w-5 h-5 text-india-blue shrink-0 mt-0.5" />
        <p className="text-[10px] text-india-blue leading-relaxed font-medium">
          Please provide accurate information. Your crowdsourced data helps fellow citizens plan their voting day efficiently.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="booth-select" className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Booth Identification</label>
        {nearbyBooths.length > 0 ? (
          <select 
            id="booth-select"
            value={form.boothId} 
            onChange={e => setForm({...form, boothId: e.target.value})} 
            className="select-glass" 
            required
          >
            <option value="" disabled>Select Nearby Booth</option>
            {nearbyBooths.map(booth => (
              <option key={booth.id} value={booth.id.toString()}>
                {booth.name} (Booth #{booth.id})
              </option>
            ))}
          </select>
        ) : (
          <div className="input-glass bg-slate-50 text-text-muted italic flex items-center h-[38px] text-xs">
            No booths found nearby. Please enable location.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="evm-status" className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">EVM Status</label>
          <select id="evm-status" value={form.evmStatus} onChange={e => setForm({...form, evmStatus: e.target.value})} className="select-glass">
            <option value="working">✅ Working Smoothly</option>
            <option value="glitch">⚠️ Minor Glitches</option>
            <option value="down">❌ Completely Down</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="queue-density" className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Queue Density</label>
          <select id="queue-density" value={form.queueLength} onChange={e => setForm({...form, queueLength: e.target.value})} className="select-glass">
            <option value="empty">Empty</option>
            <option value="short">Short (Fast)</option>
            <option value="moderate">Moderate</option>
            <option value="long">Long (Slow)</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="safety-status" className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Safety & Security</label>
        <select id="safety-status" value={form.safetyStatus} onChange={e => setForm({...form, safetyStatus: e.target.value})} className="select-glass">
          <option value="peaceful">Peaceful Environment</option>
          <option value="tense">Tense / Arguments</option>
          <option value="disrupted">Disrupted / Policed</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="observations" className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Observations</label>
        <textarea 
          id="observations"
          placeholder="Mention anything unusual or helpful for other voters..." 
          value={form.description} 
          onChange={e => setForm({...form, description: e.target.value})} 
          className="input-glass min-h-[80px] resize-none" 
          rows={2} 
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <button type="submit" disabled={submitting || nearbyBooths.length === 0} className={`btn-primary w-full py-4 text-xs font-black uppercase tracking-widest ${nearbyBooths.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-saffron/40'}`}>
            <FiSend className="w-4 h-4" /> {submitting ? 'PROCESSING...' : 'TRANSMIT REPORT'}
          </button>
        </div>
        <button type="button" className="p-4 rounded-xl bg-slate-100 text-text-muted hover:bg-slate-200 transition-colors" title="Attach Photo">
          <FiCamera className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
