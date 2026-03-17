exports.handler = async (event) => {
  console.log("Function called with body:", event.body);
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { outfitDescription } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log("API Key exists:", !!apiKey);
    console.log("Outfit description:", outfitDescription);

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OPENAI_API_KEY not set in environment" })
      };
    }

    const prompt = `Professional fashion photography: A woman wearing ${outfitDescription}. Studio lighting, white background, full body shot from thighs up, confident pose, warm skin tone, luxury fashion aesthetic.`;
    
    console.log("Prompt:", prompt);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await response.json();
    
    console.log("OpenAI response status:", response.status);
    console.log("OpenAI response:", data);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Generation failed" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.data[0].url })
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
