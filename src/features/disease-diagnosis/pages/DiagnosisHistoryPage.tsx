import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { ConfirmDeleteDialog } from "../../farm-management/components/ConfirmDeleteDialog";
import { DiagnosisHistoryList } from "../components/DiagnosisHistoryList";
import { DiagnosisRequestDetailDialog } from "../components/DiagnosisRequestDetailDialog";
import {
  useDeleteDiagnoseRequestMutation,
  useDiagnoseRequests,
  useDiagnoseResults,
  useDiagnoseResultsByRequest,
} from "../queries";
import type { DiagnoseRequest } from "../types";

export function DiagnosisHistoryPage() {
  const [selectedRequest, setSelectedRequest] = useState<DiagnoseRequest | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DiagnoseRequest | null>(null);
  const requestsQuery = useDiagnoseRequests({ page: 0, size: 50 });
  const resultsQuery = useDiagnoseResults({ page: 0, size: 50 });
  const deleteMutation = useDeleteDiagnoseRequestMutation();
  const selectedResultQuery = useDiagnoseResultsByRequest(
    selectedRequest?.diagnoseRequestId ?? "",
    Boolean(selectedRequest),
  );

  const requests = useMemo(
    () => requestsQuery.data?.content ?? [],
    [requestsQuery.data],
  );
  const resultByRequest = useMemo(
    () =>
      new Map(
        (resultsQuery.data?.content ?? []).map((result) => [
          result.diagnoseRequestId,
          result,
        ]),
      ),
    [resultsQuery.data],
  );

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await deleteMutation.mutateAsync(deleteTarget.diagnoseRequestId);
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={ROUTES.DASHBOARD.DISEASE_DIAGNOSIS}
            className="inline-flex items-center text-sm font-black text-[#245A34] hover:text-[#1b432a]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Quay lại chẩn đoán
          </Link>
          <h2 className="mt-4 text-[32px] font-black tracking-tight text-slate-900">
            Lịch sử chẩn đoán
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Xem lại các ảnh đã chẩn đoán và kết quả dự đoán tương ứng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void requestsQuery.refetch()}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Tải lại
        </button>
      </header>

      {requestsQuery.isLoading ? (
        <div className="space-y-4" aria-label="Đang tải lịch sử chẩn đoán">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-[1.5rem] bg-slate-100"
            />
          ))}
        </div>
      ) : null}

      {requestsQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 shadow-sm">
          <h3 className="text-lg font-black text-red-700">
            Không tải được lịch sử chẩn đoán
          </h3>
          <p className="mt-1 text-sm font-semibold text-red-600">
            Kiểm tra quyền truy cập hoặc disease-detection-service.
          </p>
        </div>
      ) : null}

      {!requestsQuery.isLoading && !requestsQuery.isError ? (
        <DiagnosisHistoryList
          requests={requests}
          resultByRequestId={resultByRequest}
          onView={setSelectedRequest}
          onDelete={setDeleteTarget}
        />
      ) : null}

      {selectedRequest ? (
        <DiagnosisRequestDetailDialog
          request={selectedRequest}
          result={selectedResultQuery.data}
          isLoading={selectedResultQuery.isLoading}
          isError={selectedResultQuery.isError}
          onClose={() => setSelectedRequest(null)}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDeleteDialog
          title="Xóa lịch sử chẩn đoán"
          description={`Bạn có chắc muốn xóa lượt chẩn đoán "${deleteTarget.imageFileName}"?`}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}

export default DiagnosisHistoryPage;
