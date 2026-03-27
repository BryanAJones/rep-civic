import './PositionsList.css';

interface PositionsListProps {
  positions: string[];
}

export function PositionsList({ positions }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <p className="positions-list__empty">No positions listed yet.</p>
    );
  }

  return (
    <ul className="positions-list">
      {positions.map((position, i) => (
        <li key={i} className="positions-list__item">{position}</li>
      ))}
    </ul>
  );
}
