import { declareIndexPlugin, WidgetLocation, type ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import { registerSettings } from './settings';
import { startPause, endPause, pauseActive } from '../data/calendar';
import { loadStudyCalendar, saveStudyCalendar } from './groveBuilder';
import { isoToDay, dayIndex } from '../data/day';

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  await registerSettings(plugin);

  // -- Widgets, one per placement from the brief -----------------------
  await plugin.app.registerWidget('sidebar_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });
  await plugin.app.registerWidget('queue_widget', WidgetLocation.QueueBelowTopBar, {
    dimensions: { height: 'auto', width: '100%' },
  });
  await plugin.app.registerWidget('pane_widget', WidgetLocation.Pane, {
    dimensions: { height: 'auto', width: '100%' },
  });
  await plugin.app.registerWidget('learning_progress_widget', WidgetLocation.LearningProgressPage, {
    dimensions: { height: 'auto', width: '100%' },
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
    id: 'memory-grove.change-scenery',
    name: 'Change Memory Grove scenery',
    action: async () => {
      const options = ['natural', 'misty_valley', 'aurora', 'lanterns', 'bamboo', 'synthwave'];
      const current = (await plugin.settings.getSetting<string>('scenery.environment')) ?? 'natural';
      const next = options[(options.indexOf(current) + 1) % options.length];
      await plugin.storage.setSynced('scenery.environment.override', next);
      await plugin.app.toast(`Scenery: ${next}`);
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
