import type { ChainTreeNode } from '../../utils/buildChainTree';
import { Avatar, MonoText } from '../primitives';
import './ChainNodeCard.css';

interface ChainNodeCardProps {
  node: ChainTreeNode;
  candidateName: string;
  candidateInitials: string;
  caption: string;
}

export function ChainNodeCard({
  node,
  candidateName,
  candidateInitials,
  caption,
}: ChainNodeCardProps) {
  return (
    <div
      className="chain-node-card"
      style={{ marginLeft: node.depth * 24 }}
    >
      <div className="chain-node-card__connector" />
      <div className="chain-node-card__content">
        <div className="chain-node-card__header">
          <Avatar
            initials={candidateInitials}
            variant="claimed"
            size={32}
          />
          <span className="chain-node-card__name">{candidateName}</span>
          <MonoText size={10} opacity={0.5}>depth {node.depth}</MonoText>
        </div>
        <p className="chain-node-card__caption">{caption}</p>
      </div>
    </div>
  );
}
