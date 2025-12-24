
import { Product } from "../types";

/**
 * Uses Gemini to provide smart product recommendations based on search query.
 * For now, returns mock recommendations to avoid API key issues.
 */
export const getSmartSearchRecommendations = async (query: string, products: Product[]) => {
  try {
    // Mock implementation for demo purposes
    // In production, you would use the actual Gemini API with proper API key
    
    const mockRecommendations = [
      {
        productId: products[0]?.id || '1',
        reason: `Parfait pour "${query}" - très populaire et bien noté`
      },
      {
        productId: products[1]?.id || '2', 
        reason: `Correspond à votre recherche "${query}" - excellent rapport qualité-prix`
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockRecommendations;
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
};
