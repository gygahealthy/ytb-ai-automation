interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "No Preview Available" }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <p className="text-gray-500 dark:text-gray-400 text-lg">{message}</p>
    </div>
  );
}
