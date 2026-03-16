'use client';

import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import CharacterCounter from './CharacterCounter';
import { submitReview } from '../../lib/api/reviews';
import { redirectToGoogleOAuth } from '../../lib/api/auth-google';
import { getCustomerToken, isCustomerLoggedIn } from '../../lib/auth/customer-session';

interface ReviewFormProps {
  storeId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ storeId, onSubmitted }: ReviewFormProps) {
  const [stars, setStars] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Start false (matches SSR), set real value after mount to avoid hydration mismatch
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { setLoggedIn(isCustomerLoggedIn()); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedIn) {
      redirectToGoogleOAuth(window.location.pathname);
      return;
    }
    if (stars === 0) {
      setError('Vui lòng chọn số sao');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = getCustomerToken()!;
      await submitReview(storeId, { stars, content: content || undefined }, token);
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: any) {
      if (err?.status === 409) {
        setError('Bạn đã đánh giá gian hàng này rồi');
        setSubmitted(true);
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-700">
        {error ?? 'Cảm ơn bạn đã đánh giá!'}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Viết đánh giá</h3>
      <div className="mb-3">
        <StarRating value={stars} onChange={setStars} />
      </div>
      <div className="relative mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Chia sẻ trải nghiệm của bạn (tùy chọn)..."
          className="w-full resize-none rounded border border-gray-200 p-2 text-sm focus:border-orange-400 focus:outline-none"
        />
        <div className="absolute bottom-2 right-2">
          <CharacterCounter current={content.length} max={500} />
        </div>
      </div>
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {loading ? 'Đang gửi...' : loggedIn ? 'Gửi đánh giá' : 'Đăng nhập Google để đánh giá'}
      </button>
    </form>
  );
}
