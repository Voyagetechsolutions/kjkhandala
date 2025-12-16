import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * Hook to get company-filtered Supabase queries
 * Automatically applies company_id filter based on the logged-in user's company
 */
export function useCompanyData() {
  const { companyId, user } = useAuth();

  /**
   * Creates a Supabase query builder with company_id filter applied
   * @param table - The table name to query
   * @returns A query builder with company_id filter if user has a company
   */
  const getCompanyQuery = (table: string) => {
    const query = supabase.from(table).select("*");
    if (companyId) {
      return query.eq("company_id", companyId);
    }
    return query;
  };

  /**
   * Creates a Supabase query builder with custom select and company_id filter
   * @param table - The table name to query
   * @param select - The columns to select
   * @returns A query builder with company_id filter if user has a company
   */
  const getCompanyQueryWithSelect = (table: string, select: string) => {
    const query = supabase.from(table).select(select);
    if (companyId) {
      return query.eq("company_id", companyId);
    }
    return query;
  };

  /**
   * Applies company_id filter to an existing query builder
   * @param query - The existing query builder
   * @returns The query builder with company_id filter applied
   */
  const applyCompanyFilter = <T extends { eq: (column: string, value: string) => T }>(
    query: T
  ): T => {
    if (companyId) {
      return query.eq("company_id", companyId);
    }
    return query;
  };

  /**
   * Gets the company_id to use for inserts
   * @returns The company_id or null
   */
  const getCompanyIdForInsert = () => companyId;

  /**
   * Checks if the user has a company assigned
   * @returns true if user has a company_id
   */
  const hasCompany = () => !!companyId;

  return {
    companyId,
    getCompanyQuery,
    getCompanyQueryWithSelect,
    applyCompanyFilter,
    getCompanyIdForInsert,
    hasCompany,
  };
}

export default useCompanyData;
