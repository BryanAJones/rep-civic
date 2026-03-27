import type { Topic } from '../../types/domain';
import { MonoText } from '../primitives';
import { QuestionRow } from '../questions';
import { QuestionInput } from '../questions';
import './TopicCard.css';

interface TopicCardProps {
  topic: Topic;
  onVote: (questionId: string) => void;
  onSubmit: (text: string) => void;
}

export function TopicCard({ topic, onVote, onSubmit }: TopicCardProps) {
  return (
    <div className="topic-card">
      <div className="topic-card__header">
        <span className="topic-card__title">{topic.title}</span>
        <span className="topic-card__badge">
          <MonoText size={7} opacity={0.6}>{topic.sourceBadge}</MonoText>
        </span>
      </div>

      <div className="topic-card__questions">
        {topic.questions.map((q) => (
          <QuestionRow key={q.id} question={q} onVote={onVote} />
        ))}
      </div>

      <div className="topic-card__ask">
        <QuestionInput
          placeholder="Ask about this topic..."
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
