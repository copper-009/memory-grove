import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { HeatmapView } from './HeatmapView';
import { useGrove } from './useGrove';
import { resolveMood } from './mood';
import '../style.css';

function SidebarWidget() {
  const bundle = useGrove();
  if (bundle.loading) return <div style={{ padding: 12, fontSize: 12 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 12, fontSize: 12, color: '#c0392b' }}>Memory Grove: {bundle.error}</div>;
  if (!bundle.settings.showSidebar) return null;
  return (
    <div>
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
       * The "Open Memory Grove" command (omnibar / Cmd-K) is the one supported way in. */}
    </div>
  );
}

renderWidget(SidebarWidget);
