import type { useLabelSession } from '@/hooks/useLabelSession';
import { resolveTaskSpec, parsePriorChoice } from '@/labeling/taskSpec';
import { BoxQualityScreen } from '@/components/labeling/BoxQualityScreen';
import { ChoiceTaskScreen } from '@/components/labeling/ChoiceTaskScreen';
import { CullingScreen } from '@/components/labeling/CullingScreen';
import { GeometryAnnotateScreen } from '@/components/labeling/GeometryAnnotateScreen';
import { PairwiseScreen } from '@/components/labeling/PairwiseScreen';

type Session = ReturnType<typeof useLabelSession>;

type Props = {
  session: Session;
  question: string;
};

export function TaskWorkspace({ session, question }: Props) {
  const task = session.task!;
  const spec = resolveTaskSpec(task);
  const previewUri = session.previewUri!;

  const screenProps = {
    question,
    previewUri,
    allowZoom: session.allowZoom,
    allowUndo: session.allowUndo,
    onZoomUsed: session.recordZoomUsed,
    onSkip: () => void session.skipTask(),
    onUndo: () => void session.undo(),
  };

  if (spec.layout === 'dual_image' && session.boxQuality) {
    return (
      <BoxQualityScreen
        question={question}
        previewUri={session.boxQuality.previewUri}
        subjectCropUri={session.boxQuality.subjectCropUri}
        detectorBox={session.boxQuality.detectorBox}
        allowZoom={session.allowZoom}
        allowUndo={session.allowUndo}
        onZoomUsed={session.recordZoomUsed}
        onChoice={(choice) => void session.submitChoice(choice)}
        onSkip={() => void session.skipTask()}
        onUndo={() => void session.undo()}
      />
    );
  }

  if (spec.layout === 'pairwise_images' && session.pairwise) {
    return (
      <PairwiseScreen
        question={question}
        presentation={session.pairwise}
        allowZoom={session.allowZoom}
        allowUndo={session.allowUndo}
        onZoomUsed={session.recordZoomUsed}
        onDecision={(d) => void session.submitPairwiseChoice(d)}
        onSkip={() => void session.skipTask()}
        onUndo={() => void session.undo()}
      />
    );
  }

  if (spec.capabilities.has('draw_boxes') && task.items[0]) {
    const item = task.items[0];
    return (
      <GeometryAnnotateScreen
        key={task.id}
        question={question}
        previewUri={previewUri}
        imageId={item.imageId}
        spec={spec}
        priorChoice={parsePriorChoice(item.metadata, spec.choices)}
        allowUndo={session.allowUndo}
        onZoomUsed={session.recordZoomUsed}
        onSubmit={(payload) => void session.submitGeometry(payload)}
        onSkip={() => void session.skipTask()}
        onUndo={() => void session.undo()}
      />
    );
  }

  if (spec.capabilities.has('burst_loupe') || spec.capabilities.has('burst_best')) {
    return (
      <CullingScreen
        key={`${previewUri}-${task.id}`}
        {...screenProps}
        burstClusterId={task.context?.clusterId}
        burstIndex={task.context?.burstIndex}
        burstSize={task.context?.burstSize}
        burstLoupeFrames={session.burstLoupeFrames}
        onChoice={(choice, options) => void session.submitChoice(choice, options)}
      />
    );
  }

  return (
    <ChoiceTaskScreen
      {...screenProps}
      choices={spec.choices}
      enableSwipe={spec.capabilities.has('swipe_choices')}
      onChoice={(choiceId) => void session.submitChoice(choiceId)}
    />
  );
}
