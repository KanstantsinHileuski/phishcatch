const axios = require('axios')

const baseURL = 'http://localhost:8080';
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.API_KEY
}
describe('API Server Test', () => {
  it('POST /alert with correct key should return alert success', async () => {
    const alertData = {
      allAssociatedUsernames: "bob",
      alertUrl: "https://www.example.com",
      key: process.env.API_KEY,
      referrer: "https://www.google.com",
      alertType: "reuse",
      suspectedUsername: "testuser",
      suspectedHost: "testhost",
      alertTimestamp: Date.now(),
      clientId: "foo"
    };

    const response = await axios.post(`${baseURL}/alert`, alertData, { headers });
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('Alert success');
  });


  it('POST /alert with incorrect key should return 400', async () => {
    const alertData = {
      allAssociatedUsernames: "bob",
      alertUrl: "https://www.example.com",
      key: "wrong_key",
      referrer: "https://www.google.com",
      alertType: "reuse",
      suspectedUsername: "testuser",
      suspectedHost: "testhost",
      alertTimestamp: Date.now(),
      clientId: "foo"
    };

    const response = await axios.post(`${baseURL}/alert`, alertData, {headers});
    expect(response.status).toBe(400);
    expect(response.data.status).toBe('Incorrect Key');
  });
});

