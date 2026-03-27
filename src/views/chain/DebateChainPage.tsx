import { useParams } from 'react-router-dom';
import { DebateChainView } from '../../components/chain';
import { useDebateChain } from '../../hooks/useDebateChain';
import './DebateChainPage.css';

export function DebateChainPage() {
  const { chainId } = useParams<{ chainId: string }>();
  const { chain, videos, candidates, loading, error } = useDebateChain(chainId);

  if (loading) {
    return <div className="chain-page__loading">Loading chain...</div>;
  }

  if (error || !chain) {
    return <div className="chain-page__error">{error ?? 'Chain not found'}</div>;
  }

  return (
    <div className="chain-page">
      <DebateChainView
        chain={chain}
        videos={videos}
        candidates={candidates}
      />
    </div>
  );
}
