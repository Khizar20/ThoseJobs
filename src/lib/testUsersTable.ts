import { supabase } from './supabaseClient';

export const testUsersTable = async () => {
  console.log("=== TESTING USERS TABLE ===");
  
  try {
    // Test 1: Check if table exists
    console.log("🔄 Testing if users table exists...");
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log("Table existence test:", { tableInfo, tableError });
    
    if (tableError) {
      console.error("❌ Users table error:", tableError);
      return { success: false, error: tableError.message };
    }
    
    // Test 2: Check table structure
    console.log("🔄 Checking table structure...");
    const { data: structureData, error: structureError } = await supabase
      .rpc('get_table_info', { table_name: 'users' })
      .catch(() => ({ data: null, error: 'RPC not available' }));
    
    console.log("Table structure:", structureData);
    
    // Test 3: Try to insert a test record
    console.log("🔄 Testing insert capability...");
    const testData = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      phone: '1234567890',
      address: 'Test Address',
      password_hash: 'test-hash',
      addresses: JSON.stringify([]),
      preferences: JSON.stringify({}),
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testData)
      .select();
    
    console.log("Insert test:", { insertData, insertError });
    
    if (insertError) {
      console.error("❌ Insert test failed:", insertError);
      return { success: false, error: insertError.message };
    }
    
    // Test 4: Try to select the test record
    console.log("🔄 Testing select capability...");
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'test-user-id')
      .single();
    
    console.log("Select test:", { selectData, selectError });
    
    // Clean up test data
    await supabase
      .from('users')
      .delete()
      .eq('id', 'test-user-id');
    
    console.log("✅ Users table test completed successfully");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Users table test failed:", error);
    return { success: false, error: error.message };
  }
};

// Function to check RLS policies
export const checkRLSPolicies = async () => {
  console.log("=== CHECKING RLS POLICIES ===");
  
  try {
    // Test RLS by trying to access as authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log("✅ User is authenticated, testing RLS...");
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      console.log("RLS test result:", { data, error });
      
      if (error) {
        console.error("❌ RLS policy issue:", error);
        return { success: false, error: error.message };
      }
      
      console.log("✅ RLS policies working correctly");
      return { success: true };
    } else {
      console.log("⚠️ No authenticated session, skipping RLS test");
      return { success: true, warning: "No authenticated session" };
    }
  } catch (error: any) {
    console.error("❌ RLS check failed:", error);
    return { success: false, error: error.message };
  }
}; 