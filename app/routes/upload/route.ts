export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const prompt = formData.get("prompt") as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-kontext-max",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/jpeg",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input_image: `data:${mimeType};base64,${base64Image}`,
          prompt: prompt || "",
          seed: -1,
          prompt_upsampling: false,
          safety_tolerance: 6,
        }),
      }
    );

    const result = await response.json();

    if (!result.request_id) {
      return new Response(
        JSON.stringify({ error: "Failed to submit request" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const resultEndpoint =
      "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-kontext-max/get_result";

    for (let attempts = 0; attempts < 60; attempts++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resultResponse = await fetch(resultEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/jpeg",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ id: result.request_id }),
      });

      if (resultResponse.ok) {
        const pollResult = await resultResponse.json();

        if (["Ready", "Complete", "Finished"].includes(pollResult.status)) {
          const imageData = pollResult.result?.sample;
          if (imageData) {
            if (typeof imageData === "string" && imageData.startsWith("http")) {
              const imageResponse = await fetch(imageData);
              const imageBuffer = await imageResponse.arrayBuffer();
              return new Response(imageBuffer, {
                headers: { "Content-Type": "image/jpeg" },
              });
            } else {
              const imageBuffer = Buffer.from(imageData, "base64");
              return new Response(imageBuffer, {
                headers: { "Content-Type": "image/jpeg" },
              });
            }
          }
        }

        if (["Failed", "Error"].includes(pollResult.status)) {
          return new Response(
            JSON.stringify({
              error: "Generation failed",
              details: pollResult.details,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ error: "Request timed out after 60 seconds" }),
      { status: 504, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
