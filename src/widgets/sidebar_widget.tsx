import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { HeatmapView } from './HeatmapView';
import { useGrove } from './useGrove';
import { resolveMood } from './mood';
import '../style.css';

function SidebarWidget() {
  const bundle = useGrove();
  if (bundle.loading) return <div style={{ padding: 12, fontSize: 12 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 12, fontSize: 12, color: '#c0392b' }}>Memory Garden: {bundle.error}</div>;
  if (!bundle.settings.showSidebar) return null;
  return (
    <div>
      {bundle.region.biomes.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px 0' }}>
          {bundle.region.biomes.map((b, i) => {
            const active = i === bundle.biomeIndex;
            return (
              <button
                key={b.key}
                onClick={() => bundle.setBiome(i)}
                title={b.note}
                style={{
                  fontSize: 10.5,
                  padding: '2px 7px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  border: active ? '1px solid var(--rn-clr-accent-primary, #6a8f5a)' : '1px solid var(--rn-clr-border-light, rgba(128,128,128,0.3))',
                  background: active ? 'var(--rn-clr-accent-primary, #6a8f5a)' : 'transparent',
                  color: active ? '#fff' : 'inherit',
                  opacity: active ? 1 : 0.75,
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      )}
      <GroveCanvas bundle={bundle} height={200} />
      <div style={{ padding: '6px 8px', overflowX: 'auto' }}>
        <HeatmapView
          grove={bundle.grove}
          calendar={bundle.calendar}
          dueByDay={bundle.dueByDay}
          mood={resolveMood(bundle)}
          compact
          cellSize={6}
        />
      </div>
      {/* No in-widget "open full view" button here: calling plugin.window.openWidgetInPane
       * from inside an already-mounted widget turned out to corrupt RemNote's own pane
       * window-string state (a "Cannot parse window string" error that broke folder
       * navigation entirely until RemNote was reloaded) — not a cosmetic bug, a real one.
       * The "Open Memory Garden" command (omnibar / Cmd-K) is the one supported way in. */}
    </div>
  );
}

renderWidget(SidebarWidget);
