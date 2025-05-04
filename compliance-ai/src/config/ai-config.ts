/**
 * AI services configuration for accessibility scanning
 */

// Default configurations with fallbacks for development
export const aiConfig = {
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4-turbo',
    visionModel: 'gpt-4-vision-preview',
    maxTokens: 500,
    temperature: 0.3, // Lower for more focused responses
  },
  
  novitaAi: {
    apiKey: process.env.NOVITA_AI_API_KEY || '',
    endpoint: process.env.NOVITA_AI_ENDPOINT || 'https://api.novita-ai.com/v1',
    accessibilityModel: 'novita-a11y-v2',
  },
  
  features: {
    enhanceViolations: true,
    generateAltText: true,
    suggestAriaFixes: true,
    prioritizeIssues: true,
    useNovitaAi: process.env.USE_NOVITA_AI === 'true',
    useFallbackSuggestions: true,
  }
};

export function isFeatureEnabled(featureName: keyof typeof aiConfig.features): boolean {
  return aiConfig.features[featureName] === true;
}

/**
 * Check if specific AI service is configured with API key
 */
export function isServiceConfigured(serviceName: 'openai' | 'novitaAi'): boolean {
  return Boolean(aiConfig[serviceName].apiKey);
}

/**
 * Get configured model for a service
 */
export function getAiModel(service: 'openai' | 'novitaAi', modelType?: string): string {
  switch (service) {
    case 'openai':
      return modelType === 'vision' 
        ? aiConfig.openai.visionModel 
        : aiConfig.openai.defaultModel;
    case 'novitaAi':
      return aiConfig.novitaAi.accessibilityModel;
    default:
      return aiConfig.openai.defaultModel;
  }
} 