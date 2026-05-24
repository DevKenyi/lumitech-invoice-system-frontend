import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// ── Documentation content ────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "getting-started",
    category: "Getting Started",
    emoji: "🚀",
    items: [
      {
        id: "registration",
        title: "Account Registration",
        summary: "Create a new LumiLedger account for your organisation.",
        steps: [
          "Go to the LumiLedger website and click Get Started or Register.",
          "Enter your full name, email address, phone number, and a secure password.",
          "Choose your business type: Business Owner or Accountant.",
          "Click Register — a verification email is sent to your address.",
          "Open the email and click Verify Email to activate your account.",
          "Log in with your credentials. You automatically start a 30-day free trial with full access.",
        ],
        tips: [
          "Use a business email address — it appears on all invoices and client communications.",
          "Your phone number is used for WhatsApp invoice delivery, so make sure it is correct.",
          "Passwords must be at least 8 characters. Use a mix of letters, numbers, and symbols.",
        ],
        image: "Registration form with business type selector",
      },
      {
        id: "login",
        title: "Logging In & Password Reset",
        summary: "Sign in to your LumiLedger account or recover a forgotten password.",
        steps: [
          "Go to /login and enter your username (or email) and password.",
          "Click Log In.",
          "If you forgot your password, click Forgot Password, enter your email, and check your inbox for the reset link.",
          "Click the link in the email and enter a new password.",
          "If you haven't verified your email, you will be prompted to resend the verification email from the login page.",
        ],
        tips: [
          "Your username is what you chose at registration — not always the same as your email.",
          "Password reset links expire after 1 hour. Request a new one if it has expired.",
        ],
        image: "Login page with username, password, and forgot password link",
      },
      {
        id: "dashboard",
        title: "Dashboard Overview",
        summary: "A real-time snapshot of your business performance.",
        content: `The dashboard is the first page you see after logging in. It shows:

• Total Revenue — sum of all paid invoices in the selected period.
• Outstanding — unpaid invoices that are not yet overdue.
• Overdue — invoices past their due date with no payment recorded.
• Recent Activity — the latest invoices created or updated.
• Quick Actions — shortcuts to create an invoice, add a client, or record an expense.

Use the date range filter (top right) to view figures for a specific month or custom period. All numbers update in real time as invoices are created, sent, and paid.`,
        tips: [
          "The dashboard counts the number of outstanding and overdue invoices — click either number to jump to the filtered invoice list.",
        ],
        image: "Dashboard with revenue cards, overdue count, and recent activity feed",
      },
    ],
  },
  {
    id: "invoicing",
    category: "Sales & Invoicing",
    emoji: "📄",
    items: [
      {
        id: "create-invoice",
        title: "Creating an Invoice",
        summary: "Generate a professional invoice and deliver it to your client.",
        steps: [
          "Click Create Invoice in the sidebar or click the + shortcut on the dashboard.",
          "Select an existing client from the dropdown, or type a new name to create one on the spot.",
          "Add line items: enter a description, quantity, unit price, discount (%), and tax rate for each item.",
          "Set the invoice date, payment due date, and currency.",
          "Add payment terms or a personal note to the client in the Notes field.",
          "Click Save as Draft to save without sending, or Send Invoice to deliver it immediately.",
        ],
        tips: [
          "You can add multiple line items — each line can have a different tax rate.",
          "Discounts can be applied at the line level or as an overall invoice discount.",
          "The PDF preview updates live as you type — scroll down to see exactly what the client will receive.",
          "Set a recurring schedule on the invoice to auto-generate it weekly, monthly, or quarterly.",
        ],
        image: "Create invoice form with line items, tax selector, and PDF preview panel",
      },
      {
        id: "send-invoice",
        title: "Sending an Invoice",
        summary: "Deliver invoices to clients via email, WhatsApp, or both.",
        steps: [
          "Open any invoice and click Send Invoice.",
          "Choose your delivery method: Email, WhatsApp, or both.",
          "For Email: the PDF is automatically attached. The client also receives a link to the client portal.",
          "For WhatsApp: the client receives a message with their invoice details and a portal link.",
          "Click Confirm Send — the invoice status changes to Sent.",
          "You can resend at any time from the invoice detail page.",
        ],
        tips: [
          "The client's email address must be saved on their profile for email delivery to work.",
          "The WhatsApp phone number must be in international format (e.g. +234 for Nigeria).",
          "Resending does not create a duplicate — it delivers the same invoice again.",
        ],
        image: "Send invoice modal with Email and WhatsApp toggle buttons",
      },
      {
        id: "invoice-statuses",
        title: "Invoice Statuses Explained",
        summary: "Understand what each invoice status means and when it changes.",
        content: `• Draft — saved but not yet sent to the client. Only visible to you.
• Sent — delivered to the client via email or WhatsApp.
• Viewed — the client has opened the client portal link at least once.
• Paid — a payment has been recorded against the invoice (fully or partially).
• Overdue — the due date has passed and the invoice is not fully paid.
• Cancelled — voided. The invoice is no longer active and does not affect reports.

Status changes happen automatically (e.g. Overdue when the date passes) or manually (e.g. marking as Paid after receiving payment).`,
        tips: [
          "Mark an invoice as Paid from the invoice detail page after you confirm payment in your bank.",
          "Partially paid invoices stay in Sent / Overdue status until fully paid.",
        ],
        image: "Invoice list with coloured status badges for each invoice",
      },
      {
        id: "recurring-invoices",
        title: "Recurring Invoices",
        summary: "Automatically generate and send invoices on a fixed schedule.",
        steps: [
          "Create or open an existing invoice.",
          "Enable the Recurring toggle near the top of the form.",
          "Choose the frequency: Weekly, Monthly, Quarterly, or Annually.",
          "Set a start date. Optionally set an end date or leave it open.",
          "Toggle Auto-Send if you want the invoice delivered automatically — or leave it off to review before sending.",
          "Save. The system generates and optionally sends the invoice on schedule.",
        ],
        tips: [
          "Recurring invoices appear under Sales & Invoicing → Recurring Invoices.",
          "You can pause, edit, or cancel a recurring schedule at any time without deleting the original invoice.",
          "Each generated invoice is independent — you can edit the details before the next one is sent.",
        ],
        image: "Recurring invoice setup with frequency selector and start/end dates",
      },
      {
        id: "proforma",
        title: "Proforma Invoices",
        summary: "Send a preliminary invoice before confirming the final sale.",
        steps: [
          "Go to Sales & Invoicing → Proforma Invoices.",
          "Click New Proforma and fill in the client, items, and amounts just like a regular invoice.",
          "Send the proforma to the client for their records or approval.",
          "Once confirmed, click Convert to Invoice to create a final tax invoice from the proforma.",
        ],
        tips: [
          "Proforma invoices do not affect your accounting or revenue reports — only the converted invoice does.",
          "Common use case: send a proforma to a client before they raise a purchase order.",
        ],
        image: "Proforma invoice form with Convert to Invoice button",
      },
      {
        id: "credit-notes",
        title: "Credit Notes",
        summary: "Issue a credit against an invoice — for returns, adjustments, or overpayments.",
        steps: [
          "Go to Sales & Invoicing → Credit Notes.",
          "Click New Credit Note and link it to the original invoice.",
          "Enter the amount to credit and a reason (e.g. returned goods, price correction).",
          "Save and send the credit note to the client.",
          "Apply the credit as an offset against a future invoice, or issue a refund.",
        ],
        image: "Credit note form with invoice link and reason field",
      },
      {
        id: "debit-notes",
        title: "Debit Notes",
        summary: "Request additional payment from a client after an invoice has been issued.",
        steps: [
          "Go to Sales & Invoicing → Debit Notes.",
          "Click New Debit Note, link the original invoice, and enter the extra amount.",
          "Save and send. The client receives an updated request.",
        ],
        image: "Debit note form linked to an existing invoice",
      },
      {
        id: "quotes",
        title: "Quotes & Estimates",
        summary: "Send a price quote to a client before converting it to an invoice.",
        steps: [
          "Go to Sales & Invoicing → Quotes.",
          "Create a quote with items and pricing.",
          "Send to the client — they can accept or discuss terms.",
          "Once accepted, click Convert to Invoice.",
        ],
        tips: [
          "Quotes have an expiry date — after it passes the quote is automatically marked Expired.",
          "Converting a quote does not delete the original quote.",
        ],
        image: "Quotes list with status badges and Convert to Invoice button",
      },
    ],
  },
  {
    id: "clients",
    category: "Clients",
    emoji: "👤",
    items: [
      {
        id: "add-client",
        title: "Adding & Managing Clients",
        summary: "Store client contact details for fast invoice creation.",
        steps: [
          "Go to Clients → Add Client.",
          "Enter the client's name, email address, phone number, billing address, and tax ID (TIN / VAT number).",
          "Save — the client is now available in the invoice and quote creation forms.",
          "To edit a client, click their name in the Clients list and update their details.",
        ],
        tips: [
          "Clients can also be created on the fly while creating an invoice — just type a new name in the client field.",
          "The TIN/VAT number appears on the invoice PDF for B2B compliance.",
          "Adding the client's logo or photo is optional but makes the client portal feel personalised.",
        ],
        image: "Add client form with name, email, phone, address, and TIN fields",
      },
      {
        id: "client-portal",
        title: "Client Portal",
        summary: "Your clients can view, download, and interact with invoices without creating an account.",
        content: `Every invoice has a unique, secure portal link. When you send an invoice, the client receives this link via email or WhatsApp.

What the client can do in the portal:
• View the full invoice with your logo and business details.
• Download the invoice as a PDF.
• See a payment history for partial payments.
• Flag an issue or dispute directly from the portal (you receive a notification).

The portal requires no login and works on any device. The link is valid as long as the invoice is active.`,
        tips: [
          "You can copy the portal link manually from the invoice detail page to share via other channels.",
          "If an invoice is cancelled, the portal link shows a notice that the invoice is no longer active.",
        ],
        image: "Client portal showing invoice details, PDF download, and dispute button",
      },
    ],
  },
  {
    id: "bills",
    category: "Bills & Purchases",
    emoji: "🧾",
    items: [
      {
        id: "bills",
        title: "Recording Bills",
        summary: "Track money owed to your suppliers.",
        steps: [
          "Go to Bills & Purchases → Bills.",
          "Click New Bill and select the supplier.",
          "Add line items, amounts, and the payment due date.",
          "Save — the bill appears in your payables.",
          "When you pay the bill, open it and click Mark as Paid.",
        ],
        tips: [
          "Bills automatically create accounting entries in your Chart of Accounts.",
          "Overdue bills are highlighted in red on the Bills list.",
        ],
        image: "Bills list with supplier name, amount, due date, and status",
      },
      {
        id: "suppliers",
        title: "Managing Suppliers",
        summary: "Keep a directory of your vendors and their contact details.",
        steps: [
          "Go to Bills & Purchases → Suppliers.",
          "Click Add Supplier and enter their name, email, phone, and bank details.",
          "Save — the supplier is available when creating bills and purchase orders.",
          "Click a supplier to see their full history of bills and purchase orders.",
        ],
        image: "Supplier list with name, contact info, and total payables",
      },
      {
        id: "purchase-orders",
        title: "Purchase Orders",
        summary: "Raise POs to suppliers and track their acceptance before receiving goods.",
        steps: [
          "Go to Bills & Purchases → Purchase Orders.",
          "Click New PO and select the supplier.",
          "Add items, quantities, and unit prices.",
          "Send the PO — the supplier receives it via email with a response link.",
          "The supplier can Accept, Decline, or Request Changes from the response page.",
          "If they request changes, edit the PO and resend from the PO detail page.",
          "Once accepted, click Convert to Bill to record the payable.",
        ],
        tips: [
          "A PO is not a payment — it is an agreement to purchase. Convert to Bill only when goods are received.",
        ],
        image: "Purchase order detail page with supplier response status and Convert to Bill button",
      },
    ],
  },
  {
    id: "accounting",
    category: "Accounting",
    emoji: "📊",
    items: [
      {
        id: "chart-of-accounts",
        title: "Chart of Accounts",
        summary: "The master list of all ledger accounts in your organisation.",
        content: `The Chart of Accounts (COA) is the foundation of your accounting system. Every financial transaction is recorded against an account.

Account types:
• Assets — things the business owns (cash, receivables, inventory, equipment).
• Liabilities — things the business owes (loans, payables, tax due).
• Equity — owner's capital and retained earnings.
• Income — revenue from sales, services, and other income.
• Expenses — costs incurred to run the business.

You can create custom accounts under each type. Invoices, bills, and expenses post to accounts automatically — manual entries are for adjustments only.`,
        tips: [
          "Do not delete accounts that have transactions against them — mark them inactive instead.",
          "Group related accounts using sub-accounts for cleaner reporting.",
        ],
        image: "Chart of Accounts list grouped by Assets, Liabilities, Equity, Income, Expenses",
      },
      {
        id: "journal-entries",
        title: "Journal Entries",
        summary: "Record manual debit/credit transactions.",
        steps: [
          "Go to Accounting → Journal Entries.",
          "Click New Entry.",
          "Add debit and credit lines — each line needs an account, description, and amount.",
          "The entry must balance: total debits must equal total credits.",
          "Enter the transaction date and a reference/memo, then save.",
        ],
        tips: [
          "Invoices and bills create journal entries automatically — manual entries are for corrections, accruals, or adjustments.",
          "Use the Description field on each line to explain what the entry represents.",
        ],
        image: "Journal entry form with debit/credit lines and running total balance indicator",
      },
      {
        id: "bank-reconciliation",
        title: "Bank Reconciliation",
        summary: "Match your bank statement to your journal entries to confirm the books are accurate.",
        steps: [
          "Go to Accounting → Reconciliation.",
          "Import your bank statement as a CSV file, or add transactions manually.",
          "The system shows each bank line alongside potential matching journal entries.",
          "Click Match to pair a bank transaction with a journal entry.",
          "Unmatched bank lines can create a new journal entry on the spot.",
          "Once all lines are matched, click Complete Reconciliation.",
        ],
        tips: [
          "Run a reconciliation at the end of every month to catch errors early.",
          "If a match is wrong, click Unmatch and re-pair it.",
        ],
        image: "Bank reconciliation screen with import button, statement lines, and match panel",
      },
      {
        id: "opening-balances",
        title: "Opening Balances",
        summary: "Set starting account balances when migrating from another system.",
        steps: [
          "Go to Accounting → Opening Balances.",
          "Select the opening date (typically the first day of your financial year or the day you start using LumiLedger).",
          "Enter the opening debit or credit balance for each account that has a historical balance.",
          "Save. The balances take effect from the opening date — all reports from that date will include them.",
        ],
        tips: [
          "Opening balances should be set once only when first setting up the system.",
          "Ask your accountant or bookkeeper for your trial balance figures to enter here.",
        ],
        image: "Opening balances form with account list, debit/credit columns, and opening date picker",
      },
      {
        id: "fixed-assets",
        title: "Fixed Assets",
        summary: "Track company assets and automatically calculate depreciation.",
        steps: [
          "Go to Accounting → Fixed Assets.",
          "Click Add Asset and enter the name, purchase date, cost, useful life (years), and depreciation method (straight-line or declining balance).",
          "Save. The system calculates monthly depreciation automatically.",
          "View the full depreciation schedule and current book value on the asset detail page.",
          "Dispose of an asset when it is sold or scrapped — the system posts the disposal entry.",
        ],
        image: "Fixed assets list with book value, depreciation schedule, and disposal button",
      },
      {
        id: "budget",
        title: "Budget vs Actual",
        summary: "Compare your planned budget against actual spend.",
        steps: [
          "Go to Accounting → Budget vs Actual.",
          "Set a budget amount for each expense or income account for the period.",
          "The report automatically pulls actual figures from your journal entries.",
          "View variance (actual minus budget) for each account — overspend is highlighted in red.",
        ],
        image: "Budget vs Actual report table with budget, actual, and variance columns",
      },
      {
        id: "payroll",
        title: "Payroll & PAYE",
        summary: "Calculate employee salaries and statutory deductions.",
        steps: [
          "Go to Accounting → Payroll.",
          "Add each employee with their salary, bank details, and PAYE tax information.",
          "Click Run Payroll for the current month.",
          "The system calculates gross pay, PAYE tax, pension contributions, and net pay for each employee.",
          "Review and approve the payroll run.",
          "Post to accounting — the system creates the journal entries automatically.",
          "Download the payslip for each employee.",
        ],
        tips: [
          "Approved expense claims from staff can be included in the payroll run.",
          "PAYE calculations follow the tax table for your country setting.",
        ],
        image: "Payroll run screen with employee list, gross/net pay, and PAYE breakdown",
      },
      {
        id: "account-ledger",
        title: "Account Ledger",
        summary: "See the full transaction history for any single account.",
        steps: [
          "Go to Accounting → Account Ledger.",
          "Select an account from the dropdown.",
          "All debits and credits posted to that account are listed with dates and running balance.",
          "Filter by date range to see a specific period.",
        ],
        image: "Account ledger for a selected account showing dated debit/credit entries and running balance",
      },
    ],
  },
  {
    id: "reports",
    category: "Reports",
    emoji: "📈",
    items: [
      {
        id: "trial-balance",
        title: "Trial Balance",
        summary: "Verify the books are in balance — total debits must equal total credits.",
        content: `The trial balance lists every account and its net debit or credit balance for the selected period.

If total debits = total credits, the books are balanced.
If they don't match, there is an unbalanced or missing journal entry — investigate and correct it before running other reports.

The trial balance is typically run at month-end or year-end.`,
        image: "Trial balance report with account list, debit totals, credit totals, and balance check",
      },
      {
        id: "profit-loss",
        title: "Profit & Loss (Income Statement)",
        summary: "See your total revenue, expenses, and net profit for any period.",
        content: `The P&L report shows:
• Income — all revenue earned in the period.
• Cost of Goods Sold (COGS) — direct costs of delivering the product or service.
• Gross Profit — Income minus COGS.
• Operating Expenses — salaries, rent, utilities, and other overhead.
• Net Profit — Gross Profit minus Operating Expenses.

Filter by date range and export to PDF for your accountant or board.`,
        image: "Profit & Loss statement with income, COGS, gross profit, expenses, and net profit sections",
      },
      {
        id: "balance-sheet",
        title: "Balance Sheet",
        summary: "A snapshot of your financial position — assets, liabilities, and equity at a point in time.",
        content: `The balance sheet shows:
• Assets — what the business owns (current assets + fixed assets).
• Liabilities — what the business owes (current liabilities + long-term debt).
• Equity — owner's investment and retained earnings.

Assets must always equal Liabilities + Equity. If they don't, check for unposted opening balances or missing entries.`,
        image: "Balance sheet with Assets, Liabilities, and Equity sections and totals",
      },
      {
        id: "cash-flow",
        title: "Cash Flow Statement",
        summary: "Track actual cash movements in and out of the business.",
        content: `The cash flow statement is divided into three activities:
• Operating — cash from core business operations (collections, payments to suppliers, salaries).
• Investing — cash used for or generated from assets (equipment purchases, asset sales).
• Financing — cash from loans, equity investment, or debt repayments.

Net Cash = Operating + Investing + Financing. A negative net cash means more cash left than came in.`,
        image: "Cash flow statement with three sections and net cash position",
      },
      {
        id: "cash-flow-forecast",
        title: "Cash Flow Forecast",
        summary: "Project your future cash position based on scheduled invoices and bills.",
        content: `The forecast shows expected cash inflows (from unpaid invoices) and outflows (from unpaid bills) over the coming weeks. Use it to identify potential cash gaps before they happen.`,
        image: "Cash flow forecast chart showing projected inflows and outflows over 12 weeks",
      },
      {
        id: "aging-report",
        title: "Aging Report",
        summary: "See which invoices are outstanding and how overdue they are.",
        content: `The aging report groups unpaid invoices by how long they have been outstanding:
• Current — not yet due.
• 1–30 days overdue.
• 31–60 days overdue.
• 61–90 days overdue.
• 90+ days overdue.

Use this report to prioritise follow-ups with clients who are most overdue.`,
        tips: [
          "The Follow-Up Board in LumiLedger is linked to the aging report — you can send a payment reminder directly from each overdue row.",
        ],
        image: "Aging report table grouped by overdue bucket with client name and outstanding amount",
      },
      {
        id: "tax-report",
        title: "Tax Report",
        summary: "Summarise VAT or sales tax collected and paid for a filing period.",
        content: `The tax report shows:
• Output Tax — VAT collected from clients on sales invoices.
• Input Tax — VAT paid to suppliers on bills.
• Net Tax Payable — Output Tax minus Input Tax. This is the amount due to the tax authority.

Export the report to use as supporting documentation when filing your VAT return.`,
        image: "Tax report with output tax, input tax, and net tax payable summary",
      },
      {
        id: "sales-report",
        title: "Sales Report",
        summary: "Analyse sales performance by product, client, or period.",
        steps: [
          "Go to Reports → Sales Report.",
          "Filter by date range, client, or product/service.",
          "View total sales, units sold, and revenue per item.",
          "Export to CSV or PDF for further analysis.",
        ],
        image: "Sales report with filters and bar chart of revenue by product",
      },
    ],
  },
  {
    id: "inventory",
    category: "Inventory & POS",
    emoji: "📦",
    items: [
      {
        id: "inventory",
        title: "Inventory Management",
        summary: "Track stock levels, costs, and movements.",
        steps: [
          "Go to Inventory.",
          "Click Add Product and enter the name, SKU, unit cost, selling price, and opening stock quantity.",
          "Save. The product is now available in the POS and on invoices.",
          "Stock levels update automatically when you record POS sales or receive goods via a bill.",
        ],
        tips: [
          "Low stock alerts can be set on each product to notify you when stock falls below a threshold.",
          "Run a stock valuation report to see the total value of your current inventory.",
        ],
        image: "Inventory list with product name, SKU, stock level, and unit cost",
      },
      {
        id: "pos",
        title: "Point of Sale (POS)",
        summary: "Process retail sales and update stock in real time.",
        steps: [
          "Go to POS.",
          "Search for a product by name or SKU and click it to add to the cart.",
          "Adjust quantity and apply any discount.",
          "Click Checkout, select the payment method, and process the sale.",
          "A receipt is generated and stock levels are reduced automatically.",
        ],
        tips: [
          "The POS works on tablets — use it at the counter with a touch screen.",
          "Cash and card payment methods are supported. Add custom payment methods in Settings.",
        ],
        image: "POS screen with product search, cart, total, and payment method selector",
      },
    ],
  },
  {
    id: "expenses",
    category: "Expenses",
    emoji: "💸",
    items: [
      {
        id: "record-expense",
        title: "Recording Expenses",
        summary: "Log business expenses and post them to the correct account.",
        steps: [
          "Go to Expenses.",
          "Click New Expense.",
          "Enter the amount, date, expense account (e.g. Travel, Office Supplies), and a description.",
          "Attach a receipt image if you have one.",
          "Save — the expense is posted to your accounting automatically.",
        ],
        tips: [
          "Expenses entered here appear in your Profit & Loss report under the relevant account.",
          "Attach receipt images to support audits and tax filings.",
        ],
        image: "Expense entry form with amount, account selector, date, and receipt upload",
      },
      {
        id: "claims",
        title: "Staff Expense Claims",
        summary: "Staff submit claims for reimbursement; managers approve or reject them.",
        steps: [
          "Staff go to Expenses and click Submit Claim.",
          "Enter the amount, description, and attach a receipt.",
          "The claim appears in the manager's queue under Expenses → Manage.",
          "The manager reviews and clicks Approve or Reject.",
          "Approved claims can be included in the next payroll run for reimbursement.",
        ],
        image: "Expense claims list with status badges and approve/reject buttons for managers",
      },
    ],
  },
  {
    id: "team",
    category: "Team Management",
    emoji: "👥",
    items: [
      {
        id: "add-team",
        title: "Inviting Team Members",
        summary: "Add employees, accountants, or collaborators to your organisation.",
        steps: [
          "Go to Settings → Team.",
          "Click Invite Member.",
          "Enter their email address and select their role.",
          "Click Send Invite — they receive an email with a link to join your organisation.",
          "Once they accept, they appear in your team list and can log in with their own credentials.",
        ],
        tips: [
          "Team members do not share your password — they create their own.",
          "You can deactivate a team member at any time without deleting their historical data.",
        ],
        image: "Team management page with member list, roles, and Invite Member button",
      },
      {
        id: "roles",
        title: "Roles & Permissions",
        summary: "Control what each team member can see and do.",
        content: `LumiLedger has five roles:

• Super Admin — full access to every feature including billing, team management, and audit logs.
• Admin — access to all business features. Cannot manage billing or view the super admin panel.
• Accountant — access to accounting, reports, invoices, and client data. Cannot manage team or billing.
• Staff — can only record and submit expense claims. Sees a simplified home screen.
• Staff (Expense Only) — same as Staff but limited exclusively to the expense claim flow.

Role restrictions are enforced server-side — they cannot be bypassed from the browser.`,
        tips: [
          "Give accountants the Accountant role — they can access reports and journals without changing settings.",
          "Use Admin for operations staff who need full invoice and client access but not billing control.",
        ],
        image: "Role selector dropdown showing all five roles with descriptions",
      },
      {
        id: "audit-log",
        title: "Audit Trail",
        summary: "A tamper-evident log of every action taken in your account.",
        content: `The Audit Trail records every create, update, delete, and login event — including who did it, when, and what changed.

Use it to:
• Investigate changes to invoices or client records.
• Confirm when an invoice was sent or viewed.
• Monitor team member activity.
• Provide evidence during a tax audit.`,
        tips: [
          "Audit logs cannot be edited or deleted — they are append-only for integrity.",
          "Filter by user or event type to find specific actions quickly.",
        ],
        image: "Audit log table with timestamp, user, action type, and changed record",
      },
    ],
  },
  {
    id: "settings",
    category: "Settings & Billing",
    emoji: "⚙️",
    items: [
      {
        id: "org-settings",
        title: "Organisation Settings",
        summary: "Configure your business details, logo, currency, and default tax rate.",
        steps: [
          "Go to Settings → Organisation.",
          "Upload your business logo (PNG or JPG, appears on all invoice PDFs).",
          "Set your registered business name, address, and registration number.",
          "Select your default currency and default VAT/tax rate.",
          "Set your payment terms (e.g. Net 30) — appears on every invoice by default.",
          "Save — all new invoices will use these settings immediately.",
        ],
        tips: [
          "The logo should be at least 200 × 200 px for best print quality on PDFs.",
          "You can override the default currency and tax rate on individual invoices.",
        ],
        image: "Organisation settings form with logo upload, currency selector, and VAT field",
      },
      {
        id: "billing-plans",
        title: "Billing & Subscription Plans",
        summary: "Choose and manage your LumiLedger subscription.",
        content: `LumiLedger includes a 30-day free trial with full access to all features. After the trial, choose a plan:

• Starter — for freelancers and micro businesses. Invoicing, clients, and basic reports.
• Growth — for growing businesses. Adds accounting, purchase orders, inventory, and team support.
• Pro — everything in Growth plus advanced reports, payroll, and fixed assets.
• Accountant Pro — for accounting firms managing multiple clients, with expense claims and audit tools.

To subscribe:
1. Go to Settings → Billing.
2. Choose your plan and click Subscribe.
3. You are redirected to a secure Paystack payment page.
4. Complete payment — your plan is upgraded immediately.

To cancel: go to Settings → Billing and click Cancel Subscription. You retain access until the end of the billing period.`,
        tips: [
          "Payment is processed monthly. No long-term contract — cancel anytime.",
          "Your data is never deleted, even if you cancel or your trial expires.",
          "Upgrading mid-cycle is prorated automatically.",
        ],
        image: "Billing page with plan cards, current plan badge, and Subscribe / Cancel buttons",
      },
      {
        id: "followup-board",
        title: "Follow-Up Board",
        summary: "Manage outstanding invoice follow-ups and payment reminders.",
        steps: [
          "Go to the Follow-Up Board from the Sales & Invoicing section.",
          "Overdue and unpaid invoices are listed by client.",
          "Click Send Reminder to email or WhatsApp the client a payment nudge.",
          "Mark a follow-up as done once the client has paid or responded.",
        ],
        tips: [
          "Use the Follow-Up Board after reviewing the Aging Report to prioritise who to contact first.",
        ],
        image: "Follow-up board with client cards, overdue days, and Send Reminder button",
      },
    ],
  },
];

