// Pago Pro (pantalla completa, gluestack-ui).
import { router } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { VStack } from "@gluestack-ui/themed";

import { BOOK_SHEET_BG } from "@/features/books/book-sheet-ui";
import { ProUpgradeCheckout } from "@/features/billing/pro-upgrade-checkout";
import { useRefreshBillingStatus } from "@/features/billing/use-billing";
import { Screen } from "@/shared/ui/screen";

export default function UpgradeCheckoutScreen() {
  const refreshBilling = useRefreshBillingStatus();

  return (
    <Screen backgroundColor={BOOK_SHEET_BG} webBackgroundColor={BOOK_SHEET_BG}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md">
          <ProUpgradeCheckout
            onSuccess={() => {
              refreshBilling();
              router.replace("/(app)/upgrade" as never);
            }}
            onCancel={() => router.back()}
          />
        </VStack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
});
