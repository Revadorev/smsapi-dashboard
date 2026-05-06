const { chromium } = require('playwright')

const SQL_SCHEMA = `create extension if not exists "uuid-ossp";
create table if not exists public.sms_logs (id uuid primary key default uuid_generate_v4(), phone_number text not null, message text not null, sender_name text not null default 'Test', status text not null default 'PENDING', smsapi_id text, points numeric(10,4), error_code integer, error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists sms_logs_created_at_idx on public.sms_logs(created_at desc);
create index if not exists sms_logs_phone_idx on public.sms_logs(phone_number);
create table if not exists public.sms_templates (id uuid primary key default uuid_generate_v4(), name text not null unique, content text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create or replace function public.handle_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists sms_logs_updated_at on public.sms_logs;
create trigger sms_logs_updated_at before update on public.sms_logs for each row execute function public.handle_updated_at();
drop trigger if exists sms_templates_updated_at on public.sms_templates;
create trigger sms_templates_updated_at before update on public.sms_templates for each row execute function public.handle_updated_at();
alter table public.sms_logs enable row level security;
alter table public.sms_templates enable row level security;
drop policy if exists "Allow all sms_logs" on public.sms_logs;
create policy "Allow all sms_logs" on public.sms_logs for all using (true) with check (true);
drop policy if exists "Allow all sms_templates" on public.sms_templates;
create policy "Allow all sms_templates" on public.sms_templates for all using (true) with check (true);
insert into public.sms_templates (name, content) values ('Salut client', 'Buna ziua! Va multumim ca ati ales serviciile noastre. Echipa KidGPS'), ('Confirmare comanda', 'Comanda dvs. a fost confirmata si va fi livrata in 24-48h. Multumim!'), ('Reminder plata', 'Va rugam sa efectuati plata pentru serviciile active. Detalii pe portal.') on conflict (name) do nothing;`

;(async () => {
  console.log('[1] Launching Chromium...')
  const browser = await chromium.launch({
    executablePath: '/home/ubuntu/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  page.setDefaultTimeout(20000)

  // LOGIN
  console.log('[2] Going to Supabase login...')
  await page.goto('https://supabase.com/dashboard/sign-in', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input[type="email"]')
  
  await page.fill('input[type="email"]', 'kidgpsro@gmail.com')
  await page.fill('input[type="password"]', 'carinaMARIAw1r3l3$$')
  console.log('[3] Submitting login...')
  await page.click('button[type="submit"]')
  
  // Asteapta redirect dupa login
  await page.waitForURL(/\/dashboard\/|\/sign-in/, { timeout: 15000 })
  console.log('[4] After login:', page.url())
  
  if (page.url().includes('sign-in')) {
    // Poate e MFA sau eroare
    await page.screenshot({ path: '/tmp/sb-after-login.png' })
    console.log('Still on sign-in, screenshot saved')
    
    // Verific daca e un error message
    const errEl = await page.locator('[data-testid="error-message"], .error, [role="alert"]').first()
    const hasErr = await errEl.count()
    if (hasErr) {
      console.log('Error:', await errEl.textContent())
    }
    await browser.close()
    return
  }
  
  // NAVIGATE TO SQL EDITOR
  console.log('[5] Navigating to SQL editor...')
  await page.goto('https://supabase.com/dashboard/project/iifbzrvhqobwwlespvyg/sql/new', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  console.log('[6] SQL editor URL:', page.url())
  
  await page.screenshot({ path: '/tmp/sb-sql-editor.png' })
  
  // Cauta editorul cm-content (CodeMirror 6)
  let editor = page.locator('.cm-content').first()
  let hasEditor = await editor.count()
  
  if (!hasEditor) {
    // Incearca alte selectoare
    editor = page.locator('[contenteditable="true"]').first()
    hasEditor = await editor.count()
    console.log('[6b] Contenteditable found:', hasEditor)
  }
  
  if (!hasEditor) {
    console.log('No editor found! Page HTML snippet:')
    const html = await page.content()
    console.log(html.substring(0, 500))
    await browser.close()
    return
  }
  
  console.log('[7] Clicking editor and entering SQL...')
  await editor.click()
  await page.waitForTimeout(500)
  
  // Selecteaza tot si sterge
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Delete')
  await page.waitForTimeout(200)
  
  // Paste SQL
  await page.evaluate((sql) => {
    // Folosesc clipboard API
    const el = document.querySelector('.cm-content')
    if (el) {
      el.focus()
    }
  }, SQL_SCHEMA)
  
  // Type SQL (mai lent dar sigur)
  await page.keyboard.insertText(SQL_SCHEMA)
  console.log('[8] SQL inserted, looking for Run button...')
  
  await page.screenshot({ path: '/tmp/sb-sql-typed.png' })
  
  // Run button
  const runBtn = page.locator('button:has-text("Run")').first()
  const hasRun = await runBtn.count()
  console.log('[9] Run button found:', hasRun)
  
  if (hasRun) {
    await runBtn.click()
    console.log('[10] Clicked Run!')
  } else {
    // Keyboard shortcut
    console.log('[10] Using Ctrl+Enter shortcut')
    await page.keyboard.press('Control+Return')
  }
  
  await page.waitForTimeout(5000)
  await page.screenshot({ path: '/tmp/sb-sql-result.png' })
  
  // Verific daca a reusit
  const resultText = await page.locator('[data-testid="sql-result"], .sql-result, .console-output').textContent().catch(() => '')
  console.log('[11] Result:', resultText || 'No result element found')
  
  console.log('[12] Screenshots: /tmp/sb-sql-editor.png, /tmp/sb-sql-typed.png, /tmp/sb-sql-result.png')
  
  await browser.close()
  console.log('DONE!')
})().catch(e => {
  console.log('FATAL ERROR:', e.message)
  process.exit(1)
})
