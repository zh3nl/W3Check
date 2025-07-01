import { supabase } from '../lib/supabase';
import { ScanResult, ViolationType } from '../types';

export interface DatabaseScanResult {
  id: string;
  user_id: string;
  url: string;
  timestamp: string;
  status: 'completed' | 'failed';
  passes: number;
  incomplete: number;
  inapplicable: number;
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  created_at: string;
  updated_at: string;
  violations?: DatabaseViolation[];
}

export interface DatabaseViolation {
  id: number;
  scan_result_id: string;
  violation_id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help_url: string;
  tags: string[];
  ai_suggestion?: string;
  nodes?: DatabaseViolationNode[];
}

export interface DatabaseViolationNode {
  id: number;
  violation_id: number;
  html: string;
  target: string[];
  failure_summary: string;
}

/**
 * Save scan results to Supabase database
 */
export async function saveScanResults(scanResults: ScanResult[]): Promise<void> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Process each scan result
    for (const scanResult of scanResults) {
      // First, save the main scan result
      const { error: scanError } = await supabase
        .from('scan_results')
        .upsert({
          id: scanResult.id,
          user_id: user.id,
          url: scanResult.url,
          timestamp: scanResult.timestamp,
          status: scanResult.status,
          passes: scanResult.passes,
          incomplete: scanResult.incomplete,
          inapplicable: scanResult.inapplicable,
          summary: scanResult.summary
        });

      if (scanError) {
        console.error('Error saving scan result:', scanError);
        throw scanError;
      }

      // If scan completed successfully, save violations
      if (scanResult.status === 'completed' && scanResult.violations.length > 0) {
        await saveViolations(scanResult.id, scanResult.violations);
      }
    }
  } catch (error) {
    console.error('Error saving scan results:', error);
    throw error;
  }
}

/**
 * Save violations for a scan result
 */
async function saveViolations(scanResultId: string, violations: ViolationType[]): Promise<void> {
  for (const violation of violations) {
    // Save the violation
    const { data: violationData, error: violationError } = await supabase
      .from('violations')
      .insert({
        scan_result_id: scanResultId,
        violation_id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help_url: violation.helpUrl,
        tags: violation.tags,
        ai_suggestion: violation.aiSuggestion
      })
      .select('id')
      .single();

    if (violationError) {
      console.error('Error saving violation:', violationError);
      throw violationError;
    }

    // Save violation nodes
    if (violation.nodes.length > 0) {
      const violationNodes = violation.nodes.map(node => ({
        violation_id: violationData.id,
        html: node.html,
        target: node.target,
        failure_summary: node.failureSummary
      }));

      const { error: nodesError } = await supabase
        .from('violation_nodes')
        .insert(violationNodes);

      if (nodesError) {
        console.error('Error saving violation nodes:', nodesError);
        throw nodesError;
      }
    }
  }
}

/**
 * Get all scan results for the current user
 */
export async function getUserScanResults(): Promise<ScanResult[]> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch scan results with violations
    const { data: scanResults, error: scanError } = await supabase
      .from('scan_results')
      .select(`
        *,
        violations:violations (
          *,
          nodes:violation_nodes (*)
        )
      `)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (scanError) {
      console.error('Error fetching scan results:', scanError);
      throw scanError;
    }

    // Transform database results to match ScanResult type
    return (scanResults || []).map(transformDatabaseToScanResult);
  } catch (error) {
    console.error('Error getting user scan results:', error);
    throw error;
  }
}

/**
 * Get a specific scan result by ID
 */
export async function getScanResultById(id: string): Promise<ScanResult | null> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: scanResult, error } = await supabase
      .from('scan_results')
      .select(`
        *,
        violations:violations (
          *,
          nodes:violation_nodes (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      console.error('Error fetching scan result:', error);
      throw error;
    }

    return transformDatabaseToScanResult(scanResult);
  } catch (error) {
    console.error('Error getting scan result by ID:', error);
    throw error;
  }
}

/**
 * Get scan results for a specific URL
 */
export async function getScanResultsByUrl(url: string): Promise<ScanResult[]> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: scanResults, error } = await supabase
      .from('scan_results')
      .select(`
        *,
        violations:violations (
          *,
          nodes:violation_nodes (*)
        )
      `)
      .eq('url', url)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching scan results by URL:', error);
      throw error;
    }

    return (scanResults || []).map(transformDatabaseToScanResult);
  } catch (error) {
    console.error('Error getting scan results by URL:', error);
    throw error;
  }
}

/**
 * Delete a scan result and all associated data
 */
export async function deleteScanResult(id: string): Promise<void> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('scan_results')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting scan result:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting scan result:', error);
    throw error;
  }
}

/**
 * Get unique URLs scanned by the user (for dashboard)
 */
export async function getUniqueScannedUrls(): Promise<ScanResult[]> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get the most recent scan for each unique URL
    const { data: scanResults, error } = await supabase
      .from('scan_results')
      .select('*')
      .eq('user_id', user.id)
      .order('url')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching unique URLs:', error);
      throw error;
    }

    // Get unique URLs by keeping only the most recent scan for each URL
    const uniqueUrlsMap = new Map<string, DatabaseScanResult>();
    (scanResults || []).forEach(result => {
      if (!uniqueUrlsMap.has(result.url) || 
          new Date(result.timestamp) > new Date(uniqueUrlsMap.get(result.url)!.timestamp)) {
        uniqueUrlsMap.set(result.url, result);
      }
    });

    return Array.from(uniqueUrlsMap.values()).map(result => ({
      id: result.id,
      url: result.url,
      timestamp: result.timestamp,
      status: result.status,
      violations: [], // Don't need full violations for dashboard
      passes: result.passes,
      incomplete: result.incomplete,
      inapplicable: result.inapplicable,
      summary: result.summary
    }));
  } catch (error) {
    console.error('Error getting unique scanned URLs:', error);
    throw error;
  }
}

/**
 * Transform database result to ScanResult type
 */
function transformDatabaseToScanResult(dbResult: any): ScanResult {
  const violations: ViolationType[] = (dbResult.violations || []).map((violation: any) => ({
    id: violation.violation_id,
    impact: violation.impact,
    description: violation.description,
    helpUrl: violation.help_url,
    tags: violation.tags || [],
    aiSuggestion: violation.ai_suggestion,
    nodes: (violation.nodes || []).map((node: any) => ({
      html: node.html,
      target: node.target || [],
      failureSummary: node.failure_summary
    }))
  }));

  return {
    id: dbResult.id,
    url: dbResult.url,
    timestamp: dbResult.timestamp,
    status: dbResult.status,
    violations,
    passes: dbResult.passes,
    incomplete: dbResult.incomplete,
    inapplicable: dbResult.inapplicable,
    summary: dbResult.summary
  };
}

/**
 * Migrate localStorage data to Supabase (one-time migration helper)
 */
export async function migrateLocalStorageToSupabase(): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      return; // Server-side, no localStorage
    }

    const storedHistory = localStorage.getItem('scanHistory');
    if (!storedHistory) {
      return; // No data to migrate
    }

    const history: ScanResult[] = JSON.parse(storedHistory);
    if (history.length === 0) {
      return; // No data to migrate
    }

    // Save to Supabase
    await saveScanResults(history);
    
    // Optionally clear localStorage after successful migration
    // localStorage.removeItem('scanHistory');
    
    console.log(`Migrated ${history.length} scan results to Supabase`);
  } catch (error) {
    console.error('Error migrating localStorage to Supabase:', error);
    throw error;
  }
} 