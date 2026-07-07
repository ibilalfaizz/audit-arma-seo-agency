"use server";

export interface SubmitState {
  success: boolean;
  message?: string;
  data?: {
    website: string;
    email: string;
    ref: string | null;
    referrer_typed: string | null;
  };
}

export async function submitAudit(prevState: any, formData: FormData): Promise<SubmitState> {
  const website = formData.get("website")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const ref = formData.get("ref")?.toString().trim() || null;
  const referrer_typed = formData.get("referrer_typed")?.toString().trim() || null;

  // Validate inputs
  if (!website || !email) {
    return { success: false, message: "Website and email are required fields." };
  }

  // Telegram credentials from environment variables
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const apiBase = process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org";

  if (!token || !chatId || token.includes("YOUR_") || chatId.includes("YOUR_")) {
    console.error("Telegram API credentials are not configured in environment variables.");
    return { 
      success: false, 
      message: "Server configuration error: Telegram credentials are not configured. Please set them in .env.local."
    };
  }

  // HTML escape helper to prevent breaking Telegram parser
  const escapeHTML = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const safeWebsite = escapeHTML(website);
  const safeEmail = escapeHTML(email);
  const safeRef = ref ? escapeHTML(ref) : null;
  const safeReferrerTyped = referrer_typed ? escapeHTML(referrer_typed) : null;

  // Make sure the link has a protocol
  const websiteLink = safeWebsite.startsWith("http://") || safeWebsite.startsWith("https://") 
    ? safeWebsite 
    : `https://${safeWebsite}`;

  const messageText = [
    `📊 <b>New Free Local Growth Audit Request</b>\n`,
    `🌐 <b>Website:</b> <a href="${websiteLink}">${safeWebsite}</a>`,
    `📧 <b>Email:</b> <code>${safeEmail}</code>`,
    ...(safeRef ? [`🔗 <b>Referrer (URL Param):</b> <code>${safeRef}</code>`] : []),
    `✍️ <b>Referrer (Typed):</b> ${safeReferrerTyped ? `<code>${safeReferrerTyped}</code>` : "<i>None</i>"}`,
    `📅 <b>Submitted At:</b> <code>${new Date().toISOString()}</code>`
  ].join("\n");

  try {
    const telegramUrl = `${apiBase}/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram API Error:", result);
      return { 
        success: false, 
        message: `Telegram API Error: ${result.description || "Failed to send message."}` 
      };
    }

    return { 
      success: true, 
      data: {
        website,
        email,
        ref,
        referrer_typed,
      }
    };
  } catch (error: any) {
    console.error("Network Error during Telegram post:", error);
    return { 
      success: false, 
      message: `Network/Server Error: ${error.message || "Failed to contact Telegram API."}` 
    };
  }
}
