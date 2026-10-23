import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { useGrove } from './useGrove';
import '../style.css';

function SidebarWidget() {
  const bundle = useGrove();
  if (bundle.loading) return <div style={{ padding: 12, fontSize: 12 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 12, fontSize: 12, color: '#c0392b' }}>Memory Grove: {bundle.error}</div>;
  return <GroveCanvas bundle={bundle} height={200} />;
}

renderWidget(SidebarWidget);
