import { renderWidget, usePlugin, useRunAsync, QueueItemType } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { useGrove } from './useGrove';
import '../style.css';

/** Shown only once the queue has nothing left — the "finished queue" placement from the brief. */
function QueueWidget() {
  const plugin = usePlugin();
  const bundle = useGrove();
  const screenType = useRunAsync(() => plugin.queue.getCurrentQueueScreenType(), []);
  const remaining = useRunAsync(() => plugin.queue.getNumRemainingCards(), []);

  const finished = remaining === 0 || screenType === undefined || screenType === QueueItemType.DailyCheckpoint;
  if (!bundle.settings?.showOnFinishedQueue && bundle.settings) return null;
  if (!finished) return null;
  if (bundle.loading || bundle.error) return null;

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>🌱 Today's growth, in your grove</div>
      <GroveCanvas bundle={bundle} height={180} />
    </div>
  );
}

renderWidget(QueueWidget);
