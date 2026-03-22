'use client';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly || !onChange}
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-colors ${
            readonly || !onChange ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          aria-label={`${star} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
