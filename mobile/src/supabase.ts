import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const secureStorage = {
  getItem: (item: string) => SecureStore.getItemAsync(item),
  setItem: (item: string, value: string) => SecureStore.setItemAsync(item, value),
  removeItem: (item: string) => SecureStore.deleteItemAsync(item),
};

export const supabaseConfigured = Boolean(url && key);
export const supabase = createClient(
  url || "https://invalid.local",
  key || "missing-public-key",
  {
    auth: {
      storage: secureStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
