import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  return (
    <div className="state" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}