import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { driverService } from '../../services/driverService';
import Card from '../../components/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function PerformanceStatsScreen() {
  const { driver } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalFuelCost: 0,
    totalIncidents: 0,
    safetyScore: 0,
    onTimePercentage: 0,
  });

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const data = await driverService.getPerformanceMetrics(driver.id);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return COLORS.success;
    if (score >= 70) return COLORS.warning;
    return COLORS.danger;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const completionRate = metrics.totalTrips > 0
    ? (metrics.completedTrips / metrics.totalTrips) * 100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Overall Performance</Text>
        
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getScoreColor(metrics.safetyScore) }]}>
              {metrics.safetyScore}
            </Text>
            <Text style={styles.scoreLabel}>Safety Score</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.metricValue}>{completionRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>

          <View style={styles.metricBox}>
            <Ionicons name="time" size={32} color={COLORS.primary} />
            <Text style={styles.metricValue}>{metrics.onTimePercentage}%</Text>
            <Text style={styles.metricLabel}>On-Time</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Trip Statistics (Last 30 Days)</Text>

        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Ionicons name="car" size={24} color={COLORS.primary} />
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <Text style={styles.statValue}>{metrics.totalTrips}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
            <Text style={styles.statLabel}>Completed Trips</Text>
          </View>
          <Text style={styles.statValue}>{metrics.completedTrips}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Ionicons name="close-circle" size={24} color={COLORS.danger} />
            <Text style={styles.statLabel}>Cancelled Trips</Text>
          </View>
          <Text style={styles.statValue}>{metrics.totalTrips - metrics.completedTrips}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Fuel Efficiency</Text>

        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Ionicons name="water" size={24} color={COLORS.warning} />
            <Text style={styles.statLabel}>Total Fuel Cost</Text>
          </View>
          <Text style={styles.statValue}>P{metrics.totalFuelCost.toFixed(2)}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Ionicons name="speedometer" size={24} color={COLORS.primary} />
            <Text style={styles.statLabel}>Avg Cost per Trip</Text>
          </View>
          <Text style={styles.statValue}>
            P{metrics.totalTrips > 0 ? (metrics.totalFuelCost / metrics.totalTrips).toFixed(2) : '0.00'}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Safety Record</Text>

        <View style={styles.statRow}>
          <View style={styles.statLeft}>
            <Ionicons 
              name={metrics.totalIncidents === 0 ? "shield-checkmark" : "warning"} 
              size={24} 
              color={metrics.totalIncidents === 0 ? COLORS.success : COLORS.danger} 
            />
            <Text style={styles.statLabel}>Total Incidents</Text>
          </View>
          <Text style={[styles.statValue, { color: metrics.totalIncidents === 0 ? COLORS.success : COLORS.danger }]}>
            {metrics.totalIncidents}
          </Text>
        </View>

        {metrics.totalIncidents === 0 && (
          <View style={styles.achievementBanner}>
            <Ionicons name="trophy" size={32} color={COLORS.warning} />
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>Perfect Safety Record!</Text>
              <Text style={styles.achievementSubtitle}>No incidents in the last 30 days</Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Performance Badges</Text>

        <View style={styles.badgesContainer}>
          {completionRate >= 95 && (
            <View style={styles.badge}>
              <Ionicons name="star" size={32} color={COLORS.warning} />
              <Text style={styles.badgeText}>Reliable Driver</Text>
            </View>
          )}

          {metrics.safetyScore >= 95 && (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.success} />
              <Text style={styles.badgeText}>Safety Champion</Text>
            </View>
          )}

          {metrics.onTimePercentage >= 95 && (
            <View style={styles.badge}>
              <Ionicons name="time" size={32} color={COLORS.primary} />
              <Text style={styles.badgeText}>Punctual Pro</Text>
            </View>
          )}

          {metrics.totalTrips >= 50 && (
            <View style={styles.badge}>
              <Ionicons name="trophy" size={32} color={COLORS.warning} />
              <Text style={styles.badgeText}>Road Warrior</Text>
            </View>
          )}
        </View>

        {completionRate < 95 && metrics.safetyScore < 95 && metrics.onTimePercentage < 95 && metrics.totalTrips < 50 && (
          <View style={styles.emptyBadges}>
            <Ionicons name="medal-outline" size={48} color={COLORS.gray[400]} />
            <Text style={styles.emptyText}>Keep up the good work to earn badges!</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  scoreValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 40,
    fontWeight: '700',
  },
  scoreLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  metricBox: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  statValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  achievementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.success + '10',
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    fontWeight: '600',
  },
  achievementSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  badge: {
    width: '47%',
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    alignItems: 'center',
  },
  badgeText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  emptyBadges: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
