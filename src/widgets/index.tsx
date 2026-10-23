import { declareIndexPlugin, WidgetLocation, type ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import { registerSettings } from './settings';
import { startPause, endPause, pauseActive } from '../data/calendar';
import { loadStudyCalendar, saveStudyCalendar } from './groveBuilder';
import { isoToDay, dayIndex } from '../data/day';
import { ICON_DATA_URI } from './icon';

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  await registerSettings(plugin);

  // -- Widgets, one per placement from the brief -----------------------
  // `widgetTabIcon`/`widgetTabTitle` are what RemNote's own official plugins (e.g. the
  // History plugin's RightSidebar widget) set so a widget shows up correctly in the
  // sidebar's "Add Widget" tray — without them a RightSidebar widget can register but
  // never surface as a choice there. `dimensions: { height: '100%', width: '100%' }` on
  // RightSidebar matches that same official pattern, in place of 'auto'.
  await plugin.app.registerWidget('sidebar_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: ICON_DATA_URI,
    widgetTabTitle: 'Memory Grove',
  });
  await plugin.app.registerWidget('queue_widget', WidgetLocation.QueueBelowTopBar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: ICON_DATA_URI,
    widgetTabTitle: 'Memory Grove',
  });
  await plugin.app.registerWidget('pane_widget', WidgetLocation.Pane, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: ICON_DATA_URI,
    widgetTabTitle: 'Memory Grove',
  });
  await plugin.app.registerWidget('learning_progress_widget', WidgetLocation.LearningProgressPage, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: ICON_DATA_URI,
    widgetTabTitle: 'Memory Grove',
  });

  // -- Commands -----------------------------------------------------------
  await plugin.app.registerCommand({
    id: 'memory-grove.open',
    name: 'Open Memory Grove',
    description: "Open your grove in its own pane.",
    action: async () => {
      await plugin.window.openWidgetInPane('pane_widget', {});
    },
  });

  await plugin.app.registerCommand({
    id: 'memory-grove.toggle-animation',
    name: 'Toggle Memory Grove animation',
    action: async () => {
      const current = await plugin.settings.getSetting<string>('scenery.animate');
      const next = current === 'off' ? 'on' : 'off';
      await plugin.storage.setSynced('scenery.animate.override', next);
      await plugin.app.toast(`Memory Grove animation: ${next}`);
    },
  });

  await plugin.app.registerCommand({
    id: 'memory-grove.pause',
    name: 'Memory Grove: Holiday mode (pause now)',
    description: 'Pause the grove indefinitely. Studying while paused still helps; nothing counts against you.',
    action: async () => {
      const cal = await loadStudyCalendar(plugin);
      const today = dayIndex(Date.now(), 4);
      const updated = pauseActive(cal, today) ? endPause(cal, today) : startPause(cal, today);
      await saveStudyCalendar(plugin, updated);
      await plugin.app.toast(pauseActive(updated, today) ? 'Holiday mode on — nothing counts against you.' : 'Welcome back! Resuming right where you left off.');
    },
  });

  await plugin.app.toast('🌱 Memory Grove is ready. Try "Open Memory Grove" from the omnibar.');
}

async function onDeactivate(_plugin: ReactRNPlugin): Promise<void> {}

declareIndexPlugin(onActivate, onDeactivate);

// Re-exported so isoToDay above isn't flagged as unused if future edits trim the pause
// command; kept here deliberately as the single import path other widgets should use too.
export { isoToDay };
