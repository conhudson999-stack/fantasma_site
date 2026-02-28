const fs = require("fs");
const path = require("path");
const https = require("https");

// Load .env from project root
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY not set. Add it to .env file.");
  process.exit(1);
}

// Models: "nano-banana-pro-preview" (paid), "gemini-2.5-flash-image" (free tier), "gemini-2.0-flash-exp-image-generation" (experimental)
const DEFAULT_MODEL = "gemini-2.5-flash-image";

function getEndpoint(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
}

async function generateImage(prompt, outputPath, options = {}) {
  const { aspectRatio = "1:1", imageSize = "2K", model = DEFAULT_MODEL } = options;
  const ENDPOINT = getEndpoint(model);

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio, imageSize },
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              reject(new Error(`API Error: ${json.error.message}`));
              return;
            }

            const parts = json.candidates?.[0]?.content?.parts || [];
            let textResponse = "";
            let imageFound = false;

            for (const part of parts) {
              if (part.text) {
                textResponse += part.text;
              }
              if (part.inlineData) {
                const ext =
                  part.inlineData.mimeType === "image/png" ? ".png" : ".jpg";
                const finalPath = outputPath.endsWith(ext)
                  ? outputPath
                  : outputPath + ext;

                // Ensure output directory exists
                const dir = path.dirname(finalPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                fs.writeFileSync(
                  finalPath,
                  Buffer.from(part.inlineData.data, "base64")
                );
                console.log(`Image saved: ${finalPath}`);
                imageFound = true;
              }
            }

            if (textResponse) console.log(`Model response: ${textResponse}`);
            if (!imageFound) console.log("Warning: No image was returned in the response.");

            resolve({ text: textResponse, imageSaved: imageFound });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// CLI usage: node generate-image.cjs "prompt" output-path [aspect-ratio] [image-size] [model]
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(
    "Usage: node generate-image.cjs <prompt> <output-path> [aspect-ratio] [image-size] [model]"
  );
  console.log('  aspect-ratio: "1:1", "16:9", "9:16", "4:3", "3:4" (default: "1:1")');
  console.log('  image-size:   "1K", "2K", "4K" (default: "2K")');
  console.log(`  model:        model ID (default: "${DEFAULT_MODEL}")`);
  console.log("");
  console.log(
    'Example: node generate-image.cjs "a ghost logo" ./public/images/logo.png "1:1" "2K"'
  );
  process.exit(0);
}

const [prompt, outputPath, aspectRatio, imageSize, model] = args;

generateImage(prompt, outputPath, {
  aspectRatio: aspectRatio || "1:1",
  imageSize: imageSize || "2K",
  model: model || DEFAULT_MODEL,
}).catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
