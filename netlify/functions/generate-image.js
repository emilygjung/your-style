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

    // Step 1: Use GPT-4 Vision to analyze the product images
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe these two fashion products in one sentence each. Focus on: color, material, style. Format exactly: TOP: [one sentence]. BOTTOM: [one sentence]. Be specific about colors and fabrics."
              },
              {
                type: "image_url",
                image_url: { url: topImg, detail: "low" }
              },
              {
                type: "image_url",
                image_url: { url: bottomImg, detail: "low" }
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
        body: JSON.stringify({ error: "Vision analysis failed", details: visionData.error })
      };
    }

    const description = visionData.choices[0].message.content;

    // Step 2: Generate realistic mockup with DALL-E using the product descriptions
    const dallePrompt = `Professional fashion photography. Create a realistic image of a woman modeling an outfit: ${description}. Full body shot, studio lighting, white background, confident pose, editorial fashion magazine style. Show the exact products as described.`;

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
        size: "1024x1024",
        quality: "standard"
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
