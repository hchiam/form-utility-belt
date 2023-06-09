// this runs in the popup when you click on the extension icon

(async function () {
  const sharedJs = chrome.runtime.getURL("shared.js");
  const shared = await import(sharedJs);

  const defaultHostnames = shared.defaultHostnames;
  const defaultSubmitSelector = shared.defaultSubmitSelector;
  const defaultIsRequiredSelector = shared.defaultIsRequiredSelector;
  let progressBarTimer = null;

  let data = { ...shared.defaultData };

  const hostnamesElement = document.querySelector("#hostnames");
  const getHostnameElement = document.querySelector("#get_hostname");
  const submitSelectorElement = document.querySelector("#submit_selector");
  const isRequiredSelectorElement = document.querySelector(
    "#is_required_selector"
  );
  const timeEstimateElement = document.querySelector("#time_estimate");
  const combosElement = document.querySelector("#combos");
  const submitCombosElement = document.querySelector("#submit_combos");
  const submitCombosLabelElement = document.querySelector(
    "#submit_combos_label"
  );
  const recordElement = document.querySelector("#record");
  const summaryElement = document.querySelector("#summary");

  initializeData();
  initializeEventsInsidePopupUI();
  enablePopupInputsBasedOnHostnames();
  setInterval(enablePopupInputsBasedOnHostnames, 1000);

  function initializeEventsInsidePopupUI() {
    hostnamesElement.addEventListener("keyup", () => {
      let hostnames =
        [hostnamesElement.value.replaceAll(" ", "")] || defaultHostnames;
      hostnames = getHostnamesFromUrlListString(hostnames.join(","));
      data.hostnames = hostnames;
      hostnamesElement.value = hostnames.join(",");
      shared.setData(data);
      enablePopupInputsBasedOnHostnames();
    });
    hostnamesElement.addEventListener("change", () => {
      if (hostnamesElement.value === "*") {
        alert(
          'WARNING: \n\nUsing hostname "*" will make Form Utility Belt record on any site. \n\nIf this is not what you want, change it to something else.'
        );
      }
      alert(
        "Manually refresh the page to let the Form Utility Belt start recording steps."
      );
    });
    hostnamesElement.addEventListener("mouseover", () => {
      getHostnameElement.classList.add("show");
    });
    hostnamesElement.addEventListener("focus", () => {
      getHostnameElement.classList.add("show");
    });
    getHostnameElement.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
        const tabHostnames = getHostnamesFromUrlListString(tabData[0].url);
        data.hostnames = tabHostnames;
        hostnamesElement.value = tabHostnames.join(",");
        hostnamesElement.dispatchEvent(new Event("keyup")); // trigger other updates
        shared.beep();
        alert(
          "Manually refresh the page to let the Form Utility Belt start recording steps."
        );
      });
    });
    submitSelectorElement.addEventListener("keyup", () => {
      data.submit_selector =
        submitSelectorElement.value || defaultSubmitSelector;
      shared.setData(data);
    });
    submitSelectorElement.addEventListener("change", () => {
      alert(
        "Manually refresh the page to let the Form Utility Belt start recording steps."
      );
    });
    isRequiredSelectorElement.addEventListener("keyup", () => {
      data.is_required_selector =
        isRequiredSelectorElement.value || defaultIsRequiredSelector;
      shared.setData(data);
    });
    isRequiredSelectorElement.addEventListener("change", () => {
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
          submitCombosElement.disabled = true;
          submitCombosLabelElement.setAttribute("disabled", true);
          data.showProgressBar = true;
          shared.setData(data, () => {
            combos();
          });
        } else {
          stopCombos(() => {
            alert("PAUSING trying all combinations.");
            shared.setData(data);
          });
          combosElement.innerText = "Try all combinations";
          combosElement.classList.remove("on");
          submitCombosElement.disabled = false;
          submitCombosLabelElement.setAttribute("disabled", false);
        }
        shared.beep();
      }
    });
    combosElement.addEventListener("mouseover", () => {
      submitCombosLabelElement.classList.add("show");
    });
    combosElement.addEventListener("focus", () => {
      submitCombosLabelElement.classList.add("show");
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
      submitSelectorElement.value =
        data.submit_selector || defaultSubmitSelector;
      isRequiredSelectorElement.value =
        data.is_required_selector || defaultIsRequiredSelector;
      if (data.continueAutomation) {
        combosElement.innerText = "PAUSE trying all combinations";
        combosElement.classList.add("on");
      } else {
        combosElement.innerText = "Try all combinations";
        combosElement.classList.remove("on");
      }
      submitCombosElement.checked = data.submit_combos;
      if (submitCombosElement.checked) {
        submitCombosLabelElement.classList.add("show");
      }
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

  function enablePopupInputsBasedOnHostnames() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
      const tabHostnames = getHostnamesFromUrlListString(tabData[0].url);
      const disable = !shared.isAllowedHostname(tabHostnames, data.hostnames);
      submitSelectorElement.disabled = disable;
      isRequiredSelectorElement.disabled = disable;
      combosElement.disabled = disable;
      submitCombosElement.disabled = disable;
      submitCombosLabelElement.setAttribute("disabled", disable);
      recordElement.disabled = disable;
      summaryElement.disabled = disable;
      if (data.continueAutomation) {
        submitCombosElement.disabled = true;
        submitCombosLabelElement.setAttribute("disabled", true);
      }
    });
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

  function stopCombos(callback) {
    stopProgressBar();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
      const activeTab = tabData[0];
      chrome.tabs
        .sendMessage(activeTab.id, {
          message: "stop-combos",
        })
        .then(() => {
          if (callback) callback();
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

      const submitDelayMs = 1000;
      const inputSleepMs = 100;
      const maxMsLeft =
        max * submitDelayMs + max * data.numberOfInputs * inputSleepMs;
      const msLeft =
        maxMsLeft -
        (value * submitDelayMs + value * data.numberOfInputs * inputSleepMs);
      const sLeft = msLeft / 1000;
      const mLeft = Math.round((sLeft / 60) * 10) / 10;
      const timeEstimate = `Less than ${mLeft} minutes remaining:`;
      timeEstimateElement.innerText =
        mLeft && !isNaN(mLeft) ? timeEstimate : "";
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
