import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { HeatmapView } from './HeatmapView';
import { useGrove } from './useGrove';
import { resolveMood } from './mood';
import { regionOptions } from '../regions';
import '../style.css';

/** The dedicated "Grove" page, opened via command / omnibar. */
function PaneWidget() {
  const bundle = useGrove();
  if (bundle.loading) return <div style={{ padding: 24 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 24, color: '#c0392b' }}>Memory Garden: {bundle.error}</div>;

  return (
    // No tight maxWidth here: the grove is a wide-format scene, and capping it at a
    // text-reading width (the original 1000px) just left dead space on either side of it
    // in a wide pane. 1800px is still a sane ceiling on an ultrawide display.
    <div style={{ padding: 16, maxWidth: 1800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {/* A quick region switch for testing every region's own trees/ground/sky without a
            trip to Settings → Plugins each time — RemNote's `registerDropdownSetting` has
            no API to change its value from a widget, so this is a separate override
            (`useGrove.ts`'s `REGION_OVERRIDE_KEY`), the same pattern the biome pills below
            already use, not a way to edit the registered setting itself. */}
        <select
          value={bundle.region.key}
          onChange={(e) => bundle.setRegion(e.target.value)}
          title="Switch region (for testing — the Settings page's own pick is separate)"
          style={{
            fontSize: 20, fontWeight: 600, border: 'none', background: 'transparent',
            cursor: 'pointer', padding: 0, color: 'inherit',
          }}
        >
          {regionOptions().map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
        {bundle.regionOverride != null && (
          <button
            onClick={() => bundle.setRegion(null)}
            style={{ fontSize: 12, padding: 0, border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer', opacity: 0.7 }}
          >
            Follow setting
          </button>
        )}
      </div>
      <p className="rn-clr-content-secondary" style={{ fontSize: 12.5, marginBottom: 10, opacity: 0.75 }}>
        {bundle.biome.label}
        {bundle.biomeOverride == null && ' · following the season'}
      </p>
      {/* Every biome in every region now has real trees through `mfEnvs.ts`'s registry
          (Phase 3) — picking anything here changes what's drawn, both kind-slots, every
          region, `palm` and `bulbous` species included (`_forms.js`'s `palmBody`/
          `bulbousBody`). The all-one-form `pt-beech.js`/`ea-riverine.js` are the only
          biomes still only covering one kind-slot's worth of real species — no conifer
          exists among either biome's own species, so their pine-kind slot stays on the
          engine's own generic default. Ground colour, hill colour, the landscape
          (lake/river/meadow/mountains, `mfLandscape.ts`) and a touch of the sky's own tint
          now follow the biome too (`_forms.js`'s `groundTheme`, blended rather than
          swapped — see its own comment for why). Creatures and time of day still don't. */}
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
