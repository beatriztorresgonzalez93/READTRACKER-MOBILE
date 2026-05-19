// Selector de fecha con ruedas (día / mes / año).
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Box, HStack, Text } from "@gluestack-ui/themed";
import {
  createElement,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { Platform, StyleSheet, View } from "react-native";

import { AppButton } from "@/shared/ui/app-button";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function clampDate(date: Date, minimumDate?: Date, maximumDate?: Date) {
  let next = date;
  if (maximumDate && next > maximumDate) next = maximumDate;
  if (minimumDate && next < minimumDate) next = minimumDate;
  return next;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export type WheelDatePickerOptions = {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
};

/** Android: abre el diálogo nativo con ruedas (no usar el componente inline). */
export function openWheelDatePicker({
  value,
  onChange,
  maximumDate,
  minimumDate,
}: WheelDatePickerOptions) {
  if (Platform.OS !== "android") return;

  DateTimePickerAndroid.open({
    value,
    mode: "date",
    display: "spinner",
    maximumDate,
    minimumDate,
    onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "set" && selectedDate) {
        onChange(clampDate(selectedDate, minimumDate, maximumDate));
      }
    },
  });
}

type WheelDatePickerProps = WheelDatePickerOptions & {
  /** Muestra botón para cerrar (iOS, formulario expandible). */
  onDismiss?: () => void;
};

function WebWheelDatePicker({
  value,
  onChange,
  maximumDate = new Date(),
  minimumDate,
  onDismiss,
}: WheelDatePickerProps) {
  const maxYear = maximumDate.getFullYear();
  const minYear = minimumDate?.getFullYear() ?? maxYear - 120;

  const [day, setDay] = useState(value.getDate());
  const [month, setMonth] = useState(value.getMonth());
  const [year, setYear] = useState(value.getFullYear());

  const maxDay = daysInMonth(year, month);

  useEffect(() => {
    setDay(value.getDate());
    setMonth(value.getMonth());
    setYear(value.getFullYear());
  }, [value]);

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [day, maxDay]);

  function commit(nextDay: number, nextMonth: number, nextYear: number) {
    const next = clampDate(new Date(nextYear, nextMonth, nextDay, 12, 0, 0), minimumDate, maximumDate);
    onChange(next);
  }

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) list.push(y);
    return list;
  }, [maxYear, minYear]);

  const selectStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 8px",
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #D8C9AE",
    backgroundColor: "#FFFCF5",
    color: "#2D1F15",
  };

  return (
    <Box>
      <HStack space="sm" alignItems="stretch">
        <View style={styles.webColumn}>
          <Text size="xs" color="$textLight500" mb="$1" textAlign="center">
            Día
          </Text>
          {createElement(
            "select",
            {
              value: String(day),
              onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                const nextDay = Number(e.target.value);
                setDay(nextDay);
                commit(nextDay, month, year);
              },
              style: selectStyle,
            },
            Array.from({ length: maxDay }, (_, i) => {
              const d = i + 1;
              return createElement("option", { key: d, value: String(d) }, String(d));
            }),
          )}
        </View>
        <View style={[styles.webColumn, styles.webColumnWide]}>
          <Text size="xs" color="$textLight500" mb="$1" textAlign="center">
            Mes
          </Text>
          {createElement(
            "select",
            {
              value: String(month),
              onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                const nextMonth = Number(e.target.value);
                setMonth(nextMonth);
                const dim = daysInMonth(year, nextMonth);
                const nextDay = Math.min(day, dim);
                setDay(nextDay);
                commit(nextDay, nextMonth, year);
              },
              style: selectStyle,
            },
            MONTHS_ES.map((label, index) =>
              createElement("option", { key: label, value: String(index) }, label),
            ),
          )}
        </View>
        <View style={styles.webColumn}>
          <Text size="xs" color="$textLight500" mb="$1" textAlign="center">
            Año
          </Text>
          {createElement(
            "select",
            {
              value: String(year),
              onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                const nextYear = Number(e.target.value);
                setYear(nextYear);
                const dim = daysInMonth(nextYear, month);
                const nextDay = Math.min(day, dim);
                setDay(nextDay);
                commit(nextDay, month, nextYear);
              },
              style: selectStyle,
            },
            years.map((y) => createElement("option", { key: y, value: String(y) }, String(y))),
          )}
        </View>
      </HStack>
      {onDismiss ? (
        <Box mt="$3">
          <AppButton label="Listo" appearance="secondary" onPress={onDismiss} />
        </Box>
      ) : null}
    </Box>
  );
}

function IOSWheelDatePicker({
  value,
  onChange,
  maximumDate,
  minimumDate,
  onDismiss,
}: WheelDatePickerProps) {
  function handleNativeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type === "dismissed") {
      onDismiss?.();
      return;
    }
    if (event.type !== "set" || !selectedDate) return;
    onChange(clampDate(selectedDate, minimumDate, maximumDate));
  }

  return (
    <Box>
      <DateTimePicker
        value={value}
        mode="date"
        display="spinner"
        locale="es-ES"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChange={handleNativeChange}
        themeVariant="light"
        style={styles.nativeSpinner}
      />
      {onDismiss ? (
        <Box mt="$2">
          <AppButton label="Listo" appearance="secondary" onPress={onDismiss} />
        </Box>
      ) : null}
    </Box>
  );
}

/** Inline: iOS y web. En Android usar `openWheelDatePicker`. */
export function WheelDatePicker(props: WheelDatePickerProps) {
  if (Platform.OS === "web") {
    return <WebWheelDatePicker {...props} />;
  }
  if (Platform.OS === "ios") {
    return <IOSWheelDatePicker {...props} />;
  }
  return null;
}

const styles = StyleSheet.create({
  nativeSpinner: {
    alignSelf: "center",
    width: "100%",
    height: 180,
  },
  webColumn: {
    flex: 1,
    minWidth: 0,
  },
  webColumnWide: {
    flex: 1.4,
  },
});
