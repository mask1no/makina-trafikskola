import { revalidateTag } from "next/cache";

export function revalidateLocations() {
  revalidateTag("locations", "max");
}

export function revalidateTeacherLanguages() {
  revalidateTag("teacher-languages", "max");
}
