/**
 * Returns true if browser supports HTML5 localStorage.
 */
function supportsHTML5Storage() {
  try {
    return "localStorage" in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Event handler for when a tab is clicked.
 */
function onClickTab(event) {
  const target = event.currentTarget;
  const language = target.dataset.lang;

  const initialTargetOffset = target.offsetTop;
  const initialScrollPosition = window.scrollY;
  switchAllTabs(language);

  // Keep initial perceived scroll position after resizing
  // that may happen due to activation of multiple tabs in the same page.
  const finalTargetOffset = target.offsetTop;
  window.scrollTo({
    top: initialScrollPosition + (finalTargetOffset - initialTargetOffset),
  });
}

/**
 * Switches the displayed tab for the given container.
 *
 * :param container: The div containing both the tab bar and the individual tabs
 * as direct children.
 * :param language: The language to switch to.
 */
function switchTab(container, language) {
  const previouslyActiveTab = container.querySelector(".tabcontents .active");
  previouslyActiveTab && previouslyActiveTab.classList.remove("active");
  const tab = container.querySelector(`.tabcontents [data-lang="${language}"]`);
  tab && tab.innerText && tab.classList.add("active");

  const previouslyActiveButton = container.querySelector(".tabbar .active");
  previouslyActiveButton && previouslyActiveButton.classList.remove("active");
  const button = container.querySelector(`.tabbar [data-lang="${language}"]`);
  button && tab.innerText && button.classList.add("active");
}

/**
 * Switches all tabs on the page to the given language.
 *
 * :param language: The language to switch to.
 */
function switchAllTabs(language) {
  const containers = document.getElementsByClassName("tabs");
  for (let i = 0; i < containers.length; ++i) {
    switchTab(containers[i], language);
  }

  if (supportsHTML5Storage()) {
    localStorage.setItem("glean-preferred-language", language);
  }
}

/**
 * Opens all tabs on the page to the given language on page load.
 */
(function openTabs() {
  if (!supportsHTML5Storage()) {
    return;
  }

  const containers = document.getElementsByClassName("tabs");
  for (let i = 0; i < containers.length; ++i) {
    // Create tabs for every language that has content
    const tabs = containers[i].children[0];
    const tabcontents = containers[i].children[1];
    for (const tabcontent of tabcontents.children) {
      const button = document.createElement("button");
      button.dataset.lang = tabcontent.dataset.lang;
      button.innerText = tabcontent.dataset.lang;
      button.classList.add("tablinks");
      if (!tabcontent.innerHTML) {
        button.classList.add("disabled");
        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip");

        if (tabcontent.dataset.bug) {
          tooltip.innerHTML += `${tabcontent.dataset.lang} does not provide this API yet. \nFollow <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=${tabcontent.dataset.bug}" target="_blank">Bug ${tabcontent.dataset.bug}</a> for updates.`;
        } else if (tabcontent.dataset.info) {
          // Note: it is safe to use .innerHTML since we have full control over `tabcontent.dataset.info`.
          tooltip.innerHTML += `${tabcontent.dataset.info}`;
        } else {
          tooltip.innerHTML += `${tabcontent.dataset.lang} does not provide this API.`;
        }
        button.appendChild(tooltip);
      } else {
        button.onclick = onClickTab;
      }
      tabs.appendChild(button);
    }
  }

  let language = localStorage.getItem("glean-preferred-language");
  if (language == null) {
    language = "Kotlin";
  }

  switchAllTabs(language);
})();
