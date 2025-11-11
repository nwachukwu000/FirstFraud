-- SQL script to create a new PostgreSQL database for FDT2
-- Run this script using: psql -U postgres -f CreateDatabase.sql

-- Check if database exists and drop it if needed (uncomment the next line if you want to drop existing database)
-- DROP DATABASE IF EXISTS fdt2_db;

-- Create the new database
CREATE DATABASE fdt2_db;

-- Grant privileges (optional, adjust as needed)
-- GRANT ALL PRIVILEGES ON DATABASE fdt2_db TO postgres;

-- Connect to the new database and set up extensions if needed
\c fdt2_db

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

