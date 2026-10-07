export default async function sendMail({ to, subject, html }) {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!key || !from) {
    console.log(`[mail skipped, BREVO_API_KEY or MAIL_FROM missing] to ${to}: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: process.env.MAIL_NAME || "Community Complaint & Services", email: from },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Brevo error:", res.status, text);
    throw new Error("We couldn't send the email right now, try again in a bit");
  }
}
