// this runs in the popup when you click on the extension icon

(async function () {
  const sharedJs = chrome.runtime.getURL("shared.js");
  const shared = await import(sharedJs);

  const defaultHostnames = shared.defaultHostnames;
  const defaultSubmitSelector = shared.defaultSubmitSelector;
  let progressBarTimer = null;

  let data = { ...shared.defaultData };

  const hostnamesElement = document.querySelector("#hostnames");
  const submitSelectorElement = document.querySelector("#submit_selector");
  const combosElement = document.querySelector("#combos");
  const submitCombosElement = document.querySelector("#submit_combos");
  const submitCombosLabelElement = document.querySelector(
    "#submit_combos_label"
  );
  const recordElement = document.querySelector("#record");
  const summaryElement = document.querySelector("#summary");

  initializeData();
  initializeEventsInsidePopupUI();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
    const tabHostnames = getHostnamesFromUrlListString(tabData[0].url);
    enableBasedOnHostnames(tabHostnames);
  });

  function initializeEventsInsidePopupUI() {
    hostnamesElement.addEventListener("keyup", () => {
      let hostnames =
        [hostnamesElement.value.replaceAll(" ", "")] || defaultHostnames;
      hostnames = getHostnamesFromUrlListString(hostnames.join(","));
      data.hostnames = hostnames;
      hostnamesElement.value = hostnames.join(",");
      shared.setData(data);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
        const tabHostnames = getHostnamesFromUrlListString(tabData[0].url);
        enableBasedOnHostnames(tabHostnames);
      });
    });
    hostnamesElement.addEventListener("change", () => {
      alert(
        "Manually refresh the page to let the Form Utility Belt start recording steps."
      );
    });
    submitSelectorElement.addEventListener("keyup", () => {
      const defaultSubmitSelector = "[type='submit']";
      data.submit_selector =
        submitSelectorElement.value || defaultSubmitSelector;
      shared.setData(data);
    });
    submitSelectorElement.addEventListener("change", () => {
      alert(
        "Manually refresh the page to let the Form Utility Belt start recording steps."
      );
    });
    combosElement.addEventListener("click", () => {
      let yes = true;
      if (!data.continueAutomation) {
        yes = confirm(
          `Do you still want to continue? 

WARNING:  This will automatically try all combinations of values for the elements on this page, and may continue running even if the page refreshes. 

To try to stop it while it's running, hit the "PAUSE trying all combinations" button. 

Do you still want to continue?`
        );
      }
      if (yes) {
        data.continueAutomation = !data.continueAutomation;
        if (data.continueAutomation) {
          combosElement.innerText = "PAUSE trying all combinations";
          combosElement.classList.add("on");
          data.showProgressBar = true;
          shared.setData(data, () => {
            combos();
          });
        } else {
          combosElement.innerText = "Try all combinations";
          combosElement.classList.remove("on");
          shared.setData(data, () => {
            stopCombos();
          });
        }
        shared.beep();
      }
    });
    submitCombosElement.addEventListener("change", () => {
      let yes = true;
      if (submitCombosElement.checked) {
        yes = confirm(`Do you still want to continue? 

WARNING:  This will automatically submit all combinations of values if you hit "Try all combinations". 

To try to stop it while it's running, hit the "PAUSE trying all combinations" button. 

Do you still want to continue?`);
      }
      if (yes) {
        data.submit_combos = submitCombosElement.checked;
        shared.setData(data);
        shared.beep();
      } else {
        submitCombosElement.checked = false;
      }
    });
    recordElement.addEventListener("keyup", (event) => {
      data.record = recordElement.innerText;
      shared.setData(data);
      if (event.key === "Enter" && data.record) {
        copyToClipboard(data.record, () => {
          alert(`Copied JS recording to clipboard.`);
          window.close();
          shared.beep();
        });
      }
    });
    recordElement.addEventListener("click", () => {
      if (data.record) {
        shared.beep();
        copyToClipboard(data.record, () => {
          alert(`Copied JS recording to clipboard.`);
          window.close();
        });
      }
    });
    summaryElement.addEventListener("keyup", (event) => {
      data.summary = summaryElement.innerText;
      shared.setData(data);
      if (event.key === "Enter" && data.summary) {
        shared.beep();
        copyToClipboard(data.summary, () => {
          alert(`Copied summary to clipboard.`);
          window.close();
        });
      }
    });
    summaryElement.addEventListener("click", () => {
      if (data.summary) {
        shared.beep();
        copyToClipboard(data.summary, () => {
          alert(`Copied summary to clipboard.`);
          window.close();
        });
      }
    });
  }

  function initializeData(callback) {
    shared.getData((updatedData) => {
      data = updatedData;
      hostnamesElement.value = data.hostnames.join(",") || defaultHostnames;
      submitSelectorElement.value = data.submit_selector;
      if (data.continueAutomation) {
        combosElement.innerText = "PAUSE trying all combinations";
        combosElement.classList.add("on");
      } else {
        combosElement.innerText = "Try all combinations";
        combosElement.classList.remove("on");
      }
      submitCombosElement.checked = data.submit_combos;
      stopProgressBar();
      if (data.showProgressBar) {
        updateProgressBar();
        startProgressBar();
      }
      recordElement.innerText = data.record;
      summaryElement.innerText = data.summary;
      if (callback) callback();
    });
  }

  /** param hostnames must be an array */
  function enableBasedOnHostnames(hostnames) {
    const disable = !shared.isAllowedHostname(hostnames, data.hostnames);
    submitSelectorElement.disabled = disable;
    combosElement.disabled = disable;
    submitCombosElement.disabled = disable;
    submitCombosLabelElement.setAttribute("disabled", disable);
    recordElement.disabled = disable;
    summaryElement.disabled = disable;
  }

  function getHostnamesFromUrlListString(urlString) {
    return urlString.split(",").map((url) => shared.getHostnameFromUrl(url));
  }

  function combos() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
      const activeTab = tabData[0];
      chrome.tabs
        .sendMessage(activeTab.id, {
          message: "combos",
        })
        .then(() => {
          startProgressBar();
        });
    });
  }

  function stopCombos() {
    stopProgressBar();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
      const activeTab = tabData[0];
      chrome.tabs
        .sendMessage(activeTab.id, {
          message: "stop-combos",
        })
        .then(() => {
          window.close();
        });
    });
  }

  function stopProgressBar() {
    clearInterval(progressBarTimer);
  }

  function startProgressBar() {
    progressBarTimer = setInterval(updateProgressBar, 1000);
  }

  function updateProgressBar() {
    shared.getData((updatedData) => {
      data = updatedData;
      const max = Number(data.comboCount || 0);
      const value = Number(data.comboAt || 0) + 1; // +1 because counts from 0
      const percent = Math.round((100 * value) / max);
      setCSSVariable("--progress", `${percent}%`, combosElement);
    });
  }

  /** original reference: https://github.com/hchiam/clipboard */
  function copyToClipboard(text, callback) {
    try {
      navigator.clipboard
        .writeText(text) // if not IE
        .catch(function (err) {
          alert(
            "Could not automatically copy to clipboard. \n\n Manually copy this text instead: \n\n" +
              text
          );
          console.log(err);
        });
      setTimeout(() => {
        if (callback) callback(text);
      }, 100);
    } catch (e) {
      try {
        var temp = document.createElement("textarea");
        document.body.append(temp);
        temp.value = text;
        temp.select();
        document.execCommand("copy");
        temp.remove();
        setTimeout(() => {
          if (callback) callback(text);
        }, 100);
      } catch (err) {
        alert(
          "Could not automatically copy to clipboard. \n\n Manually copy this text instead: \n\n" +
            text
        );
        console.log(err);
      }
    }
  }

  function setCSSVariable(name, value, element) {
    (element || document.querySelector(":root")).style.setProperty(name, value);
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "change-icon") {
      // try {
      //   chrome.action
      //     .setIcon({
      //       path: request.value,
      //     })
      //     .catch((e) => {
      //       console.log(e);
      //     });
      // } catch (e) {
      //   console.log(e);
      // }
    } else if (request.action === "stop-combos_content") {
      shared.beep();
      combosElement.innerText = "Try all combinations";
      combosElement.classList.remove("on");
      stopProgressBar();
    }
  });
})();
