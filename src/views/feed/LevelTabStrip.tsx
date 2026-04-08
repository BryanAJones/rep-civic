import type { LevelTab } from '../../hooks/useDistrictLevels';
import './LevelTabStrip.css';

interface LevelTabStripProps {
  tabs: LevelTab[];
  /** Fractional progress (0 = first tab, 1 = second tab, etc.) */
  progress: number;
  onTabPress: (index: number) => void;
}

export function LevelTabStrip({ tabs, progress, onTabPress }: LevelTabStripProps) {
  if (tabs.length <= 1) return null;

  const activeIndex = Math.round(progress);

  // The track holds all labels side by side and slides with the content
  const trackOffset = -(progress * 100);

  return (
    <div className="level-tab-strip">
      <div
        className="level-tab-strip__track"
        style={{ transform: `translateX(${trackOffset}%)` }}
      >
        {tabs.map((tab, i) => {
          const distance = Math.abs(progress - i);
          // Fade labels as they slide away: 1.0 at center, 0.0 at ±1 position
          const opacity = Math.max(0, 1 - distance);

          return (
            <button
              key={tab.level ?? 'all'}
              className="level-tab-strip__label"
              style={{ opacity }}
              onClick={() => onTabPress(i)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Navigation row: arrows (desktop only) + dot indicators */}
      <div className="level-tab-strip__nav">
        <button
          className="level-tab-strip__arrow"
          onClick={() => onTabPress(activeIndex - 1)}
          type="button"
          aria-label="Previous"
          disabled={activeIndex === 0}
        >
          {'\u2039'}
        </button>

        <div className="level-tab-strip__dots">
          {tabs.map((tab, i) => {
            const distance = Math.abs(progress - i);
            const isActive = distance < 0.5;
            return (
              <button
                key={tab.level ?? 'all'}
                className={`level-tab-strip__dot${isActive ? ' level-tab-strip__dot--active' : ''}`}
                onClick={() => onTabPress(i)}
                type="button"
                aria-label={tab.label}
              />
            );
          })}
        </div>

        <button
          className="level-tab-strip__arrow"
          onClick={() => onTabPress(activeIndex + 1)}
          type="button"
          aria-label="Next"
          disabled={activeIndex === tabs.length - 1}
        >
          {'\u203A'}
        </button>
      </div>
    </div>
  );
}
