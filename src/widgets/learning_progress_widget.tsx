import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { useGrove } from './useGrove';
import '../style.css';

/**
 * Bonus placement: RemNote's own Learning Progress page is a natural home for this.
 * Styled to match the page's own stat cards (a bordered, padded panel with a heading and a
 * one-line description) rather than sitting underneath them as a loose image — and
 * respects `forest.showOnLearningProgress`, so it can be turned off there without hiding
 * the plugin everywhere else.
 */
function LearningProgressWidget() {
  const bundle = useGrove();
  if (bundle.loading || bundle.error) return null;
  if (!bundle.settings.showOnLearningProgress) return null;

  return (
    <div
      className="rn-clr-background-primary"
      style={{
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 12,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Memory Grove</h3>
      <p className="rn-clr-content-secondary" style={{ fontSize: 12.5, marginBottom: 10, opacity: 0.75 }}>
        {bundle.grove.stats.plants} plants · {bundle.grove.stats.streak}-day streak · ecosystem health{' '}
        {Math.round(bundle.health.visual)}/100
      </p>
      <div style={{ borderRadius: 6, overflow: 'hidden' }}>
        <GroveCanvas bundle={bundle} height={220} />
      </div>
    </div>
  );
}

renderWidget(LearningProgressWidget);
