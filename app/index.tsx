import { Redirect } from "expo-router";

import { useAuth } from "@/features/auth/use-auth";
import { AppLoader } from "@/shared/ui/app-loader";

export default function IndexScreen() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <AppLoader />;
  }

  return <Redirect href={(isAuthenticated ? "/(app)/(tabs)" : "/(auth)/login") as never} />;
}

