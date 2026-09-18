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
import {
  addCreditCard,
  addSavingsGoal,
  addTransaction,
  contributeToGoal,
  deleteTransaction,
  getBalance,
  getCreditCards,
  getSavingsGoals,
  getTransactions,
} from "../services/api";

const SUBTABS = [
  { key: "movements", label: "MOVIMIENTOS" },
  { key: "cards", label: "TARJETAS" },
  { key: "goals", label: "METAS" },
];

export default function FinanceScreen({ navigation }) {
  const [sub, setSub] = useState("movements");

  return (
    <HudBackground>
      <ScreenHeader
        title="FINANZAS"
        subtitle="AGENTE FINANCIERO"
        accent={accents.finance}
        onSettingsPress={() => navigation.navigate("Settings")}
      />
      <View style={styles.subTabs}>
        {SUBTABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.subTab, sub === t.key && styles.subTabActive]}
            onPress={() => setSub(t.key)}
          >
            <Text style={[styles.subTabText, sub === t.key && styles.subTabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {sub === "movements" ? <MovementsView /> : null}
      {sub === "cards" ? <CardsView /> : null}
      {sub === "goals" ? <GoalsView /> : null}
    </HudBackground>
  );
}

function MovementsView() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(0);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tx, bal] = await Promise.all([
        getTransactions({ serverUrl: settings.serverUrl, apiKey: settings.apiKey }),
        getBalance({ serverUrl: settings.serverUrl, apiKey: settings.apiKey }),
      ]);
      setItems(tx.items || []);
      setBalance(bal.balance || 0);
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
    const value = parseFloat(amount.replace(",", "."));
    if (!desc.trim() || !value || value <= 0) return;
    try {
      await addTransaction({
        serverUrl: settings.serverUrl,
        apiKey: settings.apiKey,
        description: desc.trim(),
        amount: value,
        transaction_type: type,
        category: "otros",
      });
      setDesc("");
      setAmount("");
      haptics.success();
      showToast(type === "income" ? "Ingreso registrado" : "Gasto registrado");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  const confirmRemove = (item) => {
    Alert.alert("Borrar movimiento", `¿Borrar "${item.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => remove(item.id) },
    ]);
  };

  const remove = async (id) => {
    try {
      await deleteTransaction({ serverUrl: settings.serverUrl, apiKey: settings.apiKey, id });
      haptics.warning();
      showToast("Movimiento borrado", "warning");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  return (
    <>
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>SALDO</Text>
        <Text style={[styles.balanceValue, { color: balance >= 0 ? colors.success : colors.danger }]}>
          {balance.toLocaleString(undefined, { style: "currency", currency: "USD" })}
        </Text>
      </View>

      {error ? <ErrorBox msg={error} /> : null}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Descripción (ej. Mercado)"
          placeholderTextColor={colors.textDim}
          value={desc}
          onChangeText={setDesc}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="Monto"
            placeholderTextColor={colors.textDim}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Pressable
            style={[styles.typeBtn, type === "expense" && styles.typeBtnActiveExpense]}
            onPress={() => setType("expense")}
          >
            <Text style={styles.typeBtnText}>GASTO</Text>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, type === "income" && styles.typeBtnActiveIncome]}
            onPress={() => setType("income")}
          >
            <Text style={styles.typeBtnText}>INGRESO</Text>
          </Pressable>
        </View>
        <PressableScale style={styles.addBtn} onPress={submit}>
          <Text style={styles.addBtnText}>+ AGREGAR</Text>
        </PressableScale>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.empty}>Sin movimientos todavía.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onLongPress={() => confirmRemove(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowDesc}>{item.description}</Text>
              <Text style={styles.rowDate}>
                {new Date(item.date).toLocaleDateString()} · {item.category}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: item.type === "income" ? colors.success : colors.danger }]}>
              {item.type === "income" ? "+" : "-"}
              {item.amount.toLocaleString(undefined, { style: "currency", currency: "USD" })}
            </Text>
          </Pressable>
        )}
      />
    </>
  );
}

function CardsView() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [cards, setCards] = useState([]);
  const [name, setName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [usedAmount, setUsedAmount] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getCreditCards({ serverUrl: settings.serverUrl, apiKey: settings.apiKey });
      setCards(data.items || []);
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
    const limit = parseFloat(limitAmount);
    if (!name.trim() || !limit) return;
    try {
      await addCreditCard({
        serverUrl: settings.serverUrl,
        apiKey: settings.apiKey,
        name: name.trim(),
        limit_amount: limit,
        used_amount: parseFloat(usedAmount) || 0,
      });
      setName("");
      setLimitAmount("");
      setUsedAmount("");
      haptics.success();
      showToast("Tarjeta registrada");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  return (
    <>
      {error ? <ErrorBox msg={error} /> : null}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre (ej. Visa Bancolombia)"
          placeholderTextColor={colors.textDim}
          value={name}
          onChangeText={setName}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="Cupo total"
            placeholderTextColor={colors.textDim}
            value={limitAmount}
            onChangeText={setLimitAmount}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="Usado"
            placeholderTextColor={colors.textDim}
            value={usedAmount}
            onChangeText={setUsedAmount}
            keyboardType="decimal-pad"
          />
        </View>
        <Pressable style={styles.addBtn} onPress={submit}>
          <Text style={styles.addBtnText}>+ REGISTRAR TARJETA</Text>
        </Pressable>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.empty}>Sin tarjetas registradas.</Text>}
        renderItem={({ item }) => {
          const pct = item.limit_amount ? Math.min(100, ((item.used_amount || 0) / item.limit_amount) * 100) : 0;
          return (
            <View style={styles.cardBox}>
              <Text style={styles.rowDesc}>{item.name}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct > 80 ? colors.danger : colors.success }]} />
              </View>
              <Text style={styles.rowDate}>
                Usado {(item.used_amount || 0).toLocaleString(undefined, { style: "currency", currency: "USD" })} de{" "}
                {item.limit_amount.toLocaleString(undefined, { style: "currency", currency: "USD" })}
              </Text>
            </View>
          );
        }}
      />
    </>
  );
}

function GoalsView() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [contribName, setContribName] = useState(null);
  const [contribAmount, setContribAmount] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getSavingsGoals({ serverUrl: settings.serverUrl, apiKey: settings.apiKey });
      setGoals(data.items || []);
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
    const t = parseFloat(target);
    if (!name.trim() || !t) return;
    try {
      await addSavingsGoal({ serverUrl: settings.serverUrl, apiKey: settings.apiKey, name: name.trim(), target_amount: t });
      setName("");
      setTarget("");
      haptics.success();
      showToast("Meta creada");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  const contribute = async (goalName) => {
    const amt = parseFloat(contribAmount);
    if (!amt) return;
    try {
      await contributeToGoal({ serverUrl: settings.serverUrl, apiKey: settings.apiKey, name: goalName, amount: amt });
      setContribName(null);
      setContribAmount("");
      haptics.success();
      showToast("¡Abono registrado!");
      load();
    } catch (err) {
      setError(err.message);
      haptics.error();
    }
  };

  return (
    <>
      {error ? <ErrorBox msg={error} /> : null}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la meta (ej. Viaje académico)"
          placeholderTextColor={colors.textDim}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Monto objetivo"
          placeholderTextColor={colors.textDim}
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
        />
        <Pressable style={styles.addBtn} onPress={submit}>
          <Text style={styles.addBtnText}>+ CREAR META</Text>
        </Pressable>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.empty}>Sin metas todavía.</Text>}
        renderItem={({ item }) => (
          <View style={styles.cardBox}>
            <Text style={styles.rowDesc}>{item.name}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, item.progress_pct)}%`, backgroundColor: colors.purple }]} />
            </View>
            <Text style={styles.rowDate}>
              {(item.saved_amount || 0).toLocaleString(undefined, { style: "currency", currency: "USD" })} de{" "}
              {item.target_amount.toLocaleString(undefined, { style: "currency", currency: "USD" })} ({item.progress_pct}%)
            </Text>
            {contribName === item.name ? (
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="Monto a abonar"
                  placeholderTextColor={colors.textDim}
                  value={contribAmount}
                  onChangeText={setContribAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <Pressable style={styles.smallBtn} onPress={() => contribute(item.name)}>
                  <Text style={styles.smallBtnText}>OK</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.smallBtnOutline} onPress={() => setContribName(item.name)}>
                <Text style={styles.smallBtnOutlineText}>+ ABONAR</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </>
  );
}

