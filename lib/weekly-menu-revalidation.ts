import { revalidatePath } from "next/cache";

export function revalidateWeeklyMenuAdminPages() {
  revalidatePath("/admin/menu/weekly");
}
