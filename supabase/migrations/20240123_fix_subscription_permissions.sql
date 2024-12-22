-- Enable RLS
alter table subscriptions enable row level security;

-- Policies for subscriptions table
create policy "Users can view their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role');

create policy "Enable read access for users"
  on subscriptions for select
  using (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Permissions
grant usage on schema public to authenticated;
grant all on subscriptions to authenticated;
grant usage on schema public to anon;
grant select on subscriptions to anon;

-- Add webhook handler policy
create policy "Webhook can insert and update subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role'); 