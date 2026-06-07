"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { optionGroupTemplates } from "@/data/option-templates";

type Allergen = {
  id: string;
  name: string;
};

type OptionChoiceInput = {
  name: string;
  description?: string;
  dietaryInfo?: string;
  imageUrl?: string;
  requestOnly?: boolean;
  priceDelta: string;
};


type Props = {
  menuItemId: string;
  allergens: Allergen[];
};

export function MenuItemCustomizationEditor({
  menuItemId,
  allergens,
}: Props) {
  const router = useRouter();
  
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [required, setRequired] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [choices, setChoices] = useState<OptionChoiceInput[]>([
    {
      name: "",
      description: "",
      dietaryInfo: "",
      imageUrl: "",
      requestOnly: false,
      priceDelta: "0",
    },
  ]);

  async function saveAllergens() {
    const response = await fetch(`/api/admin/menu/${menuItemId}/allergens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allergenIds: selectedAllergens,
      }),
    });

    if (!response.ok) {
      alert("Failed to save allergens.");
      return;
    }

    alert("Allergens saved.");
    router.refresh();
  }

  async function saveOptionGroup() {
    const cleanedChoices = choices
      .filter((choice) => choice.name.trim())
      .map((choice) => ({
        name: choice.name.trim(),
        description: choice.description?.trim() || null,
        dietaryInfo: choice.dietaryInfo?.trim() || null,
        imageUrl: choice.imageUrl?.trim() || null,
        requestOnly: Boolean(choice.requestOnly),
        priceDelta: Number(choice.priceDelta || 0),
      }));

    if (!groupName.trim() || cleanedChoices.length === 0) {
      alert("Group name and at least one choice are required.");
      return;
    }

    const response = await fetch(`/api/admin/menu/${menuItemId}/options`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupName: groupName.trim(),
        required,
        multiple,
        choices: cleanedChoices,
      }),
    });

    if (!response.ok) {
      alert("Failed to save option group.");
      return;
    }

    setGroupName("");
    setRequired(false);
    setMultiple(false);
    setChoices([{ name: "", priceDelta: "0" }]);

    router.refresh();
  }

  return (
    <div className="mt-5 space-y-5 rounded-xl border p-4">
      <section>
        <h4 className="font-semibold">Allergens</h4>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {allergens.map((allergen) => (
            <label key={allergen.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                value={allergen.id}
                checked={selectedAllergens.includes(allergen.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAllergens((prev) => [...prev, allergen.id]);
                  } else {
                    setSelectedAllergens((prev) =>
                      prev.filter((id) => id !== allergen.id),
                    );
                  }
                }}
              />

              {allergen.name}
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={saveAllergens}
          className="mt-5 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Save Allergens
        </button>
      </section>

      <section className="border-t pt-5">
        <h4 className="font-semibold">Add Option Group</h4>

        <select
          value={selectedTemplate}
          onChange={(e) => {
            const templateName = e.target.value;
            setSelectedTemplate(templateName);

            const template = optionGroupTemplates.find(
              (item) => item.name === templateName,
            );

            if (!template) return;

            setGroupName(template.name);
            setRequired(template.required);
            setMultiple(template.multiple);
            setChoices(template.choices);
          }}
          className="mt-4 w-full rounded-xl border px-4 py-3 text-sm"
        >
          <option value="">Choose an option template</option>

          {optionGroupTemplates.map((template) => (
            <option key={template.name} value={template.name}>
              {template.name}
            </option>
          ))}
        </select>

        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name, e.g. Spice Level"
          className="mt-4 w-full rounded-xl border px-4 py-3 text-sm"
        />

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Required
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={multiple}
              onChange={(e) => setMultiple(e.target.checked)}
            />
            Allow multiple choices
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {choices.map((choice, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                value={choice.name}
                onChange={(e) => {
                  setChoices((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, name: e.target.value } : item,
                    ),
                  );
                }}
                placeholder="Choice, e.g. Hot"
                className="rounded-xl border px-4 py-3 text-sm"
              />

              <input
                value={choice.priceDelta}
                onChange={(e) => {
                  setChoices((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? { ...item, priceDelta: e.target.value }
                        : item,
                    ),
                  );
                }}
                type="number"
                step="0.01"
                min="0"
                placeholder="+ Price"
                className="rounded-xl border px-4 py-3 text-sm"
              />

              <button
                type="button"
                onClick={() => {
                  setChoices((prev) => prev.filter((_, i) => i !== index));
                }}
                className="rounded-xl border px-3 py-2 text-sm text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() =>
              setChoices((prev) => [
                ...prev,
                {
                  name: "",
                  description: "",
                  dietaryInfo: "",
                  imageUrl: "",
                  requestOnly: false,
                  priceDelta: "0",
                },
              ])
            }
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Add Choice
          </button>

          <button
            type="button"
            onClick={saveOptionGroup}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Save Option Group
          </button>
        </div>
      </section>
    </div>
  );
}
