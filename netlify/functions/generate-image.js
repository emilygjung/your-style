exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { topImg, bottomImg } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }

    // Step 1: Use GPT-4 Turbo with Vision to analyze the product images
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze these two fashion product images. Describe them in simple, clear terms focusing on: color, fabric/material appearance, style (casual/formal/etc), fit (loose/fitted/etc), and any distinctive features. Keep it very brief - just the essentials. Format: TOP: [description] BOTTOM: [description]"
              },
              {
                type: "image_url",
                image_url: {
                  url: topImg
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: bottomImg
                }
              }
            ]
          }
        ]
      })
    });

    const visionData = await visionResponse.json();
    
    if (!visionResponse.ok) {
      return {
        statusCode: visionResponse.status,
        body: JSON.stringify({ error: "Vision analysis failed", details: visionData })
      };
    }

    const description = visionData.choices[0].message.content;

    // Step 2: Use the description to generate a realistic mockup with DALL-E
    const dallePrompt = `Professional fashion photography of a woman wearing ${description}. Studio lighting, clean white background, full-body shot from head to feet, confident relaxed pose, warm skin tone, high-end fashion magazine editorial style. The outfit should look exactly as described.`;

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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
