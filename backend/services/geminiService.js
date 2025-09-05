import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto'; // Node.js module for creating hashes

let model;
const apiKey = process.env.GEMINI_API_KEY;

// A simple in-memory cache to store scores for product data we've already seen.
const scoreCache = new Map();

// The prompt is now a constant for easier management.
const PROMPT_TEMPLATE = `
You are an expert sustainability analyst for an e-commerce platform. Based on the product details provided in the JSON input, calculate an "ecoScore" from 0 to 100 and estimate the "co2SavedKg" compared to a conventional alternative.

Rules:
1.  Analyze Holistically: Consider the product's name, category, description, and tags to infer its material, purpose, and potential environmental impact. A "bamboo toothbrush" in "Health" is highly positive. A "disposable plastic plate" is negative.
2.  Score Logic:
    - High scores (70-100) for reusable, biodegradable, or recycled/sustainable materials (bamboo, organic cotton, etc.).
    - Mid-range scores (40-69) for durable goods with a long lifespan (stainless steel pan, etc.).
    - Low scores (0-39) for single-use items or virgin plastics.
3.  CO₂ Estimation: Provide a rough estimate in kilograms. For non-eco-friendly products, this must be 0.
4.  Justification: Provide a brief, one-sentence justification.

Your response MUST be a valid JSON object matching the requested schema.
`;

// --- Initialization Block ---
if (!apiKey) {
  console.error("🔴 FATAL: GEMINI_API_KEY is not defined in your .env file.");
  console.warn("🟡 Eco-scoring service is disabled.");
} else {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // OPTIMIZATION: Configure the model to use JSON Mode for reliable output.
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        response_mime_type: "application/json",
      },
    });
    console.log("✅ Gemini Eco-Scoring Service Initialized Successfully in JSON Mode.");
  } catch (error) {
    console.error("🔴 FATAL: Failed to initialize Gemini AI Client.", error.message);
    console.warn("🟡 Eco-scoring service is disabled.");
  }
}

/**
 * Creates a unique hash from the core product details that affect its score.
 * This is used as a key for our cache.
 * @param {object} product - The Mongoose product document.
 * @returns {string} A unique hash string.
 */
function createProductHash(product) {
  const relevantData = JSON.stringify({
    name: product.productname,
    desc: product.productdescription,
    cat: product.category,
    subcat: product.subcategory,
    tags: product.tags,
    brand: product.specifications?.brand,
  });
  return crypto.createHash('sha256').update(relevantData).digest('hex');
}

/**
 * Gets eco-scores for a product, utilizing a cache to avoid redundant API calls.
 * @param {object} product - The Mongoose product document.
 * @returns {Promise<object|null>}
 */
async function getEcoScoresForProduct(product) {
  if (!model) {
    console.warn("Skipping eco-score check because the service is disabled.");
    return null;
  }

  const productHash = createProductHash(product);
  if (scoreCache.has(productHash)) {
    console.log(`✅ Cache hit for product "${product.productname}". Returning cached score.`);
    return scoreCache.get(productHash);
  }

  console.log(`➡️ Cache miss for "${product.productname}". Calling Gemini API...`);

  try {
    const productDetailsForPrompt = {
      productName: product.productname,
      category: `${product.category} > ${product.subcategory || ''}`,
      description: product.productdescription,
      tags: product.tags ? product.tags.join(', ') : 'None',
      specifications: `Brand: ${product.specifications?.brand || 'N/A'}, Model: ${product.specifications?.model || 'N/A'}`,
    };

    const result = await model.generateContent([PROMPT_TEMPLATE, JSON.stringify(productDetailsForPrompt)]);
    const response = result.response;
    const responseJson = JSON.parse(response.text());

    if (typeof responseJson.ecoScore !== 'number' || typeof responseJson.co2SavedKg !== 'number') {
        throw new Error("Received malformed JSON response from API.");
    }
    
    scoreCache.set(productHash, responseJson);
    return responseJson;

  } catch (error) {
    console.error("Error fetching eco-scores from Gemini API:", error.message);
    return null;
  }
}

export { getEcoScoresForProduct };