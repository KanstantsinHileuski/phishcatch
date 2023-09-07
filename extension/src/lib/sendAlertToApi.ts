import {AlertContent} from "../types";

interface RequestOpt {
  method: string,
  headers: {[key:string]: string},
  body: string
}

export async function sendAlertToApi (alertData: AlertContent, apiUrl: string) {
  const requestData: RequestOpt = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY!
    },
    body: JSON.stringify(alertData),
  };

  try {
    const response = await fetch(apiUrl, requestData);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data: AlertContent = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
