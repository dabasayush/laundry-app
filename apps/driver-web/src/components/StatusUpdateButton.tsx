'use client';

interface StatusUpdateButtonProps {
  status: string;
  onClick: () => void;
  disabled: boolean;
}

const statusButtonColors: Record<string, string> = {
  PICKED_UP: 'bg-purple-600 hover:bg-purple-700',
  PROCESSING: 'bg-indigo-600 hover:bg-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-600 hover:bg-orange-700',
  DELIVERED: 'bg-green-600 hover:bg-green-700',
  PICKUP_ASSIGNED: 'bg-blue-600 hover:bg-blue-700',
};

export default function StatusUpdateButton({
  status,
  onClick,
  disabled,
}: StatusUpdateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-white font-medium transition ${
        statusButtonColors[status] || 'bg-gray-600 hover:bg-gray-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      Mark as {status.replace(/_/g, ' ')}
    </button>
  );
}
