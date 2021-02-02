/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const hasTextForTranslation = text => {
  const trimmed = text.trim();
  if (trimmed === "") {
    return false;
  }
  /* tslint:disable:no-empty-character-class */
  // https://github.com/buzinas/tslint-eslint-rules/issues/289
  return /\p{L}/gu.test(trimmed);
};
