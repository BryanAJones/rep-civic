import { MonoText } from '../primitives';
import { QuestionInput } from '../questions';
import './GeneralQuestionBox.css';

interface GeneralQuestionBoxProps {
  candidateName: string;
  questionCount: number;
  onSubmit: (text: string) => void;
}

export function GeneralQuestionBox({
  candidateName,
  questionCount,
  onSubmit,
}: GeneralQuestionBoxProps) {
  return (
    <div className="general-q-box">
      <div className="general-q-box__header">
        <span className="general-q-box__title">
          General questions for {candidateName}
        </span>
        <MonoText size={10} color="var(--rep-gold)">{questionCount}</MonoText>
      </div>
      <QuestionInput
        placeholder={`Ask ${candidateName} a question...`}
        onSubmit={onSubmit}
      />
    </div>
  );
}
