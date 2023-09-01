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

import * as argon2 from 'argon2-browser';
import { getConfig } from '../config'
import { byteToHex } from './byteToHex'

export interface ContextlessPasswordHash {
  hash: string
  salt: string
}

export async function hashPasswordWithSalt(key: string, salt: string): Promise<ContextlessPasswordHash> {
  const config = await getConfig()

  const iterations = config.argon2_iterations
  const hashType = argon2.ArgonType.Argon2id

  let { hash } = await argon2.hash({ pass: key, salt: salt, time: iterations, type: hashType });

  try {
    if (!salt || salt.length < 32) {
      throw new Error( "Salt is too short")
    }

    if (!hash) {
      throw new Error(`There is no hash generated`);
    }

    const passwordHash = {
      hash: byteToHex(hash),
      salt
    };

    return Promise.resolve(passwordHash);
  } catch (error) {
    const { message } = error
    return Promise.reject(message);
  }
}

export async function generateSaltAndHashPassword(key: string): Promise<ContextlessPasswordHash> {
  const salt = getSalt()
  return hashPasswordWithSalt(key, salt)
}

export function getSalt(): string {
  return byteToHex(window.crypto.getRandomValues(new Uint8Array(16)))
}
