export async function onRequestPost(context) {
    const { request, env } = context;
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        return jsonResponse({ ok: false, error: "Telegram is not configured." }, 500);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ ok: false, error: "Invalid JSON." }, 400);
    }

    const linkName = cleanText(payload.linkName || "Link sem nome", 80);
    const page = cleanText(payload.page || "Pagina desconhecida", 220);
    const timestamp = cleanText(payload.timestamp || new Date().toISOString(), 60);

    const message = [
        "Novo clique no site!",
        "Botao: " + linkName,
        "Pagina: " + page,
        "Horario: " + timestamp
    ].join("\n");

    const telegramResponse = await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    });

    if (!telegramResponse.ok) {
        return jsonResponse({ ok: false, error: "Telegram request failed." }, 502);
    }

    return jsonResponse({ ok: true });
}

export function onRequest(context) {
    if (context.request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders()
        });
    }

    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
}

function cleanText(value, maxLength) {
    return String(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maxLength);
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
        }
    });
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
}
