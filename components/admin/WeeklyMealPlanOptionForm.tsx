"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatWeeklyMealPlanOptionType } from "@/lib/format-labels";
import { weeklyMealPlanOptionTypes } from "@/lib/prisma-enums";

export type WeeklyMealPlanAllowedOptionFormData = {
  id: string;
  optionType: string;
  name: string;
  description: string | null;
  dietaryInfo: string | null;
  priceDelta: number;
  requestOnly: boolean;
  requiresApproval: boolean;
  available: boolean;
  displayOrder: number;
};

type Props = {
  offeringId: string;
  option?: WeeklyMealPlanAllowedOptionFormData;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyMealPlanOptionForm({ offeringId, option }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [optionType, setOptionType] = useState(
    option?.optionType ?? "SPICE_LEVEL",
  );
  const [approvalRequired, setApprovalRequired] = useState(
    Boolean(option?.requestOnly || option?.requiresApproval),
  );
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(option);
  const isProteinSubstitution = optionType === "PROTEIN_SUBSTITUTION";

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const response = await fetch(
        option
          ? `/api/admin/menu/weekly-options/${option.id}`
          : `/api/admin/menu/weekly-offerings/${offeringId}/options`,
        {
          method: option ? "PATCH" : "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        alert(
          await readError(response, "Failed to save weekly meal plan option."),
        );
        return;
      }

      if (!option) {
        formRef.current?.reset();
        setOptionType("SPICE_LEVEL");
        setApprovalRequired(false);
      }

      router.refresh();
    } catch {
      alert("Failed to save weekly meal plan option.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid gap-4 rounded-xl border bg-white p-4"
    >
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Option Type
          <select
            name="optionType"
            value={optionType}
            onChange={(event) => {
              setOptionType(event.target.value);

              if (event.target.value !== "PROTEIN_SUBSTITUTION") {
                setApprovalRequired(false);
              }
            }}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
          >
            {weeklyMealPlanOptionTypes.map((type) => (
              <option key={type} value={type}>
                {formatWeeklyMealPlanOptionType(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Option Name
          <input
            name="name"
            defaultValue={option?.name ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="Mild or Chicken"
            required
          />
        </label>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Price Delta
          <input
            name="priceDelta"
            type="number"
            min="0"
            step="0.01"
            defaultValue={option ? option.priceDelta.toFixed(2) : "0.00"}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Display Order
          <input
            name="displayOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={option?.displayOrder ?? 0}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            required
          />
        </label>
      </div>

      <div className="grid gap-4">
        <textarea
          name="description"
          rows={3}
          defaultValue={option?.description ?? ""}
          className="rounded-xl border px-4 py-3 text-sm"
          placeholder="Description"
        />

        <textarea
          name="dietaryInfo"
          rows={3}
          defaultValue={option?.dietaryInfo ?? ""}
          className="rounded-xl border px-4 py-3 text-sm"
          placeholder="Dietary info"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <label className="flex items-center gap-2">
          <input
            name="available"
            type="checkbox"
            defaultChecked={option?.available ?? true}
          />
          Available
        </label>

        <label
          className={
            isProteinSubstitution
              ? "flex items-center gap-2"
              : "flex items-center gap-2 text-neutral-400"
          }
        >
          <input
            type="checkbox"
            checked={approvalRequired}
            disabled={!isProteinSubstitution}
            onChange={(event) => setApprovalRequired(event.target.checked)}
          />
          Request with chef approval
        </label>
      </div>

      {approvalRequired && isProteinSubstitution && (
        <>
          <input type="hidden" name="requestOnly" value="on" />
          <input type="hidden" name="requiresApproval" value="on" />
        </>
      )}

      <button
        disabled={saving}
        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
      >
        {saving
          ? "Saving..."
          : isEditing
            ? "Save Option"
            : "Add Option"}
      </button>
    </form>
  );
}
