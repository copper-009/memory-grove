import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { HeatmapView } from './HeatmapView';
import { useGrove } from './useGrove';
import { resolveMood } from './mood';
import '../style.css';

/** The dedicated "Grove" page, opened via command / omnibar. */
function PaneWidget() {
  const bundle = useGrove();
  if (bundle.loading) return <div style={{ padding: 24 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 24, color: '#c0392b' }}>Memory Grove: {bundle.error}</div>;

  return (
    // No tight maxWidth here: the grove is a wide-format scene, and capping it at a
    // text-reading width (the original 1000px) just left dead space on either side of it
    // in a wide pane. 1800px is still a sane ceiling on an ultrawide display.
    <div style={{ padding: 16, maxWidth: 1800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>{bundle.region.label}</h1>
      <GroveCanvas bundle={bundle} height={480} />
      <div className="memory-grove-stats-row" style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 13 }}>
        <div>
          <b>{bundle.grove.stats.plants}</b> plants · <b>{bundle.grove.stats.cards}</b> cards
        </div>
        <div>
          Streak: <b>{bundle.grove.stats.streak}</b> days (longest {bundle.grove.stats.longestStreak})
        </div>
        <div>
          Ecosystem health: <b>{Math.round(bundle.health.visual)}</b>/100
        </div>
      </div>
      <div style={{ marginTop: 20, overflowX: 'auto' }}>
        <HeatmapView
          grove={bundle.grove}
          calendar={bundle.calendar}
          dueByDay={bundle.dueByDay}
          mood={resolveMood(bundle)}
          cellSize={9}
          daysBack={365}
        />
      </div>
    </div>
  );
}

renderWidget(PaneWidget);
