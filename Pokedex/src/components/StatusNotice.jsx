function StatusNotice({ error, success, note }) {
  if (error) return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>;
  if (success) return <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{success}</p>;
  if (note) return <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{note}</p>;
  return null;
}

export default StatusNotice;
