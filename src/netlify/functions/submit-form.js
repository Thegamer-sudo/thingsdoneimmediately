// netlify/functions/submit-form.js
exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        success: false, 
        error: "Method not allowed. Use POST." 
      })
    };
  }

  try {
    // Parse the form data
    const data = JSON.parse(event.body);
    const { name, email, service, message } = data;

    // Validate required fields
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ 
          success: false, 
          error: "Name, email, and message are required." 
        })
      };
    }

    // Get credentials from environment variables
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Validate environment variables
    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing environment variables");
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ 
          success: false, 
          error: "Server configuration error." 
        })
      };
    }

    // Create formatted date/time for South Africa
    const now = new Date();
    const options = {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    };
    const formattedTime = now.toLocaleString("en-ZA", options);

    // Create the message for Telegram
    const telegramMessage = `
📬 *NEW CLIENT INQUIRY*
━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${name}
📧 *Email:* ${email}
🎯 *Service:* ${service || "Not specified"}
━━━━━━━━━━━━━━━━━━━━
📝 *Project Details:*
${message}
━━━━━━━━━━━━━━━━━━━━
⏰ *Time:* ${formattedTime}
📍 *Source:* thingsdoneimmediately.com
━━━━━━━━━━━━━━━━━━━━
📧 *Reply to client:* mailto:${email}
    `;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: telegramMessage,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ 
          success: false, 
          error: "Failed to send notification. Please try again." 
        })
      };
    }

    // Return success
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        message: "Message sent successfully! I'll contact you within 24 hours.",
      }),
    };

  } catch (error) {
    console.error("Server error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        success: false, 
        error: "Internal server error. Please try again later." 
      }),
    };
  }
};