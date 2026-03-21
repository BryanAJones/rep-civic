export default function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1
        style={{
          fontFamily: 'var(--rep-font-display)',
          fontWeight: 700,
          fontSize: '3rem',
          color: 'var(--rep-navy)',
        }}
      >
        Rep<span style={{ color: 'var(--rep-gold)' }}>.</span>
      </h1>
      <p
        style={{
          fontFamily: 'var(--rep-font-ui)',
          color: 'var(--rep-steel)',
          marginTop: '0.5rem',
        }}
      >
        Foundation loaded. Styles, types, and services ready.
      </p>
      <p
        style={{
          fontFamily: 'var(--rep-font-mono)',
          fontSize: '0.75rem',
          color: 'var(--rep-steel)',
          marginTop: '1rem',
        }}
      >
        Phase 1 complete — ready for primitives.
      </p>
    </div>
  );
}
