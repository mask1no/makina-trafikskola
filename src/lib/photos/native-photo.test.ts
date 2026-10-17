import { describe, expect, it } from "vitest";

import { fileFromPhoto, shouldUseNativeCamera } from "@/lib/photos/native-photo";

describe("native teacher photo", () => {
  it("uses the camera only inside the store shell", () => {
    expect(shouldUseNativeCamera(undefined)).toBe(false);
    expect(shouldUseNativeCamera({ isNativePlatform: () => false })).toBe(false);
    expect(shouldUseNativeCamera({ isNativePlatform: () => true })).toBe(true);
  });

  it("turns a camera photo into a jpeg file the upload accepts", () => {
    const file = fileFromPhoto(btoa("makina"), "jpeg");
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("teacher-photo.jpeg");
    expect(file.size).toBe(6);
  });
});
