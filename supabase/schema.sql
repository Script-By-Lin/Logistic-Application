create table if not exists pipe_types (
  id serial primary key,
  name text not null unique,
  unit_price numeric not null default 0
);

create table if not exists productions (
  id serial primary key,
  date date not null,
  pipe_type_id integer not null references pipe_types(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  batch_id text
);

create table if not exists distributions (
  id serial primary key,
  date date not null,
  pipe_type_id integer not null references pipe_types(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  village text not null,
  price numeric not null,
  from_location text,
  to_location text,
  remark text,
  batch_id text
);

create table if not exists returns (
  id serial primary key,
  date date not null,
  village text not null,
  pipe_type_id integer not null references pipe_types(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null check (status in ('damaged', 'production_grade')),
  price numeric not null default 0.00,
  remark text,
  batch_id text
);

create table if not exists app_users (
  id serial primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'viewer'
);

create table if not exists audit_logs (
  id serial primary key,
  user_email text not null,
  action text not null,
  details text,
  timestamp timestamp not null default now()
);

create table if not exists villages (
  id serial primary key,
  name text not null unique
);

insert into pipe_types (name, unit_price) values
  ('6-inch pipe', 25.00),
  ('8-inch pipe', 38.00),
  ('10-inch pipe', 50.00)
on conflict (name) do nothing;

insert into villages (name) values
  ('Village A'),
  ('Village B'),
  ('Village C'),
  ('Village D')
on conflict (name) do nothing;
