import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

/**
 * Generate thumbnail image based on video title using AI
 */
export async function generateThumbnail(title: string): Promise<string> {
  const prompt = `Create a professional and attractive thumbnail image for a tutorial video titled "${title}". 
The image should be eye-catching, modern, and suitable for educational content. 
Include relevant icons or illustrations that represent the topic. 
Use a clean design with good contrast and readability.`;

  const { url: imageUrl } = await generateImage({ prompt });
  
  if (!imageUrl) {
    throw new Error("Failed to generate thumbnail image");
  }
  
  // Download and upload to S3 for permanent storage
  const response = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  
  const fileKey = `thumbnails/${nanoid()}.png`;
  const { url: permanentUrl } = await storagePut(fileKey, imageBuffer, "image/png");
  
  return permanentUrl;
}

/**
 * Suggest category for video based on title and description using LLM
 */
export async function suggestCategory(title: string, description?: string): Promise<string> {
  const videoContent = description ? `${title}\n\n${description}` : title;
  
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that categorizes tutorial videos. 
Based on the video title and description, suggest the most appropriate category from the following options:
- product_intro: Product usage introduction, feature demonstrations
- maintenance: Troubleshooting, repair guides, maintenance tutorials
- case_study: Real-world application cases, customer testimonials
- faq: Frequently asked questions, common issues
- other: Other types of content

Respond with ONLY the category key (e.g., "product_intro"), no explanation needed.`
      },
      {
        role: "user",
        content: `Video title: ${videoContent}`
      }
    ]
  });

  const responseContent = response.choices[0]?.message?.content;
  const suggestedCategory = typeof responseContent === 'string' ? responseContent.trim().toLowerCase() : null;
  
  // Validate the suggested category
  const validCategories = ['product_intro', 'maintenance', 'case_study', 'faq', 'other'];
  if (suggestedCategory && validCategories.includes(suggestedCategory)) {
    return suggestedCategory;
  }
  
  // Default to 'other' if invalid
  return 'other';
}
