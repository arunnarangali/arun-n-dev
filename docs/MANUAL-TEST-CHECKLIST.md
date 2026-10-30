# Manual test checklist: Akaza chat changes

> **How to use:** go top to bottom and tick each box `[x]` as it passes.
> If something fails, note the **step number** and what you saw.

| Part | What it tests | Needs |
|---|---|---|
| 0 | Setup | — |
| 1 | Access code eye | localhost |
| 2 | Cover letter + resume | localhost |
| 3 | Tabs and Mark applied | localhost |
| 4 | Not a fit | localhost |
| 5 | Next search uses feedback | localhost (1 search) |
| 6 | Same role / repost / Apply anyway | localhost + DevTools console |
| 7 | Ask Akaza | localhost |
| 8 | CSV export / import | localhost + private window |
| 9 | Sync across devices | **deploy + Cloudflare KV setup** |
| 10 | ✨ Improve + Tab suggestion | localhost |
| 11 | Cover letter collapses after applying | localhost (1 search) |
| 12 | Cover letter reads the real job description | localhost |
| 13 | Results CSV with Applied / Not applied | localhost (1 search) |

---

## 0. Setup

**Step 0.1:** Add this line to `.env.local`:

```
VITE_TRACKER_SYNC=off
```

> **Why:** sync always talks to the *deployed* worker, which doesn't have the sync code yet.
> Without this line, `/applied` keeps showing "Sync error (400)". You'll remove it in Part 9.

**Step 0.2:** Start the app:

```
npm run dev
```

Open **http://localhost:5173/arun-n-dev/**

**Step 0.3:** Open **DevTools → Application → Local Storage → localhost**. Watch these keys:

| Key | Holds |
|---|---|
| `vscode-akaza-applications` | jobs marked applied |
| `vscode-akaza-job-feedback` | "Not a fit" marks |
| `vscode-akaza-apply-anyway` | "Apply anyway" marks |

> **Search limit:** each job search uses Ollama's small free web-search quota, and fresh searches are limited to **4 per 10 minutes**.
> Only click refresh ⟳ where a step tells you to.

---

## 1. Access code eye 👁

- [ ] **1.1** Open Copilot and the Akaza screen. Type the code. It shows **dots**.
- [ ] **1.2** Click the 👁 icon. The code shows as **text**. Click again, and it's **hidden**.
- [ ] **1.3** Show it, then submit a **wrong** code. After "Access denied", the box is **hidden** again.
- [ ] **1.4** Enter the right code. **Access granted**.

---

## 2. Cover letter + resume 📄

- [ ] **2.1** Type `/jobs`, then click **Cover letter** on any card.
- [ ] **2.2** The Send bar under the letter has a **CV** button. Click it, and `ArunCV.pdf` downloads.
- [ ] **2.3** The hint reads: *"Opens Gmail. Use CV to download your resume and attach it."*
- [ ] **2.4** Click **Send now**. Gmail opens, and **no** CV download starts.
- [ ] **2.5** In the Gmail body, the signature ends with:
  ```
  Resume: https://arunnarangali.github.io/arun-n-dev/ArunCV.pdf
  ```
  > That link only works on the live site, not localhost.

---

## 3. Tabs and Mark applied ✓

- [ ] **3.1** Above the cards you see: **Open N · ✓ Applied 0 · ✕ Not a fit 0**, with **Open** selected.
- [ ] **3.2** Click **Mark applied** on job #1.
  - The card leaves Open.
  - This line appears: *"Marked … as applied. Undo · View applied"*
- [ ] **3.3** Click **Undo** in that line. The card is back in **Open**.
- [ ] **3.4** Mark it again, then click **View applied**. The **Applied** tab shows the card with *"Applied · date · Undo"*.
- [ ] **3.4b** In the Applied tab, the blue **Apply** button is replaced by a green **✓ Applied** badge (hover shows the date) and a small **View posting ↗** link that still opens the job page.
- [ ] **3.5** Click **Undo** on the card. It goes back to **Open**.
- [ ] **3.6** Mark it applied **once more** and leave it marked for the next parts.
- [ ] **3.7** Type `/applied`:
  - Three tabs: **✓ Applied 1 · ✕ Not a fit 0 · ↪ Apply anyway 0**
  - The job is listed under ✓ Applied with a 🗑 remove button.
  - The status line shows *"Sync off · saved in this browser"*.

---

## 4. Not a fit 👎

- [ ] **4.1** On another card, click **Not a fit**. Reason chips appear, with **Above my experience** preselected.
- [ ] **4.2** Pick **Other**. **Save** stays **disabled** until you type a reason.
- [ ] **4.3** Pick **Above my experience**, type `needs 6+ years`, and click **Save**.
  - The card moves to the **✕ Not a fit** tab.
  - It shows *"Not a fit · Above my experience · "needs 6+ years" · Undo"*.
