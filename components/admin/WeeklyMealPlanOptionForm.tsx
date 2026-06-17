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
      className="admin-row-card grid gap-4"
    >
      <div className="grid gap-4">
        <label className="admin-label">
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
            className="admin-input"
          >
            {weeklyMealPlanOptionTypes.map((type) => (
              <option key={type} value={type}>
                {formatWeeklyMealPlanOptionType(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-label">
          Option Name
          <input
            name="name"
            defaultValue={option?.name ?? ""}
            className="admin-input"
            placeholder="Mild or Chicken"
            required
          />
        </label>
      </div>

      <div className="grid gap-4">
        <label className="admin-label">
          Price Delta
          <input
            name="priceDelta"
            type="number"
            min="0"
            step="0.01"
            defaultValue={option ? option.priceDelta.toFixed(2) : "0.00"}
            className="admin-input"
            required
          />
        </label>

        <label className="admin-label">
          Display Order
          <input
            name="displayOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={option?.displayOrder ?? 0}
            className="admin-input"
            required
          />
        </label>
      </div>

      <div className="grid gap-4">
        <textarea
          name="description"
          rows={3}
          defaultValue={option?.description ?? ""}
          className="admin-input"
          placeholder="Description"
        />

        <textarea
          name="dietaryInfo"
          rows={3}
          defaultValue={option?.dietaryInfo ?? ""}
          className="admin-input"
          placeholder="Dietary info"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-bold text-[#3f2a1d]">
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
              : "flex items-center gap-2 text-[#9b8a7e]"
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

      <button disabled={saving} className="admin-button-primary">
        {saving ? "Saving..." : isEditing ? "Save Option" : "Add Option"}
      </button>
    </form>
  );
}
