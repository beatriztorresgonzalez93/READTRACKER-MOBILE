import { Ionicons } from "@expo/vector-icons";
import { Box, Pressable, Text } from "@gluestack-ui/themed";
import { type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SWIPE_DELETE_THRESHOLD = -80;
const DELETE_ACTION_WIDTH = 88;

type SwipeableCardProps = {
  children: ReactNode;
  onDelete: () => void;
  disabled?: boolean;
  deleteLabel?: string;
};

function DeleteActionStrip() {
  return (
    <View style={styles.deleteStrip}>
      <Ionicons name="trash-outline" size={22} color="#FFFCF5" />
      <Text size="xs" color="#FFFCF5" fontWeight="$bold" mt="$1">
        Eliminar
      </Text>
    </View>
  );
}

function NativeSwipeableCard({ children, onDelete, disabled }: SwipeableCardProps) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-12, 12])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -DELETE_ACTION_WIDTH);
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_DELETE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(onDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <DeleteActionStrip />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.foreground, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Web: sin gesto; botón Eliminar visible al pasar el ratón no aplica — enlace discreto. */
function WebSwipeableCard({ children, onDelete, disabled, deleteLabel = "Eliminar" }: SwipeableCardProps) {
  return (
    <Box
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$primary200"
      bg="$white"
      overflow="hidden"
    >
      {children}
      <Pressable
        onPress={onDelete}
        disabled={disabled}
        accessibilityLabel="Eliminar sesión"
        px="$3"
        py="$2"
        borderTopWidth={1}
        borderTopColor="$primary100"
        bg="$primary50"
      >
        <Text size="xs" fontWeight="$bold" color="$primary700" textAlign="center">
          {deleteLabel}
        </Text>
      </Pressable>
    </Box>
  );
}

export function SwipeableCard(props: SwipeableCardProps) {
  if (Platform.OS === "web") {
    return <WebSwipeableCard {...props} />;
  }
  return <NativeSwipeableCard {...props} />;
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 12,
  },
  deleteStrip: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    backgroundColor: "#B84040",
    alignItems: "center",
    justifyContent: "center",
  },
  foreground: {
    backgroundColor: "#FFFCF5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5D9C2",
  },
});