- [ ] **4.4** In DevTools, `vscode-akaza-job-feedback` contains the entry.
- [ ] **4.5** Type `/applied` and open the **✕ Not a fit** tab. The mark is listed with reason, note and date.
- [ ] **4.6** Click 🗑 on it. It disappears, and the job card goes back to **Open**. Mark it Not a fit again for Part 5.

---

## 5. Next search uses your marks 🔁 (uses 1 search)

- [ ] **5.1** Click ⟳ (fresh search). **Under the "N openings" header**, a small box with the 🤖 icon shows how your marks were used:

  | Text in the box | When |
  |---|---|
  | *"Left out 1 you've already applied to"* | the job you marked applied came back with the same link |
  | *"Used 1 "Not a fit" note from earlier searches"* | always, since you have 1 Not a fit mark |
  | *"Skipped N similar roles (see below)"* | **maybe**: the AI decides |
  | *"Nothing matched them this time"* | the AI skipped nothing |

- [ ] **5.2** If anything was skipped, a **"Skipped N based on your 'Not a fit' feedback"** box under the Open / Applied / Not a fit tabs lists the jobs and reasons. Click it to expand.
- [ ] **5.3** With no applied jobs and no Not a fit marks, the 🤖 box doesn't appear at all.

---

## 6. Same role / repost / Apply anyway 🧪 (simulated)

These cases are hard to get from real searches, so you'll edit your saved application in the **DevTools → Console**.

> In each snippet, change **`Infosys`** to the company you marked applied in step 3.6.

### 6a. Same role, found on another job site

Run:

```js
k='vscode-akaza-applications'; a=JSON.parse(localStorage[k]); e=a.find(x=>!x.deleted&&x.company.includes('Infosys')); e.url='https://other-board.example/job/1'; localStorage[k]=JSON.stringify(a); location.reload()
```

- [ ] **6a.1** Reopen Copilot. The job is in **✓ Applied**, showing:
  *"Looks like the role you applied to on …"* with an **Apply anyway** button.
- [ ] **6a.2** Click **Apply anyway**:
  - It moves to **Open** with *"Similar to a role you applied to on … · Undo"*.
  - The line *"Marked … as a different opening"* appears.
- [ ] **6a.3** Click **Undo**. It's back in **Applied**.
- [ ] **6a.4** Click **Apply anyway** again. `vscode-akaza-apply-anyway` now has the link.
- [ ] **6a.5** In `/applied`, the **↪ Apply anyway** tab lists the link. Click 🗑, and the card goes back to **✓ Applied** ("Looks like…"). Click **Apply anyway** on the card again.
- [ ] **6a.6** Click **Mark applied** on it. It's a **separate** application: `/applied` now lists **2** entries.

### 6b. Repost (applied 70 days ago)

Run:

```js
k='vscode-akaza-applications'; a=JSON.parse(localStorage[k]); a.filter(x=>x.company.includes('Infosys')).forEach(e=>{e.url='https://old-board.example/1'; e.appliedAt=new Date(Date.now()-70*864e5).toISOString(); e.deleted=true}); a.find(x=>x.company.includes('Infosys')).deleted=false; localStorage[k]=JSON.stringify(a); localStorage.removeItem('vscode-akaza-apply-anyway'); location.reload()
```

- [ ] **6b.1** The card is in **Open** with *"Reposted · you applied on (70 days ago)"*.
- [ ] **6b.2** Hovering that line explains why.

### Reference: how each match is shown

| Match | Tab | Card shows |
|---|---|---|
| Same link | ✓ Applied | "Applied · date" + Undo |
| Same company + title, recent | ✓ Applied | "Looks like the role you applied to…" + **Apply anyway** |
| Same company + title, posted after you applied, **or** no posting date and 60+ days since | Open | "Reposted · you applied on…" |
| You clicked Apply anyway | Open | "Similar to a role you applied to…" + Undo |

---

## 7. Ask Akaza 💬

- [ ] **7.1** Ask: *"which jobs did I already apply to in these results?"* It knows the applied, same-role and repost ones.
- [ ] **7.2** Ask: *"why did you skip some jobs?"* It mentions your Not a fit feedback.

---

## 8. CSV export / import 📊

- [ ] **8.1** In `/applied`, click **Download tracker (CSV)**:
  - The file is named `akaza-job-tracker-<date>-<time>.csv` (a new name every time).
  - The **first column is `status`**, with readable values: `Applied`, `Not a fit`, `Apply anyway`.
