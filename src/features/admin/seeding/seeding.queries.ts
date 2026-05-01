import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { seedingApi } from "./seeding.api";

export const useSeedAccounts = () =>
  useMutation({
    mutationFn: (count: number) => seedingApi.seedAccounts(count),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Tạo tài khoản: ${d?.created ?? 0} mới, ${d?.skipped ?? 0} bỏ qua`,
      );
    },
    onError: () => toast.error("Seeder tài khoản thất bại"),
  });

export const useSeedFarms = () =>
  useMutation({
    mutationFn: ({
      plotsPerProfile,
      zonesPerPlot,
    }: {
      plotsPerProfile?: number;
      zonesPerPlot?: number;
    }) => seedingApi.seedFarms(plotsPerProfile, zonesPerPlot),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Nông trại: ${d?.seededPlotCount ?? 0} mảnh đất, ${d?.seededZoneCount ?? 0} vùng`,
      );
    },
    onError: () => toast.error("Seeder nông trại thất bại"),
  });

export const useSeedPlants = () =>
  useMutation({
    mutationFn: ({
      speciesCount,
      plantCount,
      eventsPerPlant,
    }: {
      speciesCount?: number;
      plantCount?: number;
      eventsPerPlant?: number;
    }) => seedingApi.seedPlants(speciesCount, plantCount, eventsPerPlant),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Cây trồng: ${d?.seededPlantCount ?? 0} cây, ${d?.seededEventCount ?? 0} sự kiện`,
      );
    },
    onError: () => toast.error("Seeder cây trồng thất bại"),
  });

export const useSeedSpeciesPerenual = () =>
  useMutation({
    mutationFn: ({
      startPage,
      pages,
      perPage,
    }: {
      startPage: number;
      pages: number;
      perPage: number;
    }) => seedingApi.seedSpeciesPerenual(startPage, pages, perPage),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Perenual: ${d?.createdCount ?? 0} mới, ${d?.updatedCount ?? 0} cập nhật, ${d?.skippedCount ?? 0} bỏ qua`,
      );
    },
    onError: () => toast.error("Seeder Perenual thất bại"),
  });

export const useSeedCommunity = () =>
  useMutation({
    mutationFn: ({
      postCount,
      commentCount,
      voteCount,
    }: {
      postCount?: number;
      commentCount?: number;
      voteCount?: number;
    } = {}) => seedingApi.seedCommunity(postCount, commentCount, voteCount),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Cộng đồng: ${d?.seededPostCount ?? 0} bài, ${d?.seededCommentCount ?? 0} bình luận, ${d?.seededVoteCount ?? 0} lượt vote`,
      );
    },
    onError: () => toast.error("Seeder cộng đồng thất bại"),
  });

export const useSyncCommunityProfiles = () =>
  useMutation({
    mutationFn: () => seedingApi.syncCommunityProfiles(),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Đã đồng bộ ${d?.seededProfileCount ?? 0} hồ sơ từ profile-service`,
      );
    },
    onError: () => toast.error("Đồng bộ hồ sơ thất bại"),
  });

export const useSeedCertificates = () =>
  useMutation({
    mutationFn: ({
      requestCount,
      certsPerRequest,
    }: {
      requestCount?: number;
      certsPerRequest?: number;
    }) => seedingApi.seedCertificates(requestCount, certsPerRequest),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(
        `Chứng chỉ: ${d?.seededRequestCount ?? 0} yêu cầu, ${d?.seededCertificateCount ?? 0} chứng chỉ`,
      );
    },
    onError: () => toast.error("Seeder chứng chỉ thất bại"),
  });

export const useSeedExperts = () =>
  useMutation({
    mutationFn: (count: number) => seedingApi.seedExperts(count),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`Chuyên gia: Đã tạo ${d ?? 0} hồ sơ`);
    },
    onError: () => toast.error("Seeder chuyên gia thất bại"),
  });
