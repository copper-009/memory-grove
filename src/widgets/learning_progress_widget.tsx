import { renderWidget } from '@remnote/plugin-sdk';
import { GroveCanvas } from './GroveCanvas';
import { useGrove } from './useGrove';
import '../style.css';

/** Bonus placement: RemNote's own Learning Progress page is a natural home for this. */
function LearningProgressWidget() {
  const bundle = useGrove();
  if (bundle.loading || bundle.error) return null;
  return <GroveCanvas bundle={bundle} height={260} />;
}

renderWidget(LearningProgressWidget);