- [ ] **8.2** Open a **private / incognito window** (empty storage), unlock, run `/applied`, and click **Import CSV**.
  - The message counts each kind.
  - The job cards show the same marks there.
- [ ] **8.3** Import the **same file again**. Everything counts as **skipped**, with no duplicates.
- [ ] **8.5** If you did 6a.6, both applications for that role (different links) are still **2 separate entries** after import.
- [ ] **8.4** An **old CSV** from before today (with an `applied_at` column) still imports.

---

## 9. Sync across devices ☁️ (after setup + deploy)

> ✅ The access-code guessing issue from the code review is fixed, so it's safe to deploy.

### Setup (once)

1. From `worker/`, run:
   ```
   npx wrangler kv namespace create TRACKER
   ```
2. Paste the printed **id** into the commented block at the end of `worker/wrangler.toml`, then uncomment those 3 lines.
3. In Cloudflare, give the API token stored in the GitHub secret `CLOUDFLARE_API_TOKEN` the **Workers KV Storage: Edit** permission.
4. Push to `main`.
5. **Remove** `VITE_TRACKER_SYNC=off` from `.env.local` and restart `npm run dev`.

### Tests

Use **two "devices"**: your normal browser + a private window, **or** the live site + localhost.

- [ ] **9.1** Unlock on **device A** and run `/applied`. It shows **"Synced · time"**.
- [ ] **9.2** Unlock on **device B**, which has different marks. After unlocking, B shows **A's marks too**.
- [ ] **9.3** Wait about **1 minute**, then switch back to A's tab. A shows **B's marks**.
- [ ] **9.4** **Undo** something on B, wait about 1 minute, and switch to A. It's **gone on A** and doesn't come back after a reload.
- [ ] **9.5** DevTools → Network → **Offline** on A, then mark something. It shows **"Not synced"**.
  Go back online, and within about 30 s it shows **"Synced"**.
- [ ] **9.6** With a **wrong** live access code, it shows *"The live site didn't accept this access code"*.
- [ ] **9.7** Open **two tabs** on device A, unlocked in both. Mark something in tab 1. Only one save happens (DevTools → Network in tab 2 shows no tracker POST with `put`).
- [ ] **9.8** Import the **same CSV** on both devices before syncing. After both sync, nothing appears twice.

### Sync status meanings

| Status | Meaning |
|---|---|
| Synced · 12:40 | Up to date with the cloud copy |
| Syncing… | Uploading or downloading now |
| Not synced | Offline or paused by the limit. Changes are kept and sent later |
| Sync error | The server refused. Hover for the reason |
| Sync not set up | The KV storage isn't configured on the worker yet |
| Sync off | `VITE_TRACKER_SYNC=off`, or Akaza is locked |

---

## 10. ✨ Improve my message + Tab suggestion

> Works on localhost right away (`npm run dev`). Each use costs one Ollama request.

### 10a. ✨ Improve (as a visitor: lock Akaza or use a private window)

- [ ] **10a.1** Type `wat projects did u bulid wiht react`. The ✨ icon next to Send becomes active.
- [ ] **10a.2** Hover ✨. The tooltip ends with *"3 of 3 left today"*.
- [ ] **10a.3** Click ✨ (or press **Ctrl+I**). The icon spins and the text is greyed out, then it becomes *"What projects did you build with React?"*
- [ ] **10a.4** The line under the input says **"Improved · Undo"**. Click **Undo**, and your original text is back.
- [ ] **10a.5** Type a message that's already correct and click ✨. It says *"Already looks good."*
- [ ] **10a.6** Type `/jobs` or 2 letters only. ✨ is disabled.
- [ ] **10a.7** Use ✨ until the 4th time. It says *"Daily limit reached (3 a day)…"* and the button is disabled.

### 10b. ✨ as owner (Akaza unlocked)

- [ ] **10b.1** Use ✨ 4+ times. No daily limit, and the tooltip shows no count.

### 10c. Tab suggestion

- [ ] **10c.1** Ask something that makes the AI ask back, e.g. *"write a cover letter for a frontend role"*.
- [ ] **10c.2** When the answer finishes and it **ends with a question**, grey ghost text appears in the empty input with a small **Tab** tag. The hint line says *"Tab to use the suggestion · Esc to dismiss"*.
- [ ] **10c.3** Press **Tab**. The suggestion fills the input (not sent yet).
- [ ] **10c.4** Clear it, then type the first few letters of the suggestion. The ghost continues after them. Press **→** at the end, and it fills.
- [ ] **10c.5** Type something different. The ghost disappears.
- [ ] **10c.6** Clear the input and press **Esc**. The suggestion is dismissed.
- [ ] **10c.7** Ask something whose answer **doesn't** end with a question. No ghost, and DevTools → Network shows no `suggest` request.
- [ ] **10c.8** The suggestion doesn't make up company names or details that weren't in the chat.
- [ ] **10c.9** DevTools → device toolbar (phone). The suggestion shows as a tappable chip above the input, and tapping fills it.

