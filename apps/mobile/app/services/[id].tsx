import { useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";

export default function LegacyServiceDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      router.replace({ pathname: "/(tabs)/services/[id]", params: { id } });
    }
  }, [id]);

  return null;
}
