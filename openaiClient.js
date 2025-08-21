const axios = require('axios');
const configuration = require('./config');

// Function to initialize an Azure OpenAI client
function initializeClient(model) {
  const apiKey = configuration.AZURE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('API key is missing from configuration.');
  }
  //o3-mini 2025-01-01
  //need to manually change the apiVersion if you change the model
  //todo: do this automatically based on the model name


  const clientConfig = {
    apiKey,
    apiVersion: '2024-02-15-preview',  // Using the preview version for GPT-4o access
    azureEndpoint: `https://spd-prod-openai-va-apim.azure-api.us/api/openai/deployments/${model}/chat/completions`  // VA-specific endpoint
  };
  return clientConfig;
}

// Function to query the LLM model
async function openaiClient(client, message) {

  const url = `${client.azureEndpoint}?api-version=${client.apiVersion}`;
  const body = {
    messages: [
      {
        role: 'user',
        content: message
      }
    ]
  };

  try {
    const response = await axios.post(
      url,
      body
      ,
      {
        headers: {
          'api-key': client.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    if (error.response) {
      if (error.response.status === 429) {
        console.error('Rate limit exceeded. Please try again later.');
      } else if (error.response.status === 404) {
        console.error('Resource not found (404). Check if the endpoint URL and model name are correct.');
      } else {
        console.error(`HTTP error (${error.response.status}): ${error.response.statusText}`);
      }
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}
module.exports = { openaiClient, initializeClient };
