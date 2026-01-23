import { useRef, useState } from "react";
import { Animated } from "react-native";

export default function useChatDrawer(drawerW) {
  const drawerX = useRef(new Animated.Value(-drawerW)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerX, {
      toValue: -drawerW,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setDrawerOpen(false);
    });
  };

  const toggleDrawer = () => (drawerOpen ? closeDrawer() : openDrawer());

  return { drawerX, drawerOpen, openDrawer, closeDrawer, toggleDrawer };
}
