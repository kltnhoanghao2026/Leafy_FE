const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const acceptedImageTypes = ACCEPTED_IMAGE_TYPES;
export const maxImageSizeBytes = MAX_IMAGE_SIZE_BYTES;

export function validateDiagnosisImage(file: File | null) {
  if (!file) {
    return "Vui lòng chọn ảnh lá cây trước khi chẩn đoán.";
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "File không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Ảnh quá lớn. Vui lòng chọn ảnh tối đa 10MB.";
  }

  return null;
}