function ErrorBox({ msg }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>⚠ {msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subTabs: { flexDirection: "row", paddingHorizontal: layout.padding, gap: 8, marginBottom: 10 },
  subTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  subTabActive: { borderColor: accents.finance, backgroundColor: "rgba(43,255,158,0.08)" },
  subTabText: { ...typography.mono, fontSize: 10, color: colors.textDim },
  subTabTextActive: { color: accents.finance },
  balanceBox: { alignItems: "center", marginBottom: 10 },
  balanceLabel: { ...typography.mono, color: colors.textSecondary, fontSize: 11 },
  balanceValue: { ...typography.mono, fontSize: 32, fontWeight: "700", marginTop: 2 },
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
  form: { paddingHorizontal: layout.padding, marginBottom: 10, gap: 8 },
  formRow: { flexDirection: "row", gap: 8 },
  input: {
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
  amountInput: { flex: 1 },
  typeBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  typeBtnActiveExpense: { borderColor: colors.danger, backgroundColor: "rgba(255,70,85,0.12)" },
  typeBtnActiveIncome: { borderColor: colors.success, backgroundColor: "rgba(43,255,158,0.12)" },
  typeBtnText: { ...typography.mono, fontSize: 10, color: colors.textPrimary },
  addBtn: {
    backgroundColor: accents.finance,
    borderRadius: layout.radius,
    paddingVertical: 12,
    alignItems: "center",
  },
  addBtnText: { ...typography.mono, color: colors.background, fontWeight: "700", fontSize: 12 },
  list: { paddingHorizontal: layout.padding, paddingBottom: 10 },
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
  },
  rowDesc: { ...typography.mono, color: colors.textPrimary, fontSize: 13 },
  rowDate: { ...typography.mono, color: colors.textDim, fontSize: 10, marginTop: 6 },
  rowAmount: { ...typography.mono, fontSize: 14, fontWeight: "700" },
  cardBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.backgroundPanel,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
  smallBtnOutline: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  smallBtnOutlineText: { ...typography.mono, color: colors.purple, fontSize: 10 },
  smallBtn: {
    backgroundColor: colors.purple,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  smallBtnText: { ...typography.mono, color: colors.background, fontSize: 12, fontWeight: "700" },
});
