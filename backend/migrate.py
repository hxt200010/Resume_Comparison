import sqlite3

try:
    conn = sqlite3.connect('ats.db')
    c = conn.cursor()
    c.execute("ALTER TABLE user_profiles ADD COLUMN first_name TEXT DEFAULT ''")
    c.execute("ALTER TABLE user_profiles ADD COLUMN last_name TEXT DEFAULT ''")
    c.execute("ALTER TABLE user_profiles ADD COLUMN email TEXT DEFAULT ''")
    c.execute("ALTER TABLE user_profiles ADD COLUMN phone TEXT DEFAULT ''")
    c.execute("ALTER TABLE user_profiles ADD COLUMN linkedin TEXT DEFAULT ''")
    c.execute("ALTER TABLE user_profiles ADD COLUMN portfolio TEXT DEFAULT ''")
    c.execute("ALTER TABLE user_profiles ADD COLUMN last_name TEXT DEFAULT ''")
    conn.commit()
    print('Db updated')
except Exception as e:
    print('Failed or already migrated:', e)
finally:
    conn.close()
