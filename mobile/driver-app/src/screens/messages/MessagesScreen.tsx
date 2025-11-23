import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeFormatDate } from '../../lib/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { messageService } from '../../services/messageService';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { DriverMessage } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function MessagesScreen() {
  const { driver } = useAuth();
  const [messages, setMessages] = useState<DriverMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [driver?.id]);

  const loadMessages = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const data = await messageService.getDriverMessages(driver.id);
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMessagePress = async (message: DriverMessage) => {
    if (!message.is_read) {
      await messageService.markAsRead(message.id);
      loadMessages();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'trip_assignment':
        return 'bus';
      case 'schedule_change':
        return 'calendar';
      case 'announcement':
        return 'megaphone';
      case 'alert':
        return 'warning';
      default:
        return 'mail';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{messages.length} messages</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Card>
            <Text style={styles.emptyText}>Loading messages...</Text>
          </Card>
        ) : messages.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="mail-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No messages</Text>
            <Text style={styles.emptyText}>You have no messages yet</Text>
          </Card>
        ) : (
          messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              onPress={() => handleMessagePress(message)}
            >
              <Card style={!message.is_read ? styles.unreadCard : styles.messageCard}>
                <View style={styles.messageHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getMessageIcon(message.message_type)}
                      size={24}
                      color={message.is_read ? COLORS.gray[600] : COLORS.primary}
                    />
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={[styles.messageTitle, !message.is_read && styles.unreadText]}>
                      {message.title}
                    </Text>
                    <Text style={styles.messageDate}>
                      {safeFormatDate(message.created_at, 'MMM d, yyyy • HH:mm')}
                    </Text>
                  </View>
                  {!message.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.messageBody} numberOfLines={2}>
                  {message.message}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  messageCard: {
    marginBottom: SPACING.md,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  messageTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  unreadText: {
    fontWeight: '700',
  },
  messageDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  messageBody: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
