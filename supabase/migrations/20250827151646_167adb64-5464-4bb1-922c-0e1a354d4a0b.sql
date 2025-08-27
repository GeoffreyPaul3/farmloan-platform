
-- Fix type mismatch in audit function to prevent COALESCE text/uuid error (code 42804)
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
as $function$
declare
    v_table text;
    v_action text;
    v_id uuid;
    v_user_id uuid;
    v_old jsonb;
    v_new jsonb;
begin
    -- Table name
    v_table := tg_table_name;
    
    -- Action and ids
    if tg_op = 'INSERT' then
        v_action := 'INSERT';
        v_id := new.id;
        v_old := null;
        v_new := to_jsonb(new);
    elsif tg_op = 'UPDATE' then
        v_action := 'UPDATE';
        v_id := new.id;
        v_old := to_jsonb(old);
        v_new := to_jsonb(new);
    elsif tg_op = 'DELETE' then
        v_action := 'DELETE';
        v_id := old.id;
        v_old := to_jsonb(old);
        v_new := null;
    end if;

    -- Safely derive user id (all arguments are uuid-typed)
    v_user_id := coalesce(
        nullif((current_setting('request.jwt.claims', true)::json ->> 'sub'), '')::uuid,
        nullif(current_setting('app.current_user_id', true), '')::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid
    );

    -- Only log when we have a non-system user id
    if v_user_id is not null
       and v_user_id <> '00000000-0000-0000-0000-000000000000'::uuid then
        insert into public.audit_logs (
            table_name, 
            action, 
            record_id, 
            user_id, 
            old_values, 
            new_values, 
            created_at
        ) values (
            v_table, 
            v_action, 
            v_id, 
            v_user_id, 
            v_old, 
            v_new, 
            now()
        );
    end if;

    return coalesce(new, old);
end;
$function$;
