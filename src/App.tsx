import {
  Avatar,
  EmDash,
  GoldRule,
  Logotype,
  MonoText,
  PlusOneButton,
  ScanlineOverlay,
  StatusPill,
  Tag,
} from './components/primitives';

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      {/* Logotype variants */}
      <div style={{ background: 'var(--rep-navy)', padding: '1.5rem', marginBottom: '1px' }}>
        <Logotype size={48} onDark />
      </div>
      <div style={{ background: 'var(--rep-white)', padding: '1.5rem', border: '1px solid var(--rep-rule)' }}>
        <Logotype size={48} />
      </div>
      <GoldRule />

      <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* MonoText */}
        <div>
          <MonoText size={12} color="var(--rep-blue-mid)">
            GA-SEN-D40 · Filed 2026-03-03 · GA SOS #0044821
          </MonoText>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag label="Your rep" variant="navy" />
          <Tag label="Response to opponent" variant="blue" />
          <Tag label="Awaiting reply" variant="gold" />
          <Tag label="Unclaimed" variant="mist" />
          <Tag label="Q&A reply" variant="green" />
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          <StatusPill variant="unclaimed" />
          <StatusPill variant="claimed" />
        </div>

        {/* Avatars */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar initials="SR" variant="claimed" size={46} />
          <Avatar initials="TB" variant="unclaimed" size={46} />
          <Avatar initials="MJ" variant="claimed" size={32} />
        </div>

        {/* EmDash for absent data */}
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--rep-font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--rep-steel)', marginBottom: 4 }}>Videos</div>
            <EmDash />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--rep-font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--rep-steel)', marginBottom: 4 }}>Response rate</div>
            <EmDash />
          </div>
        </div>

        {/* PlusOneButton — all 3 states */}
        <div
          style={{
            background: 'var(--rep-dark-bg)',
            borderRadius: 'var(--rep-radius)',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ScanlineOverlay />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--rep-font-ui)', fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Default</div>
              <PlusOneButton state="default" count={18} onVote={() => {}} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--rep-font-ui)', fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Voted</div>
              <PlusOneButton state="voted" count={31} onVote={() => {}} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--rep-font-ui)', fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Answered</div>
              <PlusOneButton state="answered" count={12} onWatchReply={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
