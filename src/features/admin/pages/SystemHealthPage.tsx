import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const services = [
  { name: "API Gateway", port: "8080", status: "unknown" },
  { name: "Auth Service", port: "8081", status: "unknown" },
  { name: "Profile Service", port: "8082", status: "unknown" },
  { name: "Farm Service", port: "8083", status: "unknown" },
  { name: "Plant Management Service", port: "8084", status: "unknown" },
  { name: "Community Feed Service", port: "8085", status: "unknown" },
  { name: "Notification Service", port: "8086", status: "unknown" },
  { name: "IoT Metrics Collector", port: "8087", status: "unknown" },
  { name: "Search Service", port: "8088", status: "unknown" },
  { name: "Disease Detection Service", port: "8000", status: "unknown" },
  { name: "RAG Service", port: "8001", status: "unknown" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "up")
    return <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2} />;
  if (status === "down")
    return <XCircle className="w-5 h-5 text-red-500" strokeWidth={2} />;
  return <AlertCircle className="w-5 h-5 text-slate-300" strokeWidth={2} />;
}

export function SystemHealthPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Sức khỏe hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Trạng thái hoạt động của các microservice
        </p>
      </div>

      {/* Service cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">
            Danh sách dịch vụ
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{svc.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Port: {svc.port}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status={svc.status} />
                <span className="text-xs font-semibold text-slate-400 capitalize">
                  {svc.status === "unknown" ? "Chưa kiểm tra" : svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
