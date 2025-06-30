# Supabase Database Implementation for W3Check

This document explains the implementation of Supabase database integration for storing scan results in W3Check.

## Overview

The implementation migrates from localStorage to Supabase for:
- **Better data persistence**: Data survives browser clearing and is accessible across devices
- **User-specific data**: Each user has their own scan results with proper authentication
- **Scalability**: Can handle large amounts of scan data efficiently
- **Security**: Row-level security ensures users only access their own data

## Database Schema

### Tables

#### 1. `scan_results`
Main table storing scan result metadata:
- `id` (TEXT, PRIMARY KEY): Unique scan identifier
- `user_id` (UUID, FOREIGN KEY): Reference to authenticated user
- `url` (TEXT): Scanned website URL
- `timestamp` (TIMESTAMPTZ): When the scan was performed
- `status` (TEXT): 'completed' or 'failed'
- `passes` (INTEGER): Number of passed accessibility tests
- `incomplete` (INTEGER): Number of incomplete tests
- `inapplicable` (INTEGER): Number of inapplicable tests
- `summary` (JSONB): Summary statistics (critical, serious, moderate, minor, total counts)

#### 2. `violations`
Stores individual accessibility violations:
- `id` (SERIAL, PRIMARY KEY): Auto-incrementing violation ID
- `scan_result_id` (TEXT, FOREIGN KEY): Reference to scan result
- `violation_id` (TEXT): Axe-core violation ID
- `impact` (TEXT): Violation severity level
- `description` (TEXT): Violation description
- `help_url` (TEXT): URL to help documentation
- `tags` (JSONB): Array of violation tags
- `ai_suggestion` (TEXT, OPTIONAL): AI-generated suggestion for fixing

#### 3. `violation_nodes`
Stores specific DOM nodes that have violations:
- `id` (SERIAL, PRIMARY KEY): Auto-incrementing node ID
- `violation_id` (INTEGER, FOREIGN KEY): Reference to violation
- `html` (TEXT): HTML content of the violating element
- `target` (JSONB): CSS selector array targeting the element
- `failure_summary` (TEXT): Summary of what failed

### Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data via `user_id` filtering
- Automatic cascading deletes when user or scan result is deleted

## Implementation Files

### 1. Database Schema (`database-schema.sql`)
Run this SQL in your Supabase SQL editor to create all tables, indexes, and security policies.

### 2. Service Layer (`src/services/scanResults.ts`)
Contains all database operations:
- `saveScanResults()`: Save new scan results
- `getUserScanResults()`: Get all user's scan results
- `getScanResultById()`: Get specific scan result
- `getScanResultsByUrl()`: Get scans for specific URL
- `deleteScanResult()`: Delete scan result
- `getUniqueScannedUrls()`: Get unique URLs for dashboard
- `migrateLocalStorageToSupabase()`: One-time migration helper

### 3. Updated Components
- **Landing Page**: Saves results to Supabase with localStorage fallback
- **Results Page**: Fetches from Supabase with localStorage fallback
- **Dashboard**: Shows unique URLs from Supabase with localStorage fallback
- **Migration Helper**: Prompts users to migrate localStorage data

## Setup Instructions

### 1. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `database-schema.sql`
4. Verify tables are created in the Table Editor

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Authentication
The implementation assumes users are authenticated using Supabase Auth. Ensure:
- Authentication is properly configured
- Users are signed in before scanning
- Auth context provides user information

## Data Flow

### Saving Scan Results
1. User completes a scan
2. `saveScanResults()` is called with scan data
3. Main scan result is inserted into `scan_results` table
4. Each violation is inserted into `violations` table
5. Each violation node is inserted into `violation_nodes` table
6. Data is also saved to localStorage as fallback

### Retrieving Scan Results
1. Component requests scan data
2. Service tries to fetch from Supabase first
3. If Supabase fails, falls back to localStorage
4. Data is transformed to match expected `ScanResult` type
5. Component renders the data

### Migration
1. `MigrationHelper` component checks for localStorage data
2. If found and user is authenticated, prompts for migration
3. `migrateLocalStorageToSupabase()` transfers all localStorage data
4. User can optionally clear localStorage after migration

## Features

### Automatic Fallback
- All components try Supabase first, then localStorage
- Seamless experience even if database is unavailable
- No data loss during transitions

### Data Integrity
- Foreign key constraints ensure data consistency
- Cascading deletes prevent orphaned records
- JSONB validation for complex data structures

### Performance
- Proper indexing on frequently queried columns
- Efficient joins for violation data retrieval
- Pagination support for large datasets

### Security
- User isolation via Row Level Security
- No cross-user data access possible
- Secure API key handling

## Migration Path

### For Existing Users
1. Migration helper automatically detects localStorage data
2. Prompts user to migrate when authenticated
3. Transfers all historical scan data
4. Optionally clears localStorage after successful migration

### For New Users
- All data automatically saves to Supabase
- localStorage used only as backup/fallback
- No migration needed

## Future Enhancements

### Potential Improvements
1. **Pagination**: Add pagination for large scan histories
2. **Search**: Full-text search across scan results
3. **Analytics**: Aggregate statistics across all user scans
4. **Sharing**: Share scan results with other users
5. **Exports**: Export scan data in various formats
6. **Retention**: Automatic cleanup of old scan data

### Performance Optimizations
1. **Caching**: Add Redis caching for frequently accessed data
2. **Compression**: Compress large violation data
3. **Archiving**: Move old scans to cheaper storage
4. **Real-time**: Add real-time updates for scan progress

## Troubleshooting

### Common Issues

#### Authentication Errors
- Ensure user is properly authenticated
- Check Supabase Auth configuration
- Verify environment variables

#### Database Connection Issues
- Check Supabase project status
- Verify environment variables
- Test connection in Supabase dashboard

#### Migration Problems
- Check browser console for errors
- Verify localStorage data format
- Ensure user has proper permissions

#### Data Not Appearing
- Check RLS policies are correctly applied
- Verify user_id is being set correctly
- Test queries directly in Supabase

### Debug Commands

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Test database connection
const { data, error } = await supabase.from('scan_results').select('count');
console.log('Connection test:', { data, error });

// Check localStorage data
console.log('LocalStorage data:', localStorage.getItem('scanHistory'));
``` 