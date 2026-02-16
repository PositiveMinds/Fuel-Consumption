/**
 * Netlify Function - Auth Proxy
 * Proxies authentication requests to Google Apps Script
 * Solves CORS issues by making server-to-server calls
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhsUwyjrA0vpiD6wqlQzXDfd2oyroCLVRmv89kTVzkgDZ2wZd1exG4ucrG-CvSsLVw/exec';

exports.handler = async (event, context) => {
  try {
    // Parse request body
    let payload = {};
    
    if (event.body) {
      // Parse URL-encoded form data or JSON
      try {
        payload = new URLSearchParams(event.body);
        // Convert URLSearchParams to object
        const obj = {};
        for (const [key, value] of payload) {
          obj[key] = value;
        }
        payload = obj;
      } catch (e) {
        payload = JSON.parse(event.body);
      }
    }

    // Forward request to Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(payload).toString()
    });

    const data = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: data
    };
  } catch (error) {
    console.error('Auth proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Proxy error: ' + error.message
      })
    };
  }
};
