-- Esquema relacional para JARVIS (Supabase / PostgreSQL)
-- Ejecuta esto completo en el SQL Editor de tu proyecto de Supabase.

create table if not exists categories (
  name text primary key
);

insert into categories (name) values
  ('alimentacion'), ('transporte'), ('servicios'), ('educacion'),
  ('ocio'), ('salud'), ('otros')
on conflict (name) do nothing;

create table if not exists credit_cards (
  id bigint generated always as identity primary key,
  name text not null,
  limit_amount numeric not null check (limit_amount > 0),
  used_amount numeric not null default 0 check (used_amount >= 0),
  cutoff_day int check (cutoff_day between 1 and 31),
  due_day int check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id bigint generated always as identity primary key,
  description text not null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null references categories(name),
  -- si el gasto fue con una tarjeta registrada, queda enlazado (integridad referencial real);
  -- si se borra la tarjeta, la transacción no se borra, solo se desvincula.
  credit_card_id bigint references credit_cards(id) on delete set null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists savings_goals (
  id bigint generated always as identity primary key,
  name text not null unique,
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  created_at timestamptz not null default now()
);

-- Historial de abonos: en vez de solo sumar un número, cada abono queda como
-- una fila propia referenciando su meta. Esto es lo que le da integridad
-- referencial real al modelo (si se borra la meta, se borran sus abonos en cascada).
create table if not exists savings_contributions (
  id bigint generated always as identity primary key,
  goal_id bigint not null references savings_goals(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date timestamptz not null default now()
);

create table if not exists tasks (
  id bigint generated always as identity primary key,
  text text not null,
  due_date date,
  priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completado')),
  created_at timestamptz not null default now()
);

create table if not exists email_drafts (
  id bigint generated always as identity primary key,
  to_address text,
  subject text,
  body text not null,
  status text not null default 'borrador',
  created_at timestamptz not null default now()
);

-- Índices útiles para las consultas más frecuentes del orquestador
create index if not exists idx_transactions_date on transactions(date desc);
create index if not exists idx_transactions_category on transactions(category);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_contributions_goal on savings_contributions(goal_id);