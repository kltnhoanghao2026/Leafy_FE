export interface AddressOption {
  code: string;
  name: string;
}

interface ProvinceApiItem {
  code: number | string;
  name: string;
}

interface DistrictApiItem extends ProvinceApiItem {
  wards?: ProvinceApiItem[];
}

interface ProvinceDetailApiItem extends ProvinceApiItem {
  districts?: DistrictApiItem[];
}

interface DistrictDetailApiItem extends DistrictApiItem {
  wards?: ProvinceApiItem[];
}

const ADDRESS_API_BASE_URL = "https://provinces.open-api.vn/api";

const mapAddressOption = (item: ProvinceApiItem): AddressOption => ({
  code: String(item.code),
  name: item.name,
});

const fetchAddressJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${ADDRESS_API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error("Address API request failed");
  }

  return response.json() as Promise<T>;
};

export const addressApi = {
  getProvinces: async (): Promise<AddressOption[]> => {
    const provinces = await fetchAddressJson<ProvinceApiItem[]>("/p/");
    return provinces.map(mapAddressOption);
  },

  getDistricts: async (provinceCode: string): Promise<AddressOption[]> => {
    const province = await fetchAddressJson<ProvinceDetailApiItem>(
      `/p/${provinceCode}?depth=2`,
    );
    return (province.districts ?? []).map(mapAddressOption);
  },

  getWards: async (districtCode: string): Promise<AddressOption[]> => {
    const district = await fetchAddressJson<DistrictDetailApiItem>(
      `/d/${districtCode}?depth=2`,
    );
    return (district.wards ?? []).map(mapAddressOption);
  },
};
