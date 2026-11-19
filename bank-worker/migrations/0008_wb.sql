-- Bos Dunia: damage pemain asli per raid (slot = 'YYYY-MM-DDTHH' WIB)
CREATE TABLE IF NOT EXISTS wbdmg (slot TEXT NOT NULL, uid TEXT NOT NULL, name TEXT, dmg INTEGER NOT NULL DEFAULT 0, cp INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL, PRIMARY KEY (slot, uid));
