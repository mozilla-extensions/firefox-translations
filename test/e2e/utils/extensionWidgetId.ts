/**
 * The widget id is used to identify extension specific chrome elements. Examples:
 *  - Browser action - {extensionWidgetId}-browser-action
 *  - Page action - {extensionWidgetId}-page-action
 * From firefox/browser/components/extensions/ExtensionPopups.jsm
 * Search for makeWidgetId(extension.id) in the Firefox source code for more examples.
 * @param extensionId The extension id
 * @returns {string} The widget id
 */
export const extensionWidgetId = extensionId => {
  return extensionId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
};
