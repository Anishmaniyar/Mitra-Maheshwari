interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}