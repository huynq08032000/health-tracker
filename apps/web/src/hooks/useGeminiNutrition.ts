import { GoogleGenerativeAI } from '@google/generative-ai';
import { useMutation } from '@tanstack/react-query';

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');
  return new GoogleGenerativeAI(apiKey);
};

export interface FoodNutritionEstimate {
  food_name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export function useGeminiNutrition() {
  return useMutation({
    mutationFn: async (foodName: string): Promise<FoodNutritionEstimate> => {
      const genAI = getClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

      const prompt = `Bạn là chuyên gia dinh dưỡng ẩm thực Việt Nam. 
Hãy ước lượng giá trị dinh dưỡng TRÊN MỖI 100g cho món ăn sau: "${foodName}".

Trả về DUY NHẤT JSON hợp lệ theo đúng schema sau, không có text giải thích thêm:
{
  "food_name": "${foodName}",
  "kcal_per_100g": số,
  "protein_per_100g": số,
  "carbs_per_100g": số,
  "fat_per_100g": số
}

Lưu ý: 
- Nếu không chắc chắn, hãy đưa ra ước lượng hợp lý dựa trên thành phố phổ biến.
- Không thêm markdown code block, chỉ raw JSON.`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không nhận được phản hồi hợp lệ từ AI');

        const parsed = JSON.parse(jsonMatch[0]);

        return {
          food_name: parsed.food_name || foodName,
          kcal_per_100g: Number(parsed.kcal_per_100g) || 0,
          protein_per_100g: Number(parsed.protein_per_100g) || 0,
          carbs_per_100g: Number(parsed.carbs_per_100g) || 0,
          fat_per_100g: Number(parsed.fat_per_100g) || 0,
        };
      } catch (err) {
        console.error('Gemini API error:', err);
        throw new Error(`Lỗi AI: ${(err as Error).message}`, { cause: err });
      }
    },
  });
}
