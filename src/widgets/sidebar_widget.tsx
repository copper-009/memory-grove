import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { useGrove } from './useGrove';
import '../style.css';

function SidebarWidget() {
  const plugin = usePlugin();
  const bundle = useGrove();
  if (bundle.loading) return <div style={{ padding: 12, fontSize: 12 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 12, fontSize: 12, color: '#c0392b' }}>Memory Grove: {bundle.error}</div>;
  return (
    <div>
      <GroveCanvas bundle={bundle} height={200} />
      {/* A direct way into the full pane view, since RemNote commands only ever surface
       * through the omnibar — this is the everyday route, not Cmd/Ctrl+K every time. */}
      <button
        onClick={() => plugin.window.openWidgetInPane('pane_widget', {})}
        className="rn-clr-content-secondary"
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 12,
          background: 'none',
          border: 'none',
          borderTop: '1px solid var(--rn-clr-border-light, rgba(128,128,128,0.2))',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        Open full view →
      </button>
    </div>
  );
}

renderWidget(SidebarWidget);
