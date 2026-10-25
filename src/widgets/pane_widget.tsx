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
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{bundle.region.label}</h1>
      <p className="rn-clr-content-secondary" style={{ fontSize: 12.5, marginBottom: 10, opacity: 0.75 }}>
        {bundle.biome.label}
        {bundle.biomeOverride == null && ' · following the season'}
      </p>
      {/* Every region's own primary biome now has real trees through `mfEnvs.ts`'s
          registry (Phase 3) — Australia's eucalypt woodland plus one biome per other
          region. Any OTHER biome within a region (Australia has six; everywhere else has
          two) still draws the vendored engine's own default trees regardless of which is
          picked here. The choice is saved either way (`useGrove.ts`'s biome override),
          ready as each remaining biome gets its own environment. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {bundle.region.biomes.map((b, i) => {
          const active = i === bundle.biomeIndex;
          return (
            <button
              key={b.key}
              onClick={() => bundle.setBiome(i)}
              title={b.note}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
                cursor: 'pointer',
                border: active ? '1px solid var(--rn-clr-accent-primary, #6a8f5a)' : '1px solid var(--rn-clr-border-light, rgba(128,128,128,0.3))',
                background: active ? 'var(--rn-clr-accent-primary, #6a8f5a)' : 'transparent',
                color: active ? '#fff' : 'inherit',
                opacity: active ? 1 : 0.8,
              }}
            >
              {b.label}
            </button>
          );
        })}
        {bundle.biomeOverride != null && (
          <button
            onClick={() => bundle.setBiome(null)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 999,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              textDecoration: 'underline',
              opacity: 0.7,
            }}
          >
            Follow the season
          </button>
        )}
      </div>
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
