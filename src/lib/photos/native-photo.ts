type NativeBridge = {
  isNativePlatform?: () => boolean;
};

export function nativeBridge(): NativeBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Capacitor?: NativeBridge }).Capacitor;
}

export function shouldUseNativeCamera(bridge: NativeBridge | undefined): boolean {
  return Boolean(bridge?.isNativePlatform?.());
}

export function fileFromPhoto(base64: string, format: string | undefined): File {
  const normalized = format === "png" ? "png" : "jpeg";
  const type = normalized === "png" ? "image/png" : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], `teacher-photo.${normalized}`, { type });
}

export async function pickNativePhoto(): Promise<File | null> {
  if (!shouldUseNativeCamera(nativeBridge())) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      correctOrientation: true,
      width: 1600,
    });
    if (!photo.base64String) return null;
    return fileFromPhoto(photo.base64String, photo.format);
  } catch {
    return null;
  }
}
