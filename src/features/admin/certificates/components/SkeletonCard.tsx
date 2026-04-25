export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/80">
        <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-200 rounded w-44" />
          <div className="h-3 bg-slate-100 rounded w-36" />
        </div>
        <div className="w-28 h-6 bg-slate-100 rounded-full" />
      </div>

      {/* Body: 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px]">
        {/* Left: cert skeletons */}
        <div className="px-6 py-4 space-y-5 divide-y divide-slate-100">
          {[1, 2].map((i) => (
            <div key={i} className="pt-4 first:pt-0 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              {/* preview panel skeleton */}
              <div className="ml-8 rounded-xl overflow-hidden border border-slate-100">
                <div className="h-7 bg-slate-100 border-b border-slate-100" />
                <div className="h-40 bg-slate-50" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: sidebar skeleton */}
        <div className="lg:border-l border-t lg:border-t-0 border-slate-100 bg-slate-50/60 px-5 py-5 space-y-5">
          <div className="space-y-2">
            <div className="h-2.5 bg-slate-200 rounded w-24" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-px bg-slate-200" />
          <div className="space-y-2.5">
            <div className="h-2.5 bg-slate-200 rounded w-20" />
            <div className="h-10 bg-slate-200 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
