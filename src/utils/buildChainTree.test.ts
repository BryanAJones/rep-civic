import type { ChainNode } from '../types/domain';
import { buildChainTree } from './buildChainTree';

describe('buildChainTree', () => {
  it('returns an empty array for empty input', () => {
    expect(buildChainTree([])).toEqual([]);
  });

  it('places a single root node with no parent', () => {
    const nodes: ChainNode[] = [
      { videoId: 'v-1', candidateId: 'c-1', depth: 0 },
    ];

    const result = buildChainTree(nodes);

    expect(result).toHaveLength(1);
    expect(result[0]!.videoId).toBe('v-1');
    expect(result[0]!.parentVideoId).toBeUndefined();
    expect(result[0]!.children).toEqual([]);
  });

  it('nests a child under its parent', () => {
    const nodes: ChainNode[] = [
      { videoId: 'v-1', candidateId: 'c-1', depth: 0 },
      { videoId: 'v-2', candidateId: 'c-2', parentVideoId: 'v-1', depth: 1 },
    ];

    const result = buildChainTree(nodes);

    expect(result).toHaveLength(1);
    expect(result[0]!.children).toHaveLength(1);
    expect(result[0]!.children[0]!.videoId).toBe('v-2');
    expect(result[0]!.children[0]!.children).toEqual([]);
  });

  it('handles max depth (3+ levels)', () => {
    const nodes: ChainNode[] = [
      { videoId: 'v-1', candidateId: 'c-1', depth: 0 },
      { videoId: 'v-2', candidateId: 'c-2', parentVideoId: 'v-1', depth: 1 },
      { videoId: 'v-3', candidateId: 'c-1', parentVideoId: 'v-2', depth: 2 },
    ];

    const result = buildChainTree(nodes);

    expect(result).toHaveLength(1);
    const level1 = result[0]!.children[0]!;
    expect(level1.videoId).toBe('v-2');
    const level2 = level1.children[0]!;
    expect(level2.videoId).toBe('v-3');
    expect(level2.children).toEqual([]);
  });

  it('handles unordered input', () => {
    const nodes: ChainNode[] = [
      { videoId: 'v-2', candidateId: 'c-2', parentVideoId: 'v-1', depth: 1 },
      { videoId: 'v-1', candidateId: 'c-1', depth: 0 },
    ];

    const result = buildChainTree(nodes);

    expect(result).toHaveLength(1);
    expect(result[0]!.videoId).toBe('v-1');
    expect(result[0]!.children).toHaveLength(1);
    expect(result[0]!.children[0]!.videoId).toBe('v-2');
  });

  it('treats orphan nodes (missing parent) as roots', () => {
    const nodes: ChainNode[] = [
      { videoId: 'v-1', candidateId: 'c-1', parentVideoId: 'v-missing', depth: 1 },
    ];

    const result = buildChainTree(nodes);

    expect(result).toHaveLength(1);
    expect(result[0]!.videoId).toBe('v-1');
  });

  it('supports multiple children under the same parent', () => {
    const nodes: ChainNode[] = [
      { videoId: 'v-1', candidateId: 'c-1', depth: 0 },
      { videoId: 'v-2', candidateId: 'c-2', parentVideoId: 'v-1', depth: 1 },
      { videoId: 'v-3', candidateId: 'c-3', parentVideoId: 'v-1', depth: 1 },
    ];

    const result = buildChainTree(nodes);

    expect(result).toHaveLength(1);
    expect(result[0]!.children).toHaveLength(2);
    expect(result[0]!.children.map((c) => c.videoId)).toEqual(['v-2', 'v-3']);
  });
});
