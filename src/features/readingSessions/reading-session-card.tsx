import { Text, VStack } from "@gluestack-ui/themed";

import { SwipeableCard } from "@/shared/ui/swipeable-card";

export type ReadingSessionCardData = {
  id: string;
  title: string;
  author: string;
  previousPage?: number;
  currentPage: number;
  pagesRead: number;
  recordedAt: string;
};

type ReadingSessionCardProps = {
  session: ReadingSessionCardData;
  onDelete: () => void;
  disabled?: boolean;
  timeLabel: string;
};

export function ReadingSessionCard({
  session,
  onDelete,
  disabled,
  timeLabel,
}: ReadingSessionCardProps) {
  const content = (
    <VStack px="$3" py="$2" gap={4}>
      <Text size="sm" fontWeight="$bold" color="$primary800" numberOfLines={1}>
        {session.title}
      </Text>
      <Text size="xs" color="$textLight500" numberOfLines={1}>
        {session.author || "Autor desconocido"}
      </Text>
      <Text size="xs" color="$textLight500">
        Paginas:{" "}
        {Math.max(0, (session.previousPage ?? session.currentPage - session.pagesRead) + 1)} -{" "}
        {session.currentPage}
      </Text>
      <Text size="xs" color="$textLight500">
        Hora: {timeLabel}
      </Text>
    </VStack>
  );

  return (
    <SwipeableCard onDelete={onDelete} disabled={disabled}>
      {content}
    </SwipeableCard>
  );
}
