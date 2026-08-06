import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";
import {
  Client,
  Project,
  createClient,
  createProject,
  initializeDatabase,
  listClients,
  listProjects,
  pendingCount,
} from "./src/database";
import { supabase, supabaseConfigured } from "./src/supabase";
import { synchronize } from "./src/sync";

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void Promise.all([initializeDatabase(), supabase.auth.getSession()])
      .then(([, result]) => setSession(result.data.session))
      .catch((error) => Alert.alert("Falha ao abrir o banco", String(error)))
      .finally(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, current) =>
      setSession(current),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <Loading label="Preparando banco local seguro…" />;
  if (!session) return <Login />;
  return <Workspace userEmail={session.user.email || "Conta autorizada"} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function enter() {
    if (!supabaseConfigured) {
      Alert.alert("Configuração pendente", "Configure as chaves públicas do Supabase no aplicativo móvel.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert("Não foi possível entrar", "Confira o e-mail, a senha e a conexão.");
  }

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.center}
      >
        <View style={styles.loginCard}>
          <Text style={styles.eyebrow}>ACESSO PROTEGIDO</Text>
          <Text style={styles.title}>Medidas Finais</Text>
          <Text style={styles.muted}>Entre com uma conta liberada pela proprietária.</Text>
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
          <Action label={loading ? "Entrando…" : "Entrar"} onPress={enter} disabled={loading || !email || !password} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Workspace({ userEmail }: { userEmail: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(false);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const syncInFlight = useRef(false);

  const reload = useCallback(async () => {
    const [nextClients, nextProjects, nextPending] = await Promise.all([
      listClients(),
      listProjects(),
      pendingCount(),
    ]);
    setClients(nextClients);
    setProjects(nextProjects);
    setPending(nextPending);
  }, []);

  const runSync = useCallback(async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setSyncing(true);
    setSyncError("");
    try {
      await synchronize(supabase);
      await reload();
    } catch {
      setSyncError("Não foi possível sincronizar agora. Os dados continuam protegidos neste aparelho.");
      await reload();
    } finally {
      syncInFlight.current = false;
      setSyncing(false);
    }
  }, [reload]);

  useEffect(() => {
    void reload();
    return NetInfo.addEventListener((state) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnline(connected);
      if (connected) void runSync();
    });
  }, [reload, runSync]);

  async function addClient() {
    if (!clientName.trim()) return;
    await createClient(clientName);
    setClientName("");
    await reload();
  }

  async function addProject() {
    if (!projectName.trim() || !clients[0]) return;
    await createProject(clients[0].id, projectName);
    setProjectName("");
    await reload();
  }

  return (
    <SafeAreaView style={styles.workspace}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Medidas Finais</Text>
          <Text style={styles.headerText}>{online ? (syncing ? "Sincronizando…" : "Online") : "Sem internet — dados protegidos"}</Text>
        </View>
        <View style={styles.pending}><Text style={styles.pendingText}>{pending} pendentes</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>OPERAÇÃO MÓVEL</Text>
        <Text style={styles.heading}>Bom trabalho</Text>
        <Text style={styles.muted}>Tudo nesta tela é salvo primeiro no SQLite deste aparelho.</Text>
        {syncError ? <Text style={styles.syncError}>{syncError}</Text> : null}
        {online && pending > 0 ? <Action label={syncing ? "Sincronizando…" : "Sincronizar agora"} onPress={runSync} disabled={syncing} /> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Novo cliente</Text>
          <Field label="Nome" value={clientName} onChangeText={setClientName} />
          <Action label="Salvar cliente neste aparelho" onPress={addClient} disabled={!clientName.trim()} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Novo projeto</Text>
          <Text style={styles.muted}>{clients[0] ? `Cliente: ${clients[0].name}` : "Cadastre um cliente primeiro."}</Text>
          <Field label="Nome do projeto" value={projectName} onChangeText={setProjectName} />
          <Action label="Salvar projeto neste aparelho" onPress={addProject} disabled={!projectName.trim() || !clients.length} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Projetos locais</Text>
          <FlatList
            scrollEnabled={false}
            data={projects}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.muted}>Nenhum projeto salvo.</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.muted}>Salvo neste aparelho</Text></View>
                <Text style={styles.status}>{item.sync_status === "SINCRONIZADO" ? "Sincronizado" : "Pendente"}</Text>
              </View>
            )}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conta</Text>
          <Text style={styles.muted}>{userEmail}</Text>
          <Pressable style={styles.secondary} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.secondaryText}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...input } = props;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...input} placeholderTextColor="#8293a3" style={styles.input} /></View>;
}

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.action, disabled && styles.disabled]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

function Loading({ label }: { label: string }) {
  return <View style={styles.loading}><ActivityIndicator color="#d6a84b" size="large" /><Text style={styles.loadingText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#092c4c" },
  center: { flex: 1, justifyContent: "center", padding: 22 },
  loginCard: { backgroundColor: "white", padding: 24, borderRadius: 22, gap: 14 },
  title: { color: "#092c4c", fontSize: 30, fontWeight: "800" },
  eyebrow: { color: "#a87618", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  muted: { color: "#607386", lineHeight: 20 },
  workspace: { flex: 1, backgroundColor: "#f5f8fb" },
  header: { backgroundColor: "#092c4c", paddingHorizontal: 20, paddingVertical: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "white", fontSize: 21, fontWeight: "800" },
  headerText: { color: "#b9d3e8", fontSize: 12, marginTop: 3 },
  pending: { backgroundColor: "#163f62", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  pendingText: { color: "white", fontSize: 12, fontWeight: "700" },
  content: { padding: 18, gap: 16, paddingBottom: 42 },
  heading: { color: "#172534", fontSize: 27, fontWeight: "800" },
  card: { backgroundColor: "white", padding: 18, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: "#e0e8ef" },
  cardTitle: { color: "#172534", fontSize: 18, fontWeight: "800" },
  field: { gap: 6 },
  label: { color: "#33485b", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#cad6e0", backgroundColor: "#fff", color: "#172534", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  action: { backgroundColor: "#0876db", padding: 14, borderRadius: 12, alignItems: "center" },
  actionText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  row: { borderTopWidth: 1, borderTopColor: "#e5ebf0", paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowTitle: { color: "#172534", fontWeight: "800" },
  status: { color: "#a86705", fontWeight: "700", fontSize: 12 },
  secondary: { borderWidth: 1, borderColor: "#ba3341", padding: 12, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#ba3341", fontWeight: "800" },
  loading: { flex: 1, backgroundColor: "#092c4c", alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: "white" },
  syncError: { color: "#9b2c2c", backgroundColor: "#fff0f0", padding: 12, borderRadius: 10 },
});
