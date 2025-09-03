import { GoogleGenAI, Modality } from "@google/genai";
import { YOLO_CLASSES } from '../constants';
import { ImageCategory } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


function parseAndConvertToYolo(responseText: string): string {
    try {
        // Extract JSON from markdown block if present
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        const jsonResponse = JSON.parse(jsonString);
        const labels = jsonResponse.labels || [];
        
        const yoloLabels = labels.map((item: any) => {
            const classIndex = YOLO_CLASSES.indexOf(item.className);
            if (classIndex === -1) return null;

            const { xMin, yMin, xMax, yMax } = item.box2d;
            // Basic validation for coordinates
            if ([xMin, yMin, xMax, yMax].some(coord => typeof coord !== 'number' || coord < 0.0 || coord > 1.0)) {
                console.warn("Invalid bounding box coordinates received:", item.box2d);
                return null;
            }
            if (xMin >= xMax || yMin >= yMax) {
                console.warn("Invalid bounding box dimensions:", item.box2d);
                return null;
            }

            const x_center = (xMin + xMax) / 2;
            const y_center = (yMin + yMax) / 2;
            const width = xMax - xMin;
            const height = yMax - yMin;

            return `${classIndex} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
        }).filter(Boolean);

        return yoloLabels.join('\n');

    } catch (e) {
        console.error("Failed to parse labels or convert to YOLO format", e, "Raw text:", responseText);
        return ""; // Return empty string if parsing fails
    }
}


export async function generateImage(base64ImageData: string, mimeType: string, prompt: string, category: ImageCategory): Promise<{ imageUrl: string; label: string }> {
    let faceClass = '';
    let categoryDescription = '';

    switch (category) {
        case ImageCategory.Yawning:
            faceClass = 'yawning_face';
            categoryDescription = 'yawning';
            break;
        case ImageCategory.Anxious:
            faceClass = 'anxious_face';
            categoryDescription = 'anxious or frowning';
            break;
        case ImageCategory.Focused:
            faceClass = 'focused_face';
            categoryDescription = 'focused';
            break;
        case ImageCategory.HoldingPhone:
            // No specific face class, but we detect phone and hand
            categoryDescription = 'holding a phone';
            break;
    }

    const contextInstruction = faceClass
        ? `The person in the image you generate is ${categoryDescription}. When labeling the face, you MUST use the class '${faceClass}'.`
        : `The person in the image you generate is ${categoryDescription}.`;
        
    const labelPrompt = `After generating the image, you MUST also perform object detection on the image you just created.
${contextInstruction}
The available detection classes are: ${YOLO_CLASSES.join(', ')}.

Your object detection instructions are:
1. Bounding Boxes MUST be tight: The bounding box for each object (face, hand, phone) must be snug and tightly wrapped around the object with minimal empty space. For faces, the box should tightly frame the facial features. For hands, it should tightly enclose the entire hand and fingers.
2. Correct Face Class: If a face is detected, use the class name that corresponds to the person's expression as instructed above.
3. Detect all relevant objects from the class list.

Provide your object detection output as a JSON object inside a markdown code block (\`\`\`json). The JSON object should contain a single key "labels", which is an array of objects. Each object in the array must have two keys:
- "className": A string matching one of the available classes.
- "box2d": An object with the keys "xMin", "yMin", "xMax", "yMax" representing the normalized (0.0 to 1.0) bounding box coordinates.
If no objects are found, return an empty "labels" array.`;

    const combinedPrompt = `${prompt}\n\n${labelPrompt}`;

    // Generate the image and labels in one call
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: combinedPrompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);

    if (!imagePart || !imagePart.inlineData) {
        console.error("Image generation failed. Full response:", JSON.stringify(response, null, 2));
        throw new Error("AI did not generate an image. This might be due to a safety policy violation or an API issue.");
    }
    
    const generatedBase64 = imagePart.inlineData.data;
    const imageUrl = `data:image/png;base64,${generatedBase64}`;

    // Parse labels from the text part
    const label = textPart?.text ? parseAndConvertToYolo(textPart.text) : "";
    
    return { imageUrl, label };
}
