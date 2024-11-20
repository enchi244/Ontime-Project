import { StatusBar } from "expo-status-bar";

import { icons } from "../../constants";

import { Tabs } from 'expo-router';
import { Image, Text, View } from "react-native";


const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="flex items-center justify-center gap-2">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6"
      />
    </View>
  );
};

export default function TabsLayout() {
  return (
    <>
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home", headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.home}
                color={color}
                name="Home"
                focused={focused}
              /> ), }} />
      <Tabs.Screen name="profile" options={{ title: "profile", headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.profile}
                color={color}
                name="Profile"
                focused={focused}
              /> ), }} />
      <Tabs.Screen name="chat" options={{ title: "chat", headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.profile}
                color={color}
                name="Chat"
                focused={focused}
              /> ), }} />
    </Tabs>
    <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
}