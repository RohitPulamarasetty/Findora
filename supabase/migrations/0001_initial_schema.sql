-- 0001_initial_schema.sql
-- Enums for Findora

create type public.item_type as enum ('lost', 'found');

create type public.item_status as enum (
  'active',
  'claim_pending',
  'verified',
  'completed',
  'closed'
);

create type public.item_category as enum (
  'electronics',
  'clothing',
  'accessories',
  'books',
  'stationery',
  'keys',
  'wallet',
  'id_card',
  'bag',
  'sports',
  'other'
);

create type public.user_role as enum ('student', 'admin');

create type public.message_status as enum ('sent', 'delivered', 'read');

create type public.flag_reason as enum (
  'spam',
  'inappropriate',
  'fake',
  'duplicate',
  'other'
);
