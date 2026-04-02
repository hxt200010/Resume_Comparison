import sqlite3
try:
    conn = sqlite3.connect('ats.db')
    conn.execute('ALTER TABLE history ADD COLUMN resume_json TEXT DEFAULT "{}"')
    conn.execute('ALTER TABLE history ADD COLUMN job_json TEXT DEFAULT "{}"')
    conn.commit()
    print("Success")
except Exception as e:
    print(str(e))
finally:
    conn.close()
