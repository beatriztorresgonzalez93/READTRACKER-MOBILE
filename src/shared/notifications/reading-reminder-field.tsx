import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform } from "react-native";

function defaultReminderDate() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(20, 0, 0, 0);
  return next;
}

function formatReminderDateTime(date: Date) {
  return date.toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type ReadingReminderFieldProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  date: Date;
  onDateChange: (date: Date) => void;
};

/** Campo opcional para programar un recordatorio de lectura (solo móvil). */
export function ReadingReminderField({
  enabled,
  onEnabledChange,
  date,
  onDateChange,
}: ReadingReminderFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const minimumDate = new Date();

  if (Platform.OS === "web") {
    return null;
  }

  function onPressDateTime() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        minimumDate,
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type !== "set" || !selectedDate) return;
          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            onChange: (timeEvent: DateTimePickerEvent, selectedTime?: Date) => {
              if (timeEvent.type !== "set" || !selectedTime) return;
              const combined = new Date(selectedDate);
              combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              if (combined > minimumDate) {
                onDateChange(combined);
              }
            },
          });
        },
      });
      return;
    }
    setPickerOpen((open) => !open);
  }

  return (
    <VStack space="sm">
      <Pressable
        onPress={() => {
          const next = !enabled;
          onEnabledChange(next);
          if (next && date <= minimumDate) {
            onDateChange(defaultReminderDate());
          }
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: enabled }}
      >
        <HStack alignItems="center" space="sm">
          <Ionicons
            name={enabled ? "checkbox" : "square-outline"}
            size={22}
            color="#2D1F15"
          />
          <Text size="sm" color="$primary800" flex={1}>
            Programar recordatorio de lectura
          </Text>
        </HStack>
      </Pressable>

      {enabled ? (
        <VStack space="sm">
          <Pressable onPress={onPressDateTime}>
            <Box
              borderWidth={1}
              borderColor="$primary200"
              borderRadius="$lg"
              bg="$backgroundLight50"
              px="$3"
              py="$3"
              minHeight={48}
              justifyContent="center"
            >
              <Text size="sm" color="$primary800">
                {formatReminderDateTime(date)}
              </Text>
            </Box>
          </Pressable>

          {pickerOpen && Platform.OS === "ios" ? (
            <Box
              borderWidth={1}
              borderColor="$primary200"
              borderRadius="$lg"
              bg="$backgroundLight50"
              px="$2"
              py="$2"
            >
              <DateTimePicker
                value={date}
                mode="datetime"
                display="spinner"
                minimumDate={minimumDate}
                onChange={(_event, selectedDate) => {
                  if (selectedDate && selectedDate > minimumDate) {
                    onDateChange(selectedDate);
                  }
                }}
              />
            </Box>
          ) : null}
        </VStack>
      ) : null}
    </VStack>
  );
}

export { defaultReminderDate };
