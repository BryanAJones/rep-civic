import { useRef, useState } from 'react';
import { MonoText } from '../../components/primitives';
import type { Question, QuestionId, Video } from '../../types/domain';
import './InboxQuestionRow.css';

interface InboxQuestionRowProps {
  question: Question;
  onSubmitAnswer: (questionId: QuestionId, file: File, caption?: string) => Promise<Video>;
}

const MAX_BYTES = 100 * 1024 * 1024;

type State =
  | { kind: 'idle' }
  | { kind: 'selected'; file: File }
  | { kind: 'uploading' }
  | { kind: 'error'; message: string };

export function InboxQuestionRow({ question, onSubmitAnswer }: InboxQuestionRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [caption, setCaption] = useState('');

  const isAnswered = question.state === 'answered';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setState({ kind: 'error', message: 'Video must be under 100MB.' });
      return;
    }
    setState({ kind: 'selected', file });
  };

  const handleSubmit = async () => {
    if (state.kind !== 'selected') return;
    const file = state.file;
    setState({ kind: 'uploading' });
    try {
      await onSubmitAnswer(question.id, file, caption.trim() || undefined);
      setState({ kind: 'idle' });
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Upload failed' });
    }
  };

  return (
    <article className={`inbox-row ${isAnswered ? 'inbox-row--answered' : ''}`}>
      <div className="inbox-row__head">
        <div className="inbox-row__plus-one">
          <MonoText size={11} color="var(--rep-gold)">+{question.plusOneCount}</MonoText>
        </div>
        <div className="inbox-row__body">
          <p className="inbox-row__text">{question.text}</p>
          <div className="inbox-row__meta">
            <MonoText size={10} opacity={0.5}>{question.authorHandle}</MonoText>
            {question.isSeed && (
              <MonoText size={10} color="var(--rep-gold)">SUGGESTED BY REP.</MonoText>
            )}
            {isAnswered && (
              <MonoText size={10} color="var(--rep-green)">ANSWERED</MonoText>
            )}
          </div>
        </div>
      </div>

      {!isAnswered && (
        <div className="inbox-row__compose">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            capture="user"
            className="inbox-row__file"
            onChange={handleFileChange}
            disabled={state.kind === 'uploading'}
          />
          {state.kind === 'selected' && (
            <>
              <input
                type="text"
                className="inbox-row__caption"
                placeholder="Optional caption..."
                value={caption}
                maxLength={280}
                onChange={(e) => setCaption(e.target.value)}
              />
              <button
                type="button"
                className="inbox-row__submit"
                onClick={handleSubmit}
              >
                Publish answer
              </button>
            </>
          )}
          {state.kind === 'uploading' && (
            <span className="inbox-row__status">Uploading...</span>
          )}
          {state.kind === 'error' && (
            <span className="inbox-row__status inbox-row__status--error">{state.message}</span>
          )}
        </div>
      )}
    </article>
  );
}
