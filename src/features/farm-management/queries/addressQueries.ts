import { useQuery } from "@tanstack/react-query";
import { addressApi } from "../api/address.api";

export const addressKeys = {
  all: () => ["address"] as const,
  provinces: () => [...addressKeys.all(), "provinces"] as const,
  districts: (provinceCode: string) =>
    [...addressKeys.all(), "districts", provinceCode] as const,
  wards: (districtCode: string) =>
    [...addressKeys.all(), "wards", districtCode] as const,
};

export const useProvinces = () =>
  useQuery({
    queryKey: addressKeys.provinces(),
    queryFn: addressApi.getProvinces,
    staleTime: 24 * 60 * 60 * 1000,
  });

export const useDistricts = (provinceCode: string) =>
  useQuery({
    queryKey: addressKeys.districts(provinceCode),
    queryFn: () => addressApi.getDistricts(provinceCode),
    enabled: !!provinceCode,
    staleTime: 24 * 60 * 60 * 1000,
  });

export const useWards = (districtCode: string) =>
  useQuery({
    queryKey: addressKeys.wards(districtCode),
    queryFn: () => addressApi.getWards(districtCode),
    enabled: !!districtCode,
    staleTime: 24 * 60 * 60 * 1000,
  });
