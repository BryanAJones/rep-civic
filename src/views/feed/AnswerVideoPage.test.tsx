import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createMockService } from '../../test/mock-service';
import { buildVideo, buildQuestion } from '../../test/mock-data';

const mockService = createMockService();

vi.mock('../../services', () => ({
  service: mockService,
}));

const { AnswerVideoPage } = await import('./AnswerVideoPage');

function renderAtRoute(videoId: string, answerId: string) {
  return render(
    <MemoryRouter initialEntries={[`/app/feed/video/${videoId}/answer/${answerId}`]}>
      <Routes>
        <Route
          path="/app/feed/video/:videoId/answer/:answerId"
          element={<AnswerVideoPage />}
        />
        <Route
          path="/app/feed"
          element={<div data-testid="feed-page">Feed</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AnswerVideoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays the answer video', async () => {
    const answerVideo = buildVideo({
      id: 'v-answer',
      postType: 'qa-reply',
      caption: 'Great question about pre-K',
      answersQuestionId: 'q-1',
    });
    mockService.getVideo = vi.fn().mockResolvedValue(answerVideo);
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue([]);

    renderAtRoute('v-parent', 'v-answer');

    await waitFor(() => {
      expect(screen.getByText(/Great question about pre-K/)).toBeInTheDocument();
    });
    expect(screen.getByText('Q&A reply')).toBeInTheDocument();
  });

  it('shows the QuestionContextBanner with the original question', async () => {
    const answerVideo = buildVideo({ id: 'v-answer', answersQuestionId: 'q-1' });
    const originalQuestion = buildQuestion({
      id: 'q-1',
      text: 'Are there plans to expand pre-K?',
      answerVideoId: 'v-answer',
      state: 'answered',
    });
    mockService.getVideo = vi.fn().mockResolvedValue(answerVideo);
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue([originalQuestion]);

    renderAtRoute('v-parent', 'v-answer');

    await waitFor(() => {
      expect(screen.getByText('Answering')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Are there plans to expand pre-K?'),
    ).toBeInTheDocument();
  });

  it('back button navigates to feed', async () => {
    mockService.getVideo = vi.fn().mockResolvedValue(
      buildVideo({ id: 'v-answer' }),
    );
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue([]);

    renderAtRoute('v-parent', 'v-answer');

    await waitFor(() => {
      expect(screen.getByText('Back to feed')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Back to feed').closest('button')!);

    expect(screen.getByTestId('feed-page')).toBeInTheDocument();
  });

  it('shows error state when video not found', async () => {
    mockService.getVideo = vi.fn().mockRejectedValue(new Error('Video not found'));
    mockService.getQuestionsForVideo = vi.fn().mockResolvedValue([]);

    renderAtRoute('v-parent', 'v-missing');

    await waitFor(() => {
      expect(screen.getByText('Video not found')).toBeInTheDocument();
    });
  });
});
