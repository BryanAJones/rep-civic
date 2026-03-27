import type { ChainParticipant } from '../../types/domain';
import { Tag, MonoText } from '../primitives';
import './ChainRespondChips.css';

interface ChainRespondChipsProps {
  participants: ChainParticipant[];
  candidateNames: Record<string, string>;
}

export function ChainRespondChips({
  participants,
  candidateNames,
}: ChainRespondChipsProps) {
  const canRespond = participants.filter(
    (p) => p.responsesUsed < p.responsesAllowed,
  );

  if (canRespond.length === 0) return null;

  return (
    <div className="chain-respond-chips">
      <span className="chain-respond-chips__label">Can respond</span>
      <div className="chain-respond-chips__list">
        {canRespond.map((p) => (
          <div key={p.candidateId} className="chain-respond-chips__chip">
            <Tag
              label={candidateNames[p.candidateId] ?? p.candidateId}
              variant="blue"
            />
            <MonoText size={10} opacity={0.6}>
              {p.responsesAllowed - p.responsesUsed} remaining
            </MonoText>
          </div>
        ))}
      </div>
    </div>
  );
}
