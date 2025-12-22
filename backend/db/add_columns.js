import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'schema1'
};

async function addColumns() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Check if columns exist in student_details
    const [rows] = await connection.execute("DESCRIBE student_details");

    const columns = rows.map(row => row.Field);
    console.log("Existing columns in student_details:", columns);

    // Add city column if not exists
    if (!columns.includes('city')) {
      await connection.execute("ALTER TABLE student_details ADD COLUMN city VARCHAR(255)");
      console.log("Added city column");
    }

    // Add address column if not exists
    if (!columns.includes('address')) {
      await connection.execute("ALTER TABLE student_details ADD COLUMN address TEXT");
      console.log("Added address column");
    }

    // Check if event_attended table has state column and rename to event_state
    const [eventRows] = await connection.execute("DESCRIBE event_attended");
    const eventColumns = eventRows.map(row => row.Field);
    console.log("Existing columns in event_attended:", eventColumns);

    if (eventColumns.includes('state') && !eventColumns.includes('event_state')) {
      await connection.execute("ALTER TABLE event_attended CHANGE COLUMN state event_state VARCHAR(255) NOT NULL");
      console.log("Renamed state column to event_state in event_attended table");
    }

    console.log("Columns added/updated successfully");

  } catch (error) {
    console.error("Error adding/updating columns:", error);
  } finally {
    if (connection) connection.end();
  }
}

addColumns();
