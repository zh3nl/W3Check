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
  
  // PIN AI configuration (replace with actual service details)
  pinAi: {
    apiKey: process.env.PIN_AI_API_KEY || '',
    endpoint: process.env.PIN_AI_ENDPOINT || 'https://api.pinai.com/v1',
    imageAnalysisModel: 'pin-vision-v1',
  },
  
  // Novita AI configuration (replace with actual service details)
  novitaAi: {
    apiKey: process.env.NOVITA_AI_API_KEY || '',
    endpoint: process.env.NOVITA_AI_ENDPOINT || 'https://api.novita-ai.com/v1',
    accessibilityModel: 'novita-a11y-v2',
  },
  
  // Feature flags for AI integration
  features: {
    enhanceViolations: true,
    generateAltText: true,
    suggestAriaFixes: true,
    prioritizeIssues: true,
    useNovitaAi: process.env.USE_NOVITA_AI === 'true',
    usePinAi: process.env.USE_PIN_AI === 'true',
    
    // Fallback to pre-defined suggestions when API keys aren't available
    useFallbackSuggestions: true,
  }
};

/**
 * Check if an AI feature is enabled
 */
export function isFeatureEnabled(featureName: keyof typeof aiConfig.features): boolean {
  return aiConfig.features[featureName] === true;
}

/**
 * Check if specific AI service is configured with API key
 */
export function isServiceConfigured(serviceName: 'openai' | 'pinAi' | 'novitaAi'): boolean {
  return Boolean(aiConfig[serviceName].apiKey);
}

/**
 * Get configured model for a service
 */
export function getAiModel(service: 'openai' | 'pinAi' | 'novitaAi', modelType?: string): string {
  switch (service) {
    case 'openai':
      return modelType === 'vision' 
        ? aiConfig.openai.visionModel 
        : aiConfig.openai.defaultModel;
    case 'pinAi':
      return aiConfig.pinAi.imageAnalysisModel;
    case 'novitaAi':
      return aiConfig.novitaAi.accessibilityModel;
    default:
      return aiConfig.openai.defaultModel;
  }
} 