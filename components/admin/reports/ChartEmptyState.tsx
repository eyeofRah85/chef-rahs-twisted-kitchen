type ChartEmptyStateProps = {
  title: string;
  message: string;
};

export function ChartEmptyState({ title, message }: ChartEmptyStateProps) {
  return (
    <div className="admin-card-muted flex min-h-48 flex-col items-center justify-center p-6 text-center">
      <p className="text-lg font-black text-[#24130f]">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#6b5a50]">
        {message}
      </p>
    </div>
  );
}
