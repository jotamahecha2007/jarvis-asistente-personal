import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import TabBar from "../components/TabBar";
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import FinanceScreen from "../screens/FinanceScreen";
import TasksScreen from "../screens/TasksScreen";

/**
 * navigation: viene del SimpleNavigator de nivel superior (App.js), se usa
 * para poder saltar a "Settings" desde cualquiera de las pestañas.
 */
export default function MainTabs({ navigation }) {
  const [tab, setTab] = useState("Home");
  const opacity = useRef(new Animated.Value(1)).current;

  const changeTab = (next) => {
    if (next === tab) return;
    Animated.timing(opacity, { toValue: 0, duration: 90, useNativeDriver: true }).start(() => {
      setTab(next);
    });
  };

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
  }, [tab]);

  return (
    <Animated.View style={[styles.flex, { opacity }]}>
      <Animated.View style={styles.flex}>
        {tab === "Home" ? <HomeScreen navigation={navigation} goToTab={changeTab} /> : null}
        {tab === "Chat" ? <ChatScreen navigation={navigation} /> : null}
        {tab === "Finance" ? <FinanceScreen navigation={navigation} /> : null}
        {tab === "Tasks" ? <TasksScreen navigation={navigation} /> : null}
      </Animated.View>
      <TabBar active={tab} onChange={changeTab} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
