import type { DebateChain as DebateChainType, Video, Candidate } from '../../types/domain';
import { buildChainTree, type ChainTreeNode } from '../../utils/buildChainTree';
import { ChainNodeCard } from './ChainNodeCard';
import { ChainRespondChips } from './ChainRespondChips';
import { MonoText } from '../primitives';
import './DebateChain.css';

interface DebateChainProps {
  chain: DebateChainType;
  videos: Record<string, Video>;
  candidates: Record<string, Candidate>;
}

export function DebateChainView({ chain, videos, candidates }: DebateChainProps) {
  const roots = buildChainTree(chain.nodes);

  const candidateNames: Record<string, string> = {};
  for (const p of chain.participants) {
    candidateNames[p.candidateId] =
      candidates[p.candidateId]?.name ?? p.candidateId;
  }

  function renderNode(node: ChainTreeNode) {
    const video = videos[node.videoId];
    const candidate = candidates[node.candidateId];

    return (
      <div key={node.videoId}>
        <ChainNodeCard
          node={node}
          candidateName={candidate?.name ?? node.candidateId}
          candidateInitials={candidate?.initials ?? '??'}
          caption={video?.caption ?? ''}
        />
        {node.children.map(renderNode)}
      </div>
    );
  }

  return (
    <div className="debate-chain">
      <div className="debate-chain__header">
        <h2 className="debate-chain__topic">{chain.topicLabel}</h2>
        <MonoText size={11} opacity={0.6}>
          {chain.districtCode}
        </MonoText>
      </div>

      <div className="debate-chain__tree">
        {roots.map(renderNode)}
      </div>

      <ChainRespondChips
        participants={chain.participants}
        candidateNames={candidateNames}
      />

      <div className="debate-chain__stats">
        <MonoText size={11}>{chain.totalQuestions} questions from constituents</MonoText>
      </div>
    </div>
  );
}
