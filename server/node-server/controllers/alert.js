import { logger } from '../logger.js';
const key = process.env.API_KEY;

function generateAlertMessage(alert, ip) {
  let message;
  switch (alert.alertType) {
    case "reuse":
      message = `A user with associated usernames ${alert.allAssociatedUsernames} reused their password on ${alert.alertUrl}!`;
      break;
    case "domhash":
      message = `${alert.alertUrl} triggered a dom hash alert for a user with associated usernames ${alert.allAssociatedUsernames}.`;
      break;
    case "userreport":
      message = `A user with associated usernames ${alert.allAssociatedUsernames} reported ${alert.alertUrl} as a phishing page.`;
      break;
    case "falsepositive":
      message = `A user with associated usernames ${alert.allAssociatedUsernames} reported a false positive alert on ${alert.alertUrl}.`;
      break;
    case "personalpassword":
      message = `A user with associated usernames ${alert.allAssociatedUsernames} reported that PhishCatch alerted on a personal password at ${alert.alertUrl}.`;
      break;
    default:
      message = `A user with associated usernames ${alert.allAssociatedUsernames} fired an unknown alert on ${alert.alertUrl}! Referrer: ${alert.referrer}. Is the server up to date?`;
  }

  if (alert.suspectedUsername && alert.suspectedHost) {
    message += ` Suspected account for this leak: ${alert.suspectedUsername} from ${alert.suspectedHost}.`;
  }
  message += ` Referrer: ${alert.referrer}. Timestamp: ${alert.alertTimestamp}. Client ID: ${alert.clientId}.`;
  message += ` Request IP: ${ip}`;

  return message;
}

export const alert = async (req, res, next) => {
  try {
    console.info("Received a credential reuse alert!", req.body.key, key )

    if (key && req.body.key !== key ) {
      console.log(`Alert did not include correct key! Correct key: ${key}. Provided key: ${req.body.key}`);
      return res.json({ status: "Incorrect Key" });
    }

    let alertMessage = generateAlertMessage(req.body, req.ip);

    try {
      logger.info(alertMessage);
      res.status(200).json({ status: "alert success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Couldn't send alert" });
    }
  } catch (err) {
    next(err);
  }
};