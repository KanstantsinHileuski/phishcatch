import { describe } from 'jest';
import { alert } from "../controllers/alert.js";

describe('API Server Test', () => {
  it('POST /alert with correct PSK should return alert success', async () => {
    const alertData = {
      allAssociatedUsernames: "bob",
      alertUrl: "https://www.example.com",
      psk: process.env.KEY,
      referrer: "https://www.google.com",
      alertType: "reuse",
      suspectedUsername: "testuser",
      suspectedHost: "testhost",
      alertTimestamp: Date.now(),
      clientId: "foo"
    };

    const response = await request(alert).post('/alert').send(alertData);
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('alert success');
  });


  it('POST /alert with incorrect PSK should return 400', async () => {
    const alertData = {
      allAssociatedUsernames: "bob",
      alertUrl: "https://www.example.com",
      psk: "wrong_psk",
      referrer: "https://www.google.com",
      alertType: "reuse",
      suspectedUsername: "testuser",
      suspectedHost: "testhost",
      alertTimestamp: Date.now(),
      clientId: "foo"
    };

    const response = await request(alert).post('/alert').send(alertData);
    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('Incorrect PSK');
  });
});

