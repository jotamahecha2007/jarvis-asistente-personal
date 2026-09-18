import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import HudBackground from "../components/HudBackground";
import ScreenHeader from "../components/ScreenHeader";
import PressableScale from "../components/PressableScale";
import { accents, colors, layout, typography } from "../theme/theme";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { haptics } from "../utils/haptics";
import { addTask, deleteTask, getTasks, updateTaskStatus } from "../services/api";

export default function TasksScreen({ navigation }) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getTasks({ serverUrl: settings.serverUrl, apiKey: settings.apiKey });
      setTasks(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings.serverUrl, settings.apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await addTask({ serverUrl: settings.serverUrl, apiKey: settings.apiKey, text: text.trim() });
      setText("");
      haptics.success();
      showToast("Tarea agregada");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  const toggle = async (task) => {
    const nextStatus = task.status === "completado" ? "pendiente" : "completado";
    try {
      await updateTaskStatus({ serverUrl: settings.serverUrl, apiKey: settings.apiKey, id: task.id, status: nextStatus });
      haptics.tap();
      if (nextStatus === "completado") showToast("¡Tarea completada!");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  const confirmRemove = (task) => {
    Alert.alert("Borrar tarea", `¿Seguro que quieres borrar "${task.text}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => remove(task.id) },
    ]);
  };

  const remove = async (id) => {
    try {
      await deleteTask({ serverUrl: settings.serverUrl, apiKey: settings.apiKey, id });
      haptics.warning();
      showToast("Tarea borrada", "warning");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  const pending = tasks.filter((t) => t.status !== "completado").length;

  return (
    <HudBackground>
      <ScreenHeader
        title="TAREAS"
        subtitle={`AGENTE DE SECRETARÍA · ${pending} PENDIENTE${pending === 1 ? "" : "S"}`}
        accent={accents.tasks}
        onSettingsPress={() => navigation.navigate("Settings")}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nueva tarea..."
          placeholderTextColor={colors.textDim}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <PressableScale style={styles.addBtn} onPress={submit}>
          <Text style={styles.addBtnText}>+</Text>
        </PressableScale>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.empty}>Sin tareas todavía.</Text>}
        renderItem={({ item }) => {
          const done = item.status === "completado";
          return (
            <Pressable style={styles.row} onPress={() => toggle(item)} onLongPress={() => confirmRemove(item)}>
              <View style={[styles.checkbox, done && styles.checkboxDone]}>
                {done ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskText, done && styles.taskTextDone]}>{item.text}</Text>
                <Text style={styles.taskMeta}>
                  {item.priority ? `prioridad ${item.priority}` : ""}
                  {item.due_date ? ` · vence ${item.due_date}` : ""}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Text style={styles.hint}>Toca para completar/reabrir · mantén presionado para borrar.</Text>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    marginHorizontal: layout.padding,
    backgroundColor: "rgba(255,70,85,0.1)",
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  errorText: { color: colors.danger, ...typography.mono, fontSize: 12 },
  form: { flexDirection: "row", paddingHorizontal: layout.padding, marginBottom: 10, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundPanel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    ...typography.mono,
    fontSize: 13,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: accents.tasks,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: colors.background, fontSize: 20, fontWeight: "700" },
  list: { paddingHorizontal: layout.padding, paddingBottom: 4 },
  empty: { ...typography.mono, color: colors.textDim, textAlign: "center", marginTop: 20, fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.backgroundPanel,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: accents.tasks,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: accents.tasks },
  checkmark: { color: colors.background, fontSize: 13, fontWeight: "700" },
  taskText: { ...typography.mono, color: colors.textPrimary, fontSize: 14 },
  taskTextDone: { color: colors.textDim, textDecorationLine: "line-through" },
  taskMeta: { ...typography.mono, color: colors.textDim, fontSize: 10, marginTop: 2 },
  hint: {
    ...typography.mono,
    color: colors.textDim,
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
});
