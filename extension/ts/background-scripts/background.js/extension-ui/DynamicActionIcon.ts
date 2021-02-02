/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import {
  browser as crossBrowser,
  BrowserAction,
} from "webextension-polyfill-ts";
import SetBadgeTextColorDetailsType = BrowserAction.SetBadgeTextColorDetailsType;
import SetBadgeBackgroundColorDetailsType = BrowserAction.SetBadgeBackgroundColorDetailsType;
import SetBadgeTextDetailsType = BrowserAction.SetBadgeTextDetailsType;
import ColorValue = BrowserAction.ColorValue;
import { isChrome } from "../lib/isChrome";

const roundRect = (ctx, x, y, w, h, r) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  return ctx;
};

const drawBadge = (ctx, text, textColor, badgeBackgroundColor) => {
  const fontSize = Math.round(26);
  const lineHeight = fontSize * 1.1;
  ctx.font = `bold ${fontSize}px Helvetica Neue, Helvetica, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const textWidth = ctx.measureText(text).width;

  const padding = 4;
  const badgeWidth = textWidth + padding * 2 * 1.1;
  const badgeHeight = lineHeight + (padding * 2) / 1.1;

  const badgePosX = 48 - badgeWidth;
  const badgePosY = 0;

  ctx.fillStyle = badgeBackgroundColor;
  roundRect(ctx, badgePosX, badgePosY, badgeWidth, badgeHeight, 5).fill();
  ctx.fillStyle = textColor;
  ctx.fillText(text, badgePosX + padding, badgePosY + padding * 1.1);
};

export class DynamicActionIcon {
  private tabId: number;
  private ctx;
  private actionApi: BrowserAction.Static;
  private iconImg;
  private width: number;
  private height: number;
  private rotationCenterX: number;
  private rotationCenterY: number;
  private badgeText: string;
  private badgeTextColor: ColorValue = "#ffffff";
  private badgeBackgroundColor: ColorValue = "#000000";
  constructor(
    tabId: number,
    actionApi,
    width,
    height,
    rotationCenterX,
    rotationCenterY,
  ) {
    this.ctx = document.createElement("canvas").getContext("2d");
    this.actionApi = actionApi;
    this.width = width;
    this.height = height;
    this.rotationCenterX = rotationCenterX;
    this.rotationCenterY = rotationCenterY;
  }

  private clear() {
    // Store the current transformation matrix
    this.ctx.save();
    // Use the identity matrix while clearing the canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    // Restore the transform
    this.ctx.restore();
  }

  public setBadge(
    opts: { text: string; textColor: string; backgroundColor: string },
    tabId,
  ) {
    const { text, textColor, backgroundColor } = opts;
    this.badgeText = text;
    this.badgeTextColor = textColor;
    this.badgeBackgroundColor = backgroundColor;
    this.draw(tabId);
  }

  public drawBadge(
    opts: { text: string; textColor: string; backgroundColor: string },
    tabId,
  ) {
    this.setBadge(opts, tabId);
    this.draw(tabId);
  }

  private draw(tabId) {
    // Don't interrupt loading animation
    if (this.loadingIndicationIntervalId) {
      return;
    }
    const { badgeText, badgeTextColor, badgeBackgroundColor } = this;
    /*
    console.debug(
      "Drawing dynamic action icon",
      { tabId },
      {
        badgeText,
        badgeTextColor,
        badgeBackgroundColor,
      },
    );
     */
    this.clear();
    this.ctx.drawImage(this.iconImg, 0, 0);
    if (badgeText) {
      drawBadge(this.ctx, badgeText, badgeTextColor, badgeBackgroundColor);
    }
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.actionApi.setIcon({
      imageData: imageData,
      tabId,
    });
  }

  setIcon(opts: { path: string; tabId: number }): Promise<void> {
    return new Promise(resolve => {
      const { path, tabId } = opts;
      const img = new Image();
      img.onload = () => {
        this.iconImg = img;
        this.draw(tabId);
        resolve();
      };
      img.src = crossBrowser.runtime.getURL(path);
    });
  }

  setBadgeText(details: SetBadgeTextDetailsType) {
    const { text, tabId } = details;
    this.badgeText = text;
    this.draw(tabId);
  }

  setBadgeTextColor(details: SetBadgeTextColorDetailsType) {
    const { color, tabId } = details;
    this.badgeTextColor = color;
    this.draw(tabId);
  }

  setBadgeBackgroundColor(details: SetBadgeBackgroundColorDetailsType) {
    const { color, tabId } = details;
    this.badgeBackgroundColor = color;
    this.draw(tabId);
  }

  private loadingIndicationIntervalId: number;
  startLoadingIndication(tabId) {
    // Don't start if already ongoing
    if (this.loadingIndicationIntervalId) {
      return;
    }
    const start = Date.now();
    const loadingIndicatorTexts = "▉▊▋▌▍▎▏".split("").reverse();
    const statesPerDuration = loadingIndicatorTexts.length;
    const duration = 3000;
    this.loadingIndicationIntervalId = (setInterval(async () => {
      const durationFraction = ((Date.now() - start) / duration) % 1;
      const loadingIndicationTick = Math.floor(
        durationFraction * statesPerDuration,
      );
      const badgeText = loadingIndicatorTexts[loadingIndicationTick];
      if (!isChrome()) {
        await this.actionApi.setBadgeTextColor({
          color: "#ffffff",
          tabId,
        });
      }
      await this.actionApi.setBadgeBackgroundColor({
        color: "#B8CD10FF",
        tabId,
      });
      await this.actionApi.setBadgeText({
        text: badgeText,
        tabId,
      });
    }, 1000 / 10) as unknown) as number;
  }

  async stopLoadingIndication(tabId) {
    if (this.loadingIndicationIntervalId) {
      clearInterval(this.loadingIndicationIntervalId);
      delete this.loadingIndicationIntervalId;
      await this.actionApi.setBadgeText({
        text: "",
        tabId,
      });
    }
  }

  /*
  private rotationIntervalId: number;
  startRotation(tabId) {
    // Don't start if already ongoing
    if (!!this.rotationIntervalId) {
      return;
    }
    const { ctx, badgeText, badgeTextColor, badgeBackgroundColor, rotationCenterX, rotationCenterY, width, height } = this;
    const start = Date.now();
    const lines = 16;
    const cW = width;
    const cH = height;
    this.rotationIntervalId = (setInterval(async () => {
      const rotation =
        Math.floor(((Date.now() - start) / 1000) * lines) / lines;
      ctx.save();
      ctx.clearRect(0, 0, cW, cH);
      ctx.arc(24, 24, 10, 0, 2 * Math.PI);
      ctx.translate(rotationCenterX, rotationCenterY);
      ctx.rotate(Math.PI * 2 * rotation);
      ctx.translate(-rotationCenterX, -rotationCenterY);
      ctx.drawImage(this.iconImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, 48, 48);
      ctx.rotate(-Math.PI * 2 * rotation);
      if (badgeText) {
        drawBadge(ctx, badgeText, badgeTextColor, badgeBackgroundColor);
      }
      ctx.rotate(Math.PI * 2 * rotation);
      await this.actionApi.setIcon({
        imageData: imageData,
        tabId,
      });
      ctx.restore();
    }, 1000 / 15) as unknown) as number;
  }

  stopRotation(tabId) {
    if (!!this.rotationIntervalId) {
      clearInterval(this.rotationIntervalId);
      delete this.rotationIntervalId;
      this.draw(tabId);
    }
  }
  */
}
