import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useDistricts, useProvinces, useWards } from "../queries";
import type { AddressOption } from "../api/address.api";

interface AddressPickerProps {
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  addressLine: string;
  onProvinceChange: (code: string, option: AddressOption | null) => void;
  onDistrictChange: (code: string, option: AddressOption | null) => void;
  onWardChange: (code: string, option: AddressOption | null) => void;
  onAddressLineChange: (value: string) => void;
}

export function AddressPicker({
  provinceCode,
  districtCode,
  wardCode,
  addressLine,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onAddressLineChange,
}: AddressPickerProps) {
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(provinceCode);
  const wardsQuery = useWards(districtCode);

  const provinces = useMemo(
    () => provincesQuery.data ?? [],
    [provincesQuery.data],
  );
  const districts = useMemo(
    () => districtsQuery.data ?? [],
    [districtsQuery.data],
  );
  const wards = useMemo(() => wardsQuery.data ?? [], [wardsQuery.data]);

  const hasAddressApiError =
    provincesQuery.isError || districtsQuery.isError || wardsQuery.isError;

  return (
    <div className="space-y-4">
      {hasAddressApiError ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">
            Không tải được dữ liệu địa chỉ. Bạn vẫn có thể nhập địa chỉ và mã
            hành chính trong phần nâng cao.
          </p>
          <button
            type="button"
            onClick={() => {
              void provincesQuery.refetch();
              if (provinceCode) void districtsQuery.refetch();
              if (districtCode) void wardsQuery.refetch();
            }}
            className="mt-3 inline-flex items-center rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Tải lại địa chỉ
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label className="block" htmlFor="province-select">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Tỉnh/Thành phố
          </span>
          <select
            id="province-select"
            value={provinceCode}
            onChange={(event) => {
              const code = event.target.value;
              onProvinceChange(
                code,
                provinces.find((item) => item.code === code) ?? null,
              );
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
          >
            <option value="">
              {provincesQuery.isLoading ? "Đang tải..." : "Chọn tỉnh/thành"}
            </option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block" htmlFor="district-select">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Quận/Huyện
          </span>
          <select
            id="district-select"
            value={districtCode}
            onChange={(event) => {
              const code = event.target.value;
              onDistrictChange(
                code,
                districts.find((item) => item.code === code) ?? null,
              );
            }}
            disabled={!provinceCode}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10 disabled:bg-slate-50"
          >
            <option value="">
              {!provinceCode
                ? "Chọn tỉnh trước"
                : districtsQuery.isLoading
                  ? "Đang tải..."
                  : "Chọn quận/huyện"}
            </option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block" htmlFor="ward-select">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Phường/Xã
          </span>
          <select
            id="ward-select"
            value={wardCode}
            onChange={(event) => {
              const code = event.target.value;
              onWardChange(code, wards.find((item) => item.code === code) ?? null);
            }}
            disabled={!districtCode}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10 disabled:bg-slate-50"
          >
            <option value="">
              {!districtCode
                ? "Chọn huyện trước"
                : wardsQuery.isLoading
                  ? "Đang tải..."
                  : "Chọn phường/xã"}
            </option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block" htmlFor="address-line">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Địa chỉ chi tiết
        </span>
        <input
          id="address-line"
          value={addressLine}
          onChange={(event) => onAddressLineChange(event.target.value)}
          placeholder="Số nhà, đường, thôn/xóm..."
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
        />
      </label>
    </div>
  );
}
