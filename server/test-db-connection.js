const mysql = require("mysql2/promise");

async function testDatabaseConnection() {
  console.log("🔍 Testing MySQL Database Connection...\n");
  
  // Configuration from env.js
  const config = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "real_time_chat_app"
  };
  
  console.log("📋 Configuration:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Password: ${config.password ? '[SET]' : '[EMPTY]'}`);
  console.log();
  
  try {
    // Test basic connection without database
    console.log("1️⃣ Testing basic MySQL connection...");
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    console.log("   ✅ Basic connection successful!");
    
    // Test database exists
    console.log("2️⃣ Checking if database exists...");
    const [databases] = await connection.execute(`SHOW DATABASES LIKE '${config.database}'`);
    
    if (databases.length > 0) {
      console.log(`   ✅ Database '${config.database}' exists!`);
      
      // Connect to specific database
      await connection.changeUser({ database: config.database });
      
      // Test tables
      console.log("3️⃣ Checking database tables...");
      const [tables] = await connection.execute("SHOW TABLES");
      
      if (tables.length > 0) {
        console.log(`   ✅ Found ${tables.length} tables:`);
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`      - ${tableName}`);
        });
        
        // Test a simple query
        console.log("4️⃣ Testing query execution...");
        const [result] = await connection.execute("SELECT COUNT(*) as count FROM users");
        console.log(`   ✅ Query successful! Users table count: ${result[0].count}`);
        
      } else {
        console.log("   ⚠️  No tables found. Database needs to be initialized.");
      }
      
    } else {
      console.log(`   ❌ Database '${config.database}' does not exist!`);
      console.log("   💡 The server will create it automatically on first run.");
    }
    
    await connection.end();
    console.log("\n🎉 Database connection test completed successfully!");
    
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'Unknown'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log("\n💡 Possible solutions:");
      console.log("   1. Make sure MySQL server is running");
      console.log("   2. Check if MySQL is on the correct port (3306)");
      console.log("   3. Verify firewall settings");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("\n💡 Possible solutions:");
      console.log("   1. Check username and password");
      console.log("   2. Ensure user has proper permissions");
      console.log("   3. Try creating a new user with proper privileges");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log("\n💡 Possible solutions:");
      console.log("   1. Create the database manually");
      console.log("   2. Let the server create it on first run");
      console.log("   3. Check database name spelling");
    }
    
    process.exit(1);
  }
}

// Check phpMyAdmin accessibility
async function testPhpMyAdmin() {
  console.log("\n🌐 Testing phpMyAdmin accessibility...");
  
  try {
    const response = await fetch('http://localhost/phpmyadmin', {
      method: 'HEAD',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log("   ✅ phpMyAdmin is accessible at http://localhost/phpmyadmin");
    } else {
      console.log(`   ⚠️  phpMyAdmin returned status: ${response.status}`);
    }
  } catch (error) {
    console.log("   ❌ phpMyAdmin is not accessible:");
    console.log(`      Error: ${error.message}`);
    console.log("\n💡 Possible solutions:");
    console.log("   1. Make sure phpMyAdmin is installed and running");
    console.log("   2. Check if Apache/Nginx web server is running");
    console.log("   3. Verify phpMyAdmin configuration");
    console.log("   4. Try accessing via XAMPP/WAMP control panel");
  }
}

// Run tests
async function runTests() {
  await testDatabaseConnection();
  await testPhpMyAdmin();
}

runTests().catch(console.error);
