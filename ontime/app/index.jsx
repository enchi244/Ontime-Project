import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { images } from '../constants';
import CustomButton from '../components/CustomButton';

import { useGlobalContext } from '../context/GlobalProvider';

export default function App() {
  const {isLoading, isLoggedIn } = useGlobalContext();

  if(!isLoading && isLoggedIn) return <Redirect href="/home" />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#161622' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Image
            source={images.logo}
            style={{ width: 300, height: 340 }}
            resizeMode="contain"
          />
          <View style={{ marginTop: 28, width: 320, height: 340 }}>
            <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              Manage your life better, Let's be{' '}
              <Text style={{ color: '#4A90E2' }}>OnTime</Text>
            </Text>

            <Text style={{ fontSize: 14, color: '#D1D1D1', marginTop: 28, textAlign: 'center' }}>
              Where AI meets Time Management!
            </Text>

            <CustomButton
              title="Continue with email"
              handlePress={() => router.push('/(auth)/sign-in')}
              containerStyles={{ marginTop: 28 }}
            />
          </View>
        </View>
      </ScrollView>

      <StatusBar backgroundColor='#161622' style='light' />
    </SafeAreaView>
  );
}