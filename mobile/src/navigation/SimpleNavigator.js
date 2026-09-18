import React, { useState } from "react";

/**
 * Navegador minimalista a proposito: evita sumar @react-navigation y sus
 * peer-dependencies (react-native-screens, safe-area, gesture-handler...) que
 * suelen desincronizarse entre versiones de Expo Go. Alcanza para 2 pantallas.
 */
export default function SimpleNavigator({ screens, initialRoute }) {
  const [route, setRoute] = useState(initialRoute);

  const navigation = {
    navigate: (name) => setRoute(name),
    goBack: () => setRoute(initialRoute),
  };

  const Screen = screens[route];
  return <Screen navigation={navigation} />;
}
