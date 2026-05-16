import { generateAIResponse } from "@/lib/ai/gemini";
import { resumeExtractionPrompt } from "@/lib/ai/prompts";
import { cleanAIResponse } from "@/lib/ai/parser";

export async function POST(req) {
  try {
    const body = await req.json();

    const { resumeText } = body;

    const prompt =
      resumeExtractionPrompt(resumeText);

    const aiResponse =
      await generateAIResponse(prompt);

    const parsedData =
      cleanAIResponse(aiResponse);

    return Response.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Resume extraction failed",
      },
      {
        status: 500,
      }
    );
  }
}