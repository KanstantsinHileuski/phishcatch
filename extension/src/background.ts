import { PageMessage } from './types'

const notificationStorage: any = []

export function receiveMessage(message: PageMessage) {
  if(message.msgtype === 'notification') {
    const { opt, messageUrl } = message.content

    chrome.notifications.create(opt, (id: string) => {
      notificationStorage.push({id, opt, messageUrl})
    })

    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      const notificationData = notificationStorage.find((data: any) => data.id === notificationId);

      if (notificationData) {
        const alertIconUrl = chrome.runtime.getURL('icon.png')
        if (buttonIndex === 0) {
          const opt: chrome.notifications.NotificationOptions = {
            type: 'basic',
            title: 'PhishJail Alert',
            message: `Reporting false positive and removing matched password`,
            iconUrl: alertIconUrl,
            priority: 2,
            buttons: [{title: 'PhishJail Alert'}]
          }

          chrome.notifications.create(opt, () => {
            console.log("notification is created")
          })

          chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
            console.log(notificationData)
            chrome.tabs.sendMessage(tabs[0].id!, {notificationUrl: notificationData.messageUrl});
          });
        } else if (buttonIndex === 1) {
          const opt: chrome.notifications.NotificationOptions = {
            type: 'basic',
            title: 'PhishJail Alert',
            message: `Removing matched password`,
            iconUrl: alertIconUrl,
            priority: 2,
          }

          chrome.notifications.create(opt, () => {
            console.log("notification is created")
          })

          chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id!, {notificationUrl: notificationData.messageUrl});
          })
        }

        // void removeHash(notificationData.hash)
      }
    })
  }

  return message.content;
}

function setup() {
  chrome.runtime.onMessage.addListener(   (message, sender, sendResponse) => {
    let data = receiveMessage(message)
    sendResponse(data)
  });

  // @ts-ignore
  chrome.action.setBadgeBackgroundColor({ color: 'green' })
  chrome.tabs.onUpdated.addListener((tabID, change, tab) => {
    chrome.runtime.onMessage.addListener((message) => {
      if(message.setBadgeText) {
        // @ts-ignore
        chrome.action.setTitle({ title: '✅' })
      }else {
        // @ts-ignore
        chrome.action.setTitle({ title: ' ' })
      }
    })
  })
}

setup()
