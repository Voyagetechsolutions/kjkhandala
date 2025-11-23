import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeFormatDate } from '../../lib/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { driverService } from '../../services/driverService';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';
import { WalletTransaction } from '../../types';


export default function WalletScreen() {
  const { driver } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, [driver?.id]);

  const loadWalletData = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const [walletBalance, walletTransactions, earningsSummary] = await Promise.all([
        driverService.getWalletBalance(driver.id),
        driverService.getWalletTransactions(driver.id, 20),
        driverService.getEarningsSummary(driver.id),
      ]);
      setBalance(walletBalance);
      setTransactions(walletTransactions);
      setEarnings(earningsSummary);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.subtitle}>Your earnings and transactions</Text>
      </View>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>P{balance.toFixed(2)}</Text>
        <View style={styles.balanceActions}>
          <View style={styles.balanceAction}>
            <Ionicons name="arrow-down-circle" size={24} color={COLORS.success} />
            <Text style={styles.balanceActionText}>Withdraw</Text>
          </View>
          <View style={styles.balanceAction}>
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
            <Text style={styles.balanceActionText}>Statement</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>P{earnings.month.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>P{earnings.week.toFixed(2)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.gray[400]} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map((transaction) => {
            const isDeduction = transaction.transaction_type === 'deduction';
            return (
              <View key={transaction.id} style={styles.transaction}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    isDeduction ? styles.debitIcon : styles.creditIcon
                  ]}>
                    <Ionicons
                      name={isDeduction ? 'arrow-up' : 'arrow-down'}
                      size={20}
                      color={COLORS.white}
                    />
                  </View>
                  <View>
                    <Text style={styles.transactionDesc}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>
                      {safeFormatDate(transaction.created_at, 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    isDeduction ? styles.debitAmount : styles.creditAmount
                  ]}>
                    {isDeduction ? '-' : '+'}P{parseFloat(transaction.amount.toString()).toFixed(2)}
                  </Text>
                  <Badge
                    label={transaction.status}
                    variant={transaction.status === 'approved' || transaction.status === 'paid' ? 'success' : 'warning'}
                  />
                </View>
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
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
  balanceCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
  },
  balanceLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    opacity: 0.9,
  },
  balanceAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    fontSize: 40,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  balanceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  balanceActionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  card: {
    margin: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIcon: {
    backgroundColor: COLORS.success,
  },
  debitIcon: {
    backgroundColor: COLORS.danger,
  },
  transactionDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  transactionDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  transactionAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  creditAmount: {
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.danger,
  },
});
