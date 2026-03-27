import { render, screen } from '@testing-library/react';
import { TopicCard } from './TopicCard';
import { buildQuestion } from '../../test/mock-data';
import type { Topic } from '../../types/domain';

describe('TopicCard', () => {
  const topic: Topic = {
    id: 'topic-1',
    candidateId: 'c-test',
    title: 'School Overcrowding',
    sourceBadge: 'APS enrollment data',
    questions: [
      buildQuestion({ id: 'q-1', text: 'What is your plan?', topicId: 'topic-1' }),
      buildQuestion({ id: 'q-2', text: 'When will action be taken?', topicId: 'topic-1' }),
    ],
  };

  it('renders the topic title', () => {
    render(<TopicCard topic={topic} onVote={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('School Overcrowding')).toBeInTheDocument();
  });

  it('renders the source badge', () => {
    render(<TopicCard topic={topic} onVote={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('APS enrollment data')).toBeInTheDocument();
  });

  it('renders a QuestionRow for each question', () => {
    render(<TopicCard topic={topic} onVote={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('What is your plan?')).toBeInTheDocument();
    expect(screen.getByText('When will action be taken?')).toBeInTheDocument();
  });
});
