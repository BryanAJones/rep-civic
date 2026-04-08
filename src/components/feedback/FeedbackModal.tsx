import { useState } from 'react';
import { service } from '../../services';
import './FeedbackModal.css';

type Category = 'bug' | 'feature' | 'general';

interface FeedbackModalProps {
  page: string;
  onClose: () => void;
}

const categories: { id: Category; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'feature', label: 'Feature request' },
  { id: 'bug', label: 'Bug report' },
];

export function FeedbackModal({ page, onClose }: FeedbackModalProps) {
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await service.submitFeedback({
        text: text.trim(),
        category,
        email: email.trim() || undefined,
        page,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-backdrop" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="feedback-modal__done">
            <div className="feedback-modal__done-label">Received</div>
            <p className="feedback-modal__done-text">Thank you. Your feedback helps shape what gets built next.</p>
            <button className="feedback-modal__btn" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="feedback-modal__header">
              <span className="feedback-modal__title">Send feedback</span>
              <button className="feedback-modal__close" type="button" onClick={onClose} aria-label="Close">
                {'\u2715'}
              </button>
            </div>

            <div className="feedback-modal__categories">
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`feedback-modal__cat${category === c.id ? ' feedback-modal__cat--active' : ''}`}
                  type="button"
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <textarea
              className="feedback-modal__textarea"
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={4}
            />

            <input
              className="feedback-modal__email"
              type="email"
              placeholder="Email (optional, for follow-up)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
            />

            <div className="feedback-modal__footer">
              <span className="feedback-modal__page">From: {page}</span>
              <button
                className="feedback-modal__btn"
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
              >
                {submitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
