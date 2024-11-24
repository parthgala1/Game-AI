import psycopg2 as pg

class DatabaseManager:
    def __init__(self, host, dbname, user, password, port):
        self.host = host
        self.dbname = dbname
        self.user = user
        self.password = password
        self.port = port
        self.conn = None
        self.cur = None

    def get_db_connection(self):
        self.conn = pg.connect(
            host=self.host,
            dbname=self.dbname,
            user=self.user,
            password=self.password,
            port=self.port
        )
        self.cur = self.conn.cursor()
        return self.conn
    
    def disconnect(self):
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
        print("Connection closed")

    def setup_database(self):
        conn = self.get_db_connection()
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS PLAYER_TABLE (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE,
                age INT,
                player_level FLOAT DEFAULT 1
            );
        """)
        self.conn.commit()  # Commit changes to the database
        self.disconnect()

    def insert_user(self, username, age):
        conn = self.get_db_connection()
        try:
            self.cur.execute("""
                INSERT INTO PLAYER_TABLE (name, age)
                VALUES (%s, %s)
                ON CONFLICT (name) DO NOTHING
            """, (username, age))
            conn.commit()
            print(f"Successfully inserted {username} into the database.")
        except Exception as e:
            print(f"Cannot insert {username} into the database: {e}")
        self.disconnect()