// ── Helper components ─────────────────────────────────────────────────────────

function ImagePlaceholder({ label }) {
  return (
    <div className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center py-10 my-5 gap-2.5">
      <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-center px-4">📷 {label}</p>
    </div>
  );
}

function highlight(text, q) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Docs() {
  const [search, setSearch]           = useState("");
  const [expanded, setExpanded]       = useState({});
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const navigate = useNavigate();

  const q = search.toLowerCase().trim();

  const filtered = SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.summary || "").toLowerCase().includes(q) ||
      (item.content || "").toLowerCase().includes(q) ||
      (item.steps || []).some(s => s.toLowerCase().includes(q)) ||
      (item.tips  || []).some(t => t.toLowerCase().includes(q)) ||
      section.category.toLowerCase().includes(q)
    ),
  })).filter(s => s.items.length > 0);

  const totalResults = filtered.reduce((n, s) => n + s.items.length, 0);

  // When searching, auto-expand everything
  const isOpen = (id) => q ? true : !!expanded[id];
  const toggle = (id) => {
    if (q) return; // search keeps everything open
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileTocOpen(false);
  };

  // Close mobile TOC on route change
  useEffect(() => { setMobileTocOpen(false); }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="text-base font-bold tracking-tight shrink-0">
            Lumi<span className="text-blue-600">Ledger</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0 hidden sm:block">Docs</span>

          {/* Search */}
          <div className="flex-1 max-w-lg relative mx-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search documentation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 rounded-lg outline-none transition placeholder-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Back to app */}
          <button
            onClick={() => navigate(-1)}
            className="ml-auto shrink-0 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition hidden sm:block"
          >
            ← Back
          </button>

          {/* Mobile TOC toggle */}
          <button
            onClick={() => setMobileTocOpen(v => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            aria-label="Open table of contents"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">

        {/* ── Sidebar TOC ── */}
        <aside
          className={`
            fixed lg:sticky top-14 h-[calc(100vh-56px)] w-72 shrink-0 z-30
            bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
            overflow-y-auto transition-transform duration-200 ease-in-out
            ${mobileTocOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-4 pb-8">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-3">
              Contents
            </p>

            {filtered.length === 0 && (
              <p className="text-sm text-slate-400 px-2 py-4">No results for "{search}"</p>
            )}

            {filtered.map(section => (
              <div key={section.id} className="mb-5">
                <button
                  onClick={() => scrollTo(section.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                >
                  <span className="text-base shrink-0">{section.emoji}</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {section.category}
                  </span>
                </button>
                <ul className="ml-7 mt-1 space-y-0.5">
                  {section.items.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className="w-full text-left px-2 py-1 text-[13px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition truncate"
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {mobileTocOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setMobileTocOpen(false)}
          />
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 pb-24">

          {/* Hero — only when not searching */}
          {!q && (
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                LumiLedger Documentation
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl leading-relaxed">
                Everything you need to use LumiLedger confidently. Browse by section or search for any topic above.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition"
                  >
                    <span>{s.emoji}</span>
                    {s.category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results header */}
          {q && (
            <div className="mb-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">{totalResults}</strong> result{totalResults !== 1 ? "s" : ""} for{" "}
                <strong className="text-slate-800 dark:text-slate-200">"{search}"</strong>
              </p>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-slate-500 dark:text-slate-400">No documentation found for "{search}".</p>
              <button onClick={() => setSearch("")} className="mt-3 text-sm text-blue-600 hover:underline">
                Clear search
              </button>
            </div>
          )}

          {/* Sections */}
          {filtered.map(section => (
            <section key={section.id} id={section.id} className="mb-14 scroll-mt-20">

              {/* Section heading */}
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-2xl">{section.emoji}</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{section.category}</h2>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {section.items.map(item => {
                  const open = isOpen(item.id);
                  return (
                    <div
                      key={item.id}
                      id={item.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden scroll-mt-20"
                    >
                      {/* Item header */}
                      <button
                        onClick={() => toggle(item.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {highlight(item.title, search)}
                          </p>
                          {item.summary && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {highlight(item.summary, search)}
                            </p>
                          )}
                        </div>
                        <svg
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Item body */}
                      {open && (
                        <div className="px-5 py-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 space-y-5">

                          {/* Free-form content */}
                          {item.content && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3.5 border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                              {item.content}
                            </div>
                          )}

                          {/* Steps */}
                          {item.steps?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                Step-by-step
                              </p>
                              <ol className="space-y-2.5">
                                {item.steps.map((step, i) => (
                                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center">
                                      {i + 1}
                                    </span>
                                    <span className="leading-relaxed">{highlight(step, search)}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Tips */}
                          {item.tips?.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3.5">
                              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2.5">Tips</p>
                              <ul className="space-y-1.5">
                                {item.tips.map((tip, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                                    {highlight(tip, search)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Image placeholder */}
                          <ImagePlaceholder label={item.image} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Footer */}
          {!q && (
            <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Still need help?{" "}
                <a
                  href="mailto:support@lumitechsystems.com?subject=Support Request"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Contact support
                </a>{" "}
                and our team will get back to you within 24 hours.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
