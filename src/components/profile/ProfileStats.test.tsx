import { render, screen } from '@testing-library/react';
import { ProfileStats } from './ProfileStats';
import type { UnclaimedCandidate, ClaimedCandidate, ActiveCandidate } from '../../types/domain';

const unclaimed: UnclaimedCandidate = {
  id: 'c-1',
  name: 'Test',
  initials: 'T',
  officeTitle: 'Office',
  districtCode: 'D-1',
  party: 'Ind',
  status: 'unclaimed',
  filingId: 'F-001',
  filingDate: '2026-01-01',
  opponentCount: 1,
  questionCount: 47,
};

const claimed: ClaimedCandidate = {
  id: 'c-2',
  name: 'Test Claimed',
  initials: 'TC',
  officeTitle: 'Office',
  districtCode: 'D-2',
  party: 'Dem',
  status: 'claimed',
  videoCount: 0,
  questionCount: 19,
  positions: [],
};

const active: ActiveCandidate = {
  id: 'c-3',
  name: 'Test Active',
  initials: 'TA',
  officeTitle: 'Office',
  districtCode: 'D-3',
  party: 'Rep',
  status: 'active',
  videoCount: 8,
  answeredQuestionCount: 12,
  responseRate: 71,
  positions: [],
};

describe('ProfileStats', () => {
  it('shows em dash for Videos and Response rate on unclaimed', () => {
    render(<ProfileStats candidate={unclaimed} />);

    // Should show em dashes (—) for Videos and Response rate
    const dashes = screen.getAllByText('\u2014');
    expect(dashes).toHaveLength(2);

    // Should show the question count
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('shows 0 videos, question count, and em dash for response rate on claimed', () => {
    render(<ProfileStats candidate={claimed} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();

    // One em dash for response rate only
    const dashes = screen.getAllByText('\u2014');
    expect(dashes).toHaveLength(1);
  });

  it('shows real numbers for all stats on active', () => {
    render(<ProfileStats candidate={active} />);

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();

    // No em dashes
    expect(screen.queryByText('\u2014')).not.toBeInTheDocument();
  });

  it('shows stat labels', () => {
    render(<ProfileStats candidate={active} />);

    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('Response rate')).toBeInTheDocument();
  });
});
