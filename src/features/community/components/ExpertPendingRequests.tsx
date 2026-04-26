import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useMyProfile } from "../../settings/queries";

export function ExpertPendingRequests() {
  const { data: profile } = useMyProfile();
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (profile?.role === "EXPERT") {
      // Simulate fetching pending requests
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  if (!show || profile?.role !== "EXPERT") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-[22rem] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#10B981]/20 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          {!accepted && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          )}
          {accepted ? "Đã lên lịch tư vấn" : "Yêu cầu tư vấn mới"}
        </h3>
        <button 
          onClick={() => setShow(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Trần Văn Nông</h4>
            <p className="text-xs text-slate-500 mt-0.5">Nông dân · Đắk Lắk</p>
          </div>
          {!accepted && (
            <div className="ml-auto text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
              Gấp
            </div>
          )}
        </div>
        
        {!accepted ? (
          <>
            <div className="mt-3 bg-[#F8FAF9] rounded-lg p-3 text-sm text-slate-700 border border-slate-100 relative">
              <div className="absolute left-3 top-3 w-1 h-full bg-[#10B981] -ml-3 rounded-l-lg -mt-3"></div>
              <p className="line-clamp-2">"Chào chuyên gia, cây cà phê nhà tôi tự nhiên bị vàng lá và rụng nhiều, mong chuyên gia xem giúp ạ."</p>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => setAccepted(true)}
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Chấp nhận ngay
              </button>
              <button 
                onClick={() => setShow(false)}
                className="flex-[0.4] bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Để sau
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-600">Bạn đã chấp nhận yêu cầu. Hãy kiểm tra lịch trình của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
