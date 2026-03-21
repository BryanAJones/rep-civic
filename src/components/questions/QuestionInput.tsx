import { useState } from 'react';
import './QuestionInput.css';

interface QuestionInputProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function QuestionInput({ placeholder = 'Ask your own question...', onSubmit }: QuestionInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="question-input">
      <input
        className="question-input__field"
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="question-input__submit"
        onClick={handleSubmit}
        disabled={!text.trim()}
        type="button"
      >
        Submit
      </button>
    </div>
  );
}
