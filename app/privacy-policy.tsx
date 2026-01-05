import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './lib/ThemeContext';

export default function PrivacyPolicy() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.border }]}>
          Last updated: November 2024
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Introduction</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Welcome to Liar's Poker App. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We collect the following types of information:{'\n\n'}
          • <Text style={styles.bold}>Account Information:</Text> Email address, username, and password when you create an account.{'\n\n'}
          • <Text style={styles.bold}>Profile Information:</Text> Profile picture and any other information you choose to add to your profile.{'\n\n'}
          • <Text style={styles.bold}>Game Data:</Text> Game statistics, scores, and gameplay history.{'\n\n'}
          • <Text style={styles.bold}>Device Information:</Text> Device type, operating system, and app version for troubleshooting purposes.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use your information to:{'\n\n'}
          • Provide and maintain our service{'\n'}
          • Allow you to participate in games with other players{'\n'}
          • Send you important updates about the app{'\n'}
          • Improve and optimize our application{'\n'}
          • Respond to your requests and support needs
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Data Storage and Security</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Your data is stored securely using industry-standard encryption. We use PocketBase as our backend service, which implements secure data storage practices. We do not sell your personal information to third parties.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Data Retention</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We retain your personal data for as long as your account is active. You can request deletion of your account and all associated data at any time through the Settings page.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Your Rights</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You have the right to:{'\n\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Request deletion of your data{'\n'}
          • Export your data{'\n'}
          • Withdraw consent at any time
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Children's Privacy</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to This Policy</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Contact Us</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          If you have any questions about this privacy policy or our data practices, please contact us through the feedback option in the app.
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
