export const fileTypeFromFile = async (_path: string) => {
  return { mime: "image/jpeg", ext: "jpg" };
};
export const fileTypeFromBuffer = async (_buffer: Buffer | Uint8Array) => {
  return { mime: "image/jpeg", ext: "jpg" };
};
export const supportedExtensions = new Set(["jpg", "png", "pdf"]);
export const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
