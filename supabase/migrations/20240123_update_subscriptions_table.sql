-- Add new columns to subscriptions table
alter table subscriptions
  add column if not exists customer_id text,
  add column if not exists customer_email text,
  add column if not exists product_id text,
  add column if not exists product_name text,
  add column if not exists variant_name text,
  add column if not exists card_brand text,
  add column if not exists card_last_four text;

-- Create orders table for storing order information
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  order_id text unique not null,
  user_id uuid references auth.users(id) on delete cascade,
  total decimal,
  status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on orders table
alter table orders enable row level security;

-- Create policies for orders table
create policy "Users can view their own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Service role can manage all orders"
  on orders for all
  using (auth.role() = 'service_role');

-- Create indexes
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_order_id on orders(order_id); 