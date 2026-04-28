import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/shared/ui/theme";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderOnCard,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.textSoft,
  },
});

