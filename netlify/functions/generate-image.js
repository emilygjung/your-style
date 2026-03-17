exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { topName, bottomName } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }

    // Direct DALL-E call with product descriptions
    const dallePrompt = `Professional fashion photography. Woman modeling an outfit: ${topName} with ${bottomName}. Full body shot, studio lighting, white background, confident relaxed pose, editorial magazine style.`;

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const dalleData = await dalleResponse.json();

    if (!dalleResponse.ok) {
      console.error("DALL-E Error:", dalleData);
      return {
        statusCode: dalleResponse.status,
        body: JSON.stringify({ error: dalleData.error?.message || "Generation failed" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: dalleData.data[0].url })
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
