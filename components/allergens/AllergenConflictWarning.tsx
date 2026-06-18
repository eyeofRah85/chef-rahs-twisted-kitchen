type Allergen = {
  id: string;
  name: string;
};

type Props = {
  conflicts: Allergen[];
  compact?: boolean;
};

export function AllergenConflictWarning({ conflicts, compact = false }: Props) {
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950 shadow-sm"
          : "rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950 shadow-sm"
      }
    >
      <p className="font-black">Allergen warning</p>

      <p className="mt-1 leading-6">
        This item includes allergen tags that match your account preferences:{" "}
        <span className="font-semibold">
          {conflicts.map((allergen) => allergen.name).join(", ")}
        </span>
        .
      </p>

      {!compact && (
        <p className="mt-2 text-xs leading-5">
          Please review the item carefully and contact Chef Rah&apos;s Twisted
          Kitchen if you have a severe allergy or need confirmation before
          ordering.
        </p>
      )}
    </div>
  );
}
