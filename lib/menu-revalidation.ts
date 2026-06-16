import { revalidatePath } from "next/cache";

type RevalidateMenuOptions = {
  includeArchived?: boolean;
  includeCategories?: boolean;
};

export function revalidateMenuPages(options: RevalidateMenuOptions = {}) {
  revalidatePath("/menu");
  revalidatePath("/admin/menu");

  if (options.includeArchived) {
    revalidatePath("/admin/menu/archived");
  }

  if (options.includeCategories) {
    revalidatePath("/admin/menu/categories");
  }
}
