-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABEL PENGGUNA
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABEL MESIN
CREATE TABLE mesin (
    id UUID PRIMARY KEY,
    nama_mesin VARCHAR(100) NOT NULL,
    tipe_mesin VARCHAR(50) NOT NULL,
    status_aktif BOOLEAN DEFAULT TRUE
);

-- TABEL LOG PRODUKSI
CREATE TABLE log_produksi (
    id UUID NOT NULL,
    id_mesin UUID NOT NULL REFERENCES mesin(id),
    jumlah_barang INT NOT NULL,
    status_mesin VARCHAR(20) NOT NULL,
    temperatur DECIMAL(5,2) NOT NULL,
    nama_operator VARCHAR(100) NOT NULL,
    waktu_pencatatan TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id, waktu_pencatatan)
);

-- KONVERSI KE TIMESCALEDB (HYPERTABLE)
SELECT create_hypertable('log_produksi', 'waktu_pencatatan');

CREATE INDEX ix_log_produksi_mesin
ON log_produksi (id_mesin, waktu_pencatatan DESC);

-- ======================================
-- DATA AWAL USERS
-- ======================================

INSERT INTO users (id, username, password_hash, role)
VALUES
(uuid_generate_v4(), 'admin', 'admin123', 'admin'),
(uuid_generate_v4(), 'operator1', 'operator123', 'operator'),
(uuid_generate_v4(), 'operator2', 'operator123', 'operator');

-- ======================================
-- DATA AWAL MESIN
-- ======================================

INSERT INTO mesin (id, nama_mesin, tipe_mesin, status_aktif)
VALUES
(uuid_generate_v4(), 'Mesin Injection 01', 'Injection', TRUE),
(uuid_generate_v4(), 'Mesin CNC 01', 'CNC', TRUE),
(uuid_generate_v4(), 'Mesin Press 01', 'Press', TRUE),
(uuid_generate_v4(), 'Mesin Cutting 01', 'Cutting', FALSE);