import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { HeatmapView } from './HeatmapView';
import { useGrove } from './useGrove';
import { resolveMood } from './mood';
import '../style.css';

/**
 * Bonus placement: RemNote's own Learning Progress page is a natural home for this.
 * Styled to match the page's own stat cards (a bordered, padded panel with a heading and a
 * one-line description) rather than sitting underneath them as a loose image — and
 * respects `forest.showOnLearningProgress`, so it can be turned off there without hiding
 * the plugin everywhere else.
 *
 * This card cannot be a genuine full-width banner pinned to the top of the page: RemNote
 * places every `LearningProgressPage` widget inside its own fixed-width grid cell on that
 * page, in whatever order RemNote itself decides, and the plugin SDK gives no option to
 * change either the cell's width or its position — `dimensions.width: '100%'` below fills
 * that cell, but can't make the cell itself any wider. That's a platform ceiling, not
 * something a different layout here can route around.
 *
 * There is deliberately no "Open full view" button here calling
 * `plugin.window.openWidgetInPane` from inside this already-mounted widget: that corrupted
 * RemNote's own pane window-string state in testing (a "Cannot parse window string" error
 * that broke folder navigation entirely until RemNote was reloaded) — a real functional
 * bug, not a cosmetic one. The "Open Memory Grove" command (omnibar / Cmd-K) is the one
 * supported way into the full page; this card still includes the heatmap for a fuller
 * picture without needing to leave the stats page at all.
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
      <div style={{ marginTop: 10, overflowX: 'auto' }}>
        <HeatmapView
          grove={bundle.grove}
          calendar={bundle.calendar}
          dueByDay={bundle.dueByDay}
          mood={resolveMood(bundle)}
          cellSize={7}
          daysBack={180}
          compact
        />
      </div>
    </div>
  );
}

renderWidget(LearningProgressWidget);
