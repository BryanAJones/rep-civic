export function FeedPage() {
  return (
    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      <p style={{
        fontFamily: 'var(--rep-font-ui)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}>
        Video feed
      </p>
      <p style={{
        fontFamily: 'var(--rep-font-display)',
        fontStyle: 'italic',
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
      }}>
        Coming in Phase 4.
      </p>
    </div>
  );
}
