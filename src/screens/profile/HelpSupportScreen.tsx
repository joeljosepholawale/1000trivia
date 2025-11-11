import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';

export const HelpSupportScreen = () => {
  const navigation = useNavigation();

  const handleContact = (method: string) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@1000ravier.com');
        break;
      case 'twitter':
        Linking.openURL('https://twitter.com/1000ravier');
        break;
      case 'website':
        Linking.openURL('https://1000ravier.com');
        break;
    }
  };

  const faqs = [
    {
      question: 'How do I play a game?',
      answer: 'Navigate to the Game tab, select a game mode, and tap "Play Now" to start.',
    },
    {
      question: 'How do I earn credits?',
      answer: 'Win games, claim daily bonuses, or purchase credits in the Wallet tab.',
    },
    {
      question: 'Can I withdraw my winnings?',
      answer: 'Yes! Go to Profile → Wallet and tap "Withdraw" when you have sufficient balance.',
    },
    {
      question: 'How does the leaderboard work?',
      answer: 'Rankings are updated in real-time based on your wins and performance.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView>
        <View style={styles.content}>
          {/* Contact Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => handleContact('email')}
            >
              <MaterialIcons name="email" size={24} color="#6366f1" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>support@1000ravier.com</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => handleContact('twitter')}
            >
              <MaterialIcons name="chat" size={24} color="#6366f1" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Live Chat</Text>
                <Text style={styles.contactSubtitle}>Available 24/7</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* FAQs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqCard}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Terms of Service</Text>
              <TouchableOpacity onPress={() => handleContact('website')}>
                <Text style={styles.link}>View Terms</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => handleContact('website')}>
                <Text style={styles.link}>View Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  faqCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#111827',
  },
  infoValue: {
    fontSize: 15,
    color: '#6b7280',
  },
  link: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
  },
});
