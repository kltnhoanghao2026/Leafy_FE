import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "../api/profilesApi";
import { Check, Clock, UserRound, Inbox, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

type Tab = "pending" | "accepted";

export function PendingRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [page, setPage] = useState(0);

  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ["pending-consultations", page],
    queryFn: () => profilesApi.getPendingConsultations({ page, size: 20 }),
  });

  const { data: acceptedData, isLoading: isLoadingAccepted } = useQuery({
    queryKey: ["accepted-consultations", page],
    queryFn: () => profilesApi.getAcceptedConsultations({ page, size: 20 }),
  });

  const respondMutation = useMutation({
    mutationFn: ({ farmerId, accept }: { farmerId: string; accept: boolean }) =>
      profilesApi.respondToConsultation(farmerId, accept),
    onSuccess: (_, variables) => {
      toast.success(variables.accept ? "Đã chấp nhận yêu cầu tư vấn" : "Đã từ chối yêu cầu tư vấn");
      queryClient.invalidateQueries({ queryKey: ["pending-consultations"] });
      queryClient.invalidateQueries({ queryKey: ["accepted-consultations"] });
    },
    onError: () => {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    },
  });

  const pendingRequests = pendingData?.data?.data?.content || [];
  const acceptedRequests = acceptedData?.data?.data?.content || [];

  const isLoading = activeTab === "pending" ? isLoadingPending : isLoadingAccepted;
  const requests = activeTab === "pending" ? pendingRequests : acceptedRequests;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tư vấn</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý các yêu cầu và phiên tư vấn với nông dân.
        </p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("pending"); setPage(0); }}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            activeTab === "pending"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Yêu cầu mới
          {pendingRequests.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("accepted"); setPage(0); }}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            activeTab === "accepted"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Đang tư vấn
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-4 p-5 bg-white rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Không có dữ liệu</h3>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === "pending"
              ? "Hiện tại bạn chưa có yêu cầu tư vấn mới nào cần xử lý."
              : "Chưa có nông dân nào đang được tư vấn."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.connectionId} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="flex items-center gap-4 flex-1">
                <img 
                  src={request.followerAvatar || "https://i.pravatar.cc/150"} 
                  alt={request.followerName} 
                  className="w-14 h-14 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {request.followerName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <UserRound className="w-3.5 h-3.5" />
                      {request.followerRole === "FARMER" ? "Nông dân" : "Người dùng"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(request.requestedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {activeTab === "pending" ? (
                  <>
                    <button 
                      onClick={() => respondMutation.mutate({ farmerId: request.followerId, accept: false })}
                      disabled={respondMutation.isPending}
                      className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                    <button 
                      onClick={() => respondMutation.mutate({ farmerId: request.followerId, accept: true })}
                      disabled={respondMutation.isPending}
                      className="flex-1 sm:flex-none px-4 py-2 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-[#059669] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Chấp nhận
                    </button>
                  </>
                ) : (
                  <button 
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Nhắn tin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
