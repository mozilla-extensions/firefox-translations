/* eslint-env node */

/**
 * Firefox UI testing helper functions
 */
module.exports.ui = {
  /**
   * From firefox/browser/components/extensions/ExtensionPopups.jsm
   *
   * @param {string} id Id to modify
   * @returns {string} widgetId canonical widget id with replaced bits.
   */
  makeWidgetId: id => {
    id = id.toLowerCase();
    return id.replace(/[^a-z0-9_-]/g, "_");
  },

  /**
   * The widget id is used to identify extension specific chrome elements. Examples:
   *  - Browser action - {extensionWidgetId}-browser-action
   *  - Page action - {extensionWidgetId}-page-action
   * Search for makeWidgetId(extension.id) in the Firefox source code for more examples.
   * @param extensionId The extension id
   * @returns {string} The widget id
   */
  extensionWidgetId: extensionId => {
    return module.exports.ui.makeWidgetId(extensionId);
  },
};
