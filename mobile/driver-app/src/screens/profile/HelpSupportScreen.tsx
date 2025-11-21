import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function HelpSupportScreen() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faqs = [
    {
      question: 'How do I start a trip?',
      answer: 'Go to your assigned trips, select the trip, complete the pre-trip inspection, and tap "Start Trip" when ready to depart.',
    },
    {
      question: 'What if a passenger doesn\'t show up?',
      answer: 'Wait for the scheduled departure time. If the passenger doesn\'t arrive, mark them as "No Show" in the passenger manifest.',
    },
    {
      question: 'How do I report an incident?',
      answer: 'Tap the "Report Incident" button on the dashboard or during a trip. Fill in all required details, add photos if available, and submit.',
    },
    {
      question: 'How do I log fuel expenses?',
      answer: 'Use the "Fuel Log" feature from the dashboard. Enter the fuel station, litres, cost, and upload the receipt photo.',
    },
    {
      question: 'When will I receive my earnings?',
      answer: 'Earnings are processed weekly and paid out on Fridays. Check your wallet for detailed transaction history.',
    },
    {
      question: 'What should I do in case of emergency?',
      answer: 'Call emergency services (999) immediately. Then report the incident through the app and contact dispatch.',
    },
  ];

  const contactOptions = [
    {
      icon: 'call',
      title: 'Emergency Hotline',
      subtitle: '24/7 Support',
      value: '+267 123 4567',
      action: () => Linking.openURL('tel:+2671234567'),
    },
    {
      icon: 'mail',
      title: 'Email Support',
      subtitle: 'Response within 24 hours',
      value: 'support@kjkhandala.com',
      action: () => Linking.openURL('mailto:support@kjkhandala.com'),
    },
    {
      icon: 'chatbubbles',
      title: 'WhatsApp Support',
      subtitle: 'Quick responses',
      value: '+267 123 4567',
      action: () => Linking.openURL('https://wa.me/2671234567'),
    },
    {
      icon: 'location',
      title: 'Head Office',
      subtitle: 'Visit us',
      value: 'Gaborone, Botswana',
      action: () => Alert.alert('Location', 'Main Mall, Gaborone, Botswana'),
    },
  ];

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Thank you for your feedback! We will review it shortly.');
      setFeedbackMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        {contactOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactRow}
            onPress={option.action}
          >
            <View style={styles.contactIcon}>
              <Ionicons name={option.icon as any} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              <Text style={styles.contactValue}>{option.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <Text style={styles.faqQuestionText}>{faq.question}</Text>
              <Ionicons
                name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.gray[600]}
              />
            </TouchableOpacity>
            {expandedFaq === index && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Send Feedback</Text>
        <Text style={styles.feedbackDescription}>
          Help us improve! Share your thoughts, suggestions, or report any issues.
        </Text>
        
        <Input
          label="Your Feedback"
          value={feedbackMessage}
          onChangeText={setFeedbackMessage}
          placeholder="Tell us what you think..."
          multiline
          numberOfLines={4}
          style={styles.feedbackInput}
        />

        <Button
          title="Submit Feedback"
          onPress={handleSubmitFeedback}
          loading={submitting}
          disabled={submitting}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Alert.alert('Driver Handbook', 'Opening driver handbook...')}
        >
          <Ionicons name="book" size={24} color={COLORS.gray[600]} />
          <Text style={styles.linkText}>Driver Handbook</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Alert.alert('Safety Guidelines', 'Opening safety guidelines...')}
        >
          <Ionicons name="shield-checkmark" size={24} color={COLORS.gray[600]} />
          <Text style={styles.linkText}>Safety Guidelines</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Alert.alert('Training Videos', 'Opening training videos...')}
        >
          <Ionicons name="play-circle" size={24} color={COLORS.gray[600]} />
          <Text style={styles.linkText}>Training Videos</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Alert.alert('Report a Bug', 'Opening bug report form...')}
        >
          <Ionicons name="bug" size={24} color={COLORS.gray[600]} />
          <Text style={styles.linkText}>Report a Bug</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    margin: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  contactSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  contactValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  faqQuestionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    paddingBottom: SPACING.md,
    paddingRight: SPACING.md,
  },
  faqAnswerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  feedbackDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  feedbackInput: {
    marginBottom: SPACING.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    flex: 1,
    marginLeft: SPACING.md,
  },
});
