// Copyright 2021 Palantir Technologies
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const notificationStorage: any = []

import { PageMessage } from './types'
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

  // void showCheckmarkIfEnterpriseDomain()
}

setup()
