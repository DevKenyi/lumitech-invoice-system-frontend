// "What's New" feed — append a new entry here with each user-visible release.
// Newest entry first. Keep bullets short and in plain language; this is read
// by business owners, not engineers, so skip internal/implementation detail.
//
// WhatsNewBell.jsx reads entries[0].date to decide whether to show the
// unread dot (compared against what's saved in localStorage).

const releaseNotes = [
  {
    date: "2026-11-14",
    title: "Subsidiaries",
    bullets: [
      "Running more than one business? Create daughter companies under your account, control what each one can do, and check in on their sales, expenses and POS activity without paying for a separate account per business.",
      "Assign your Moniepoint POS terminals to specific subsidiaries so each terminal's sales post straight to the right business's books.",
    ],
  },
  {
    date: "2026-11-04",
    title: "Movara sync",
    bullets: [
      "Marking a Food POS item sold-out (or an ingredient running out) now updates your Movara menu automatically — no more taking orders for things you can't make.",
    ],
  },
  {
    date: "2026-11-02",
    title: "WhatsApp improvements",
    bullets: [
      "WhatsApp invoice and payment notifications now send more reliably.",
      "Your plan includes a monthly WhatsApp message allowance — check Billing to see yours, and you'll get a heads-up if you're about to hit it.",
    ],
  },
  {
    date: "2026-10-27",
    title: "Automated payment reminders",
    bullets: [
      "Payment Followup can now automatically escalate overdue invoices through a reminder schedule you control, instead of chasing every one by hand.",
    ],
  },
  {
    date: "2026-10-18",
    title: "Food POS convenience fee controls",
    bullets: [
      "You can now set your own convenience fee rate and choose who pays it (you or the customer) for online and Movara orders.",
    ],
  },
  {
    date: "2026-10-17",
    title: "Safer order voids",
    bullets: [
      "Voiding a completed Food POS order now requires owner approval, so a mistaken or disputed order can't be erased unilaterally.",
    ],
  },
];

export default releaseNotes;
