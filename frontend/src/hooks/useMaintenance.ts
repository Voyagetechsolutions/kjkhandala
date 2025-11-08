import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import maintenanceService from '@/services/maintenanceService';

// Work Orders
export function useWorkOrders(filters?: any) {
  return useQuery({
    queryKey: ['work-orders', filters],
    queryFn: () => maintenanceService.getWorkOrders(filters),
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-order', id],
    queryFn: () => maintenanceService.getWorkOrderById(id),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      maintenanceService.updateWorkOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.id] });
    },
  });
}

export function useAssignMechanic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mechanicId }: { id: string; mechanicId: string }) => 
      maintenanceService.assignMechanic(id, mechanicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

// Schedule
export function useSchedule(filters?: any) {
  return useQuery({
    queryKey: ['maintenance-schedule', filters],
    queryFn: () => maintenanceService.getSchedule(filters),
  });
}

export function useScheduleByBus(busId: string) {
  return useQuery({
    queryKey: ['maintenance-schedule', 'bus', busId],
    queryFn: () => maintenanceService.getScheduleByBus(busId),
    enabled: !!busId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedule'] });
    },
  });
}

export function useMarkScheduleCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      maintenanceService.markCompleted(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedule'] });
    },
  });
}

// Inspections
export function useInspections(filters: any) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: () => maintenanceService.getInspections(filters),
  });
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: ['inspection', id],
    queryFn: () => maintenanceService.getInspectionById(id),
    enabled: !!id,
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useUploadInspectionPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => 
      maintenanceService.uploadInspectionPhoto(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection', variables.id] });
    },
  });
}

// Repairs
export function useRepairs(filters: any) {
  return useQuery({
    queryKey: ['repairs', filters],
    queryFn: () => maintenanceService.getRepairs(filters),
  });
}

export function useRepairHistory(busId: string) {
  return useQuery({
    queryKey: ['repairs', 'history', busId],
    queryFn: () => maintenanceService.getRepairHistory(busId),
    enabled: !!busId,
  });
}

export function useCreateRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.createRepair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
    },
  });
}

// Inventory
export function useInventory(filters?: any) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => maintenanceService.getInventory(filters),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => maintenanceService.getInventoryItem(id),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity, reason }: { itemId: string; quantity: number; reason: string }) => 
      maintenanceService.updateStock(itemId, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => maintenanceService.getLowStockItems(),
  });
}

// Costs
export function useCosts(filters: any) {
  return useQuery({
    queryKey: ['maintenance-costs', filters],
    queryFn: () => maintenanceService.getCosts(filters),
  });
}

export function useCostByBus(busId: string, period: string) {
  return useQuery({
    queryKey: ['maintenance-costs', 'bus', busId, period],
    queryFn: () => maintenanceService.getCostByBus(busId, period),
    enabled: !!busId && !!period,
  });
}

export function useCostBreakdown(period: string) {
  return useQuery({
    queryKey: ['maintenance-costs', 'breakdown', period],
    queryFn: () => maintenanceService.getCostBreakdown(period),
    enabled: !!period,
  });
}