---

## 11. Cover letter collapses after applying ⤴

- [ ] **11.1** `/jobs` → **Cover letter** on a job → **Send now** → back in the chat, click **Mark as applied**.
- [ ] **11.2** The **whole exchange** folds into one card: your long "Write a concise cover letter…" request **and** the letter both disappear. What's left:
  - the header *"Cover letter · (company)"*
  - *"✓ Applied · (job title)"* / *"(company) · (date) · Gmail → (email)"*
  - **Show letter · Undo · ↑ Next job**
- [ ] **11.3** Click **↑ Next job**. The chat scrolls up to the job results, which flash briefly. The **Open** tab no longer shows that company.
- [ ] **11.4** Draft and apply to a second company the same way. Both letters end up as small cards.
- [ ] **11.5** Click **Show letter**. Both the **request** and the letter (with Send bar) are back, and the applied line has a **Collapse** link. Click it, and both fold again.
- [ ] **11.6** Click **Undo** on a card. It opens up as a normal, unsent letter with the Send bar.
- [ ] **11.7** On an unsent letter, click the **⌃ chevron** at the top right of the letter. The request and the letter fold into *"✉ Cover letter · … · not sent"*. Click it again (or **Show letter**) to open both.
- [ ] **11.8** Reload the page. Applied letters are still folded and unsent ones are open.
- [ ] **11.9** Folding doesn't delete anything: ask Akaza *"what did the last cover letter say?"* and it still knows.

---

## 12. Cover letter reads the real job description 📑

> Owner mode (Akaza unlocked). Each **new** letter uses 1 web fetch; redrafting the same job doesn't.

- [ ] **12.1** `/jobs` → **Cover letter** on a builtin.com or company-site job. While it waits, it says *"Reading the job description…"*.
- [ ] **12.2** Above the Send bar: *"✓ Based on the full job description · builtin.com"* (green).
- [ ] **12.3** Open the posting and compare. The letter mentions 2–3 **specific** things from the job description (what the company does, key responsibilities) and links them to your real experience.
- [ ] **12.4** The letter has **no made-up numbers** (no "%", no "by half") and claims no skill you don't have.
- [ ] **12.5** Draft the **same job** again. It starts faster, because the job description is cached for 24 h.
- [ ] **12.6** Try a **LinkedIn** job (or another site that needs sign-in). You get an orange *"⚠ Used the search summary only: the job page needs a sign-in…"*, and the letter still works.
- [ ] **12.7** As a visitor (locked), cover letters aren't available, so no job page is ever fetched for visitors.

---

## 13. Results CSV: Applied / Not applied for every job 📊

- [ ] **13.1** `/jobs`, then mark one job **applied** and one **Not a fit**.
- [ ] **13.2** Under the results, click **Download results (CSV)**. The file is named `akaza-jobs-<search>-<date>-<time>.csv`.
- [ ] **13.3** It has **every job** from the results (not only the open tab), in #number order.
- [ ] **13.4** The `status` column reads correctly for each one:

  | Job | Expected status | Also filled in |
  |---|---|---|
  | The one you marked applied | `Applied` | `applied_on`, `applied_via` |
  | Same role you applied to on another site | `Applied (same role)` | `applied_on` |
  | The one marked Not a fit | `Not a fit` | `not_a_fit_reason`, `note` |
  | A repost (Part 6b) | `Reposted` | `note`: "Applied to an earlier posting on…" |
  | Everything else | `Not applied` | — |

- [ ] **13.5** Mark **another** job applied and download again. You get a **new file** (new time), and that job now says `Applied`.
- [ ] **13.6** Open it in Excel / Google Sheets / LibreOffice. Columns line up and company names with commas stay in one cell.

---

## Results

| Part | Pass / Fail | Notes |
|---|---|---|
| 1 Access code eye | | |
| 2 Cover letter + resume | | |
| 3 Tabs and Mark applied | | |
| 4 Not a fit | | |
| 5 Next search | | |
| 6 Same role / repost / Apply anyway | | |
| 7 Ask Akaza | | |
| 8 CSV | | |
| 9 Sync | | |
| 10 ✨ Improve + Tab suggestion | | |
| 11 Cover letter collapses | | |
| 12 Cover letter reads the JD | | |
| 13 Results CSV with status | | |
