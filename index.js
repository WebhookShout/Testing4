async function generateImage(prompt) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt })
        }
    );

    if (!response.ok) throw new Error("Image generation failed");

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    document.body.innerHTML = `<img src="${url}" style="max-width:100%">`;
}

generateImage("a cute cat sitting on a chair, cartoon style");
