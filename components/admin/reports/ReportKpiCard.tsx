type ReportKpiCardProps = {
  label: string;
  value: string;
  helperText?: string;
  tone?: "neutral" | "warning" | "success";
};

const toneClasses = {
  neutral: "border-[#ead8c1] bg-white",
  warning: "border-amber-300 bg-amber-50",
  success: "border-emerald-300 bg-emerald-50",
};

export function ReportKpiCard({
  label,
  value,
  helperText,
  tone = "neutral",
}: ReportKpiCardProps) {
  return (
    <article
      className={`rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[tone]}`}
    >
      <p className="text-sm font-bold text-[#6b5a50]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[#24130f]">
        {value}
      </p>
      {helperText && (
        <p className="mt-2 text-sm leading-6 text-[#6b5a50]">{helperText}</p>
      )}
    </article>
  );
}
