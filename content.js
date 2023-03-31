// this runs on the current page

(async function () {
  const sharedJs = chrome.runtime.getURL("shared.js");
  const shared = await import(sharedJs);

  const defaultHostnames = shared.defaultHostnames;
  const defaultSubmitSelector = shared.defaultSubmitSelector;

  let data = { ...shared.defaultData };

  const recordPrefix = `const $=document.querySelector.bind(document);
async function sleep(ms){await new Promise(r=>setTimeout(r,ms||100));};`;
  const iifeStart = `;(async function(){\n`;
  const iifeStartRegex = `;\\(async function\\(\\)\\{\\n`;
  const iifeEnd = `\n})();`;
  const iifeEndRegex = `\\n\\}\\)\\(\\);`;
  $ = document.querySelector.bind(document);
  $$ = document.querySelectorAll.bind(document);
  async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms || 100));
  }

  setEverythingUp();

  function setEverythingUp() {
    shared.getData((updatedData) => {
      data = updatedData;
      if (hasAllowedHostname()) {
        reinitializeRecordUponFirstInteraction();
        if (data.continueAutomation) {
          continueAutomation();
        } else {
          record();
        }
      }
    });
  }

  function hasAllowedHostname() {
    return shared.isAllowedHostname(
      [shared.getHostnameFromUrl(location.hostname)],
      data.hostnames
    );
  }

  function reinitializeRecordUponFirstInteraction() {
    Array.from(document.querySelectorAll("*")).forEach((element) =>
      element.addEventListener("change", reinitializeRecord)
    );
  }

  function reinitializeRecord() {
    data.record = iifeStart + recordPrefix + iifeEnd;
    data.recordIndex = 0;
    data.summary = "";
    shared.setData(data);
    log("\n\nNew recording started.\n\n\n");
    Array.from(document.querySelectorAll("*")).forEach((element) =>
      element.removeEventListener("change", reinitializeRecord)
    );
  }

  function record() {
    Array.from(document.querySelectorAll("*")).forEach((element) =>
      element.addEventListener("change", handleChangesInAnyElement)
    );

    function handleChangesInAnyElement(event) {
      const isUserGenerated = event.isTrusted;
      if (!isUserGenerated) return;

      const wasTriggeredOnThisElement = event.target === this;
      if (!wasTriggeredOnThisElement) return;

      const element = this;

      const isHidden =
        element.style.visibility === "hidden" ||
        element.style.display === "none";
      if (isHidden) return;

      const tagName = element.tagName || element.getAttribute("tagName");

      const thisSelector =
        (tagName ? tagName : "") +
        (element.getAttribute("id") ? "#" + element.getAttribute("id") : "") +
        (element.getAttribute("class")
          ? "." + element.getAttribute("class").trim().split(" ").join(".")
          : "");

      let selector =
        Array.from(getParents(element))
          .map(
            (x) =>
              x.tagName +
              (x.id ? "#" + x.id : "") +
              (x.className.trim()
                ? "." +
                  x.className.trim().replace(/  +/g, " ").split(" ").join(".")
                : "") +
              (x.type ? `[type="${x.type}"]` : "")
          )
          .reverse()
          .join(">") +
        ">" +
        thisSelector;

      if (!selector) {
        log("Couldn't find selector for element:", element);
        return;
      }

      const index = getActiveOneOnly(selector, element);
      const value = element[dotValueForType(element.type)];
      const action = { selector, value };
      if (index !== undefined) action.index = index;

      data.recordIndex++;
      const actionCode = convertActionToCode(action, data.recordIndex);
      const actionSummary = `${thisSelector} = ${
        value === value.trim() && value !== "" ? value : `"${value}"`
      }\n`;

      data.record = data.record
        .replace(new RegExp("^" + iifeStartRegex), "")
        .replace(new RegExp(iifeEndRegex + "$"), "");
      data.record += data.record ? "\n" + actionCode : actionCode;
      data.record = iifeStart + data.record + iifeEnd;
      data.summary += actionSummary;
      shared.setData(data);
      log(actionSummary);
    }

    function getParents(el, parentSelectorStopAt) {
      if (parentSelectorStopAt === undefined) {
        parentSelectorStopAt = document.body;
      }

      const parents = [];
      let p = el.parentNode;

      while (p !== parentSelectorStopAt) {
        const o = p;
        parents.push(o);
        p = o.parentNode;
      }

      if (parentSelectorStopAt) parents.push(parentSelectorStopAt);
      return parents;
    }

    function getActiveOneOnly(selector, element) {
      let index = 0;

      const results = document.querySelectorAll(selector);
      const isUnique = results && results.length < 2;
      if (isUnique) return index;

      Array.from(results).filter((x, i) => {
        const isActiveElement = x === element;
        if (isActiveElement) {
          index = i;
        }
        return isActiveElement;
      });

      return index;
    }

    function convertActionToCode(action, recordIndex) {
      let type = action.selector?.match(/\[type="(.+)"\]/) || "";
      if (type) type = type[0];
      const setValue = dotValueForType(type) || "value";
      const selector = `${action.selector}${
        action.index ? "[" + (action.index + 1) + "]" : ""
      }`;
      const value = action.value.replace(/`/g, "\\`");
      return `await sleep();
var e${recordIndex}=$('${selector}');
e${recordIndex}?.click?.();if(e${recordIndex} && "${setValue}" in e${recordIndex})e${recordIndex}.${setValue}=\`${value}\`;e${recordIndex}?.dispatchEvent?.(new Event('change'));`;
    }
  }

  function log() {
    console.log("FORM UTILITY BELT: \n", ...arguments);
  }

  async function continueAutomation() {
    if (!data.continueAutomation || !hasAllowedHostname()) return;
    log("COMBOS: Continuing automation in 3 seconds.");
    await sleep(3000);
    if (!$(data.submit_selector)) {
      const message = `COMBOS: Could not find "${data.submit_selector}". Going back one page in 3 seconds.`;
      log(message);
      await sleep(3000);
      data.continueAutomation = false;
      shared.setData(data, () => {
        window.history.back();
      });
    } else {
      // TODO: handle continuing combos() automation where left off before auto-refresh page after each submit
      // TODO: handle stopping combos() automation if the user doesn't want to continue on refresh
    }
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    shared.getData((updatedData) => {
      data = updatedData;
      try {
        if (request.message === "combos") {
          combos();
        } else {
          stopAutomation();
        }
      } catch (error) {
        log(error);
        stopAutomation();
      }
    });
  });

  function stopAutomation() {
    data.continueAutomation = false;
    shared.setData(data);
    log("Trying to PAUSE combos automation.", new Date());
  }

  async function combos() {
    if (!data.continueAutomation) {
      stopAutomation();
      return;
    }

    log("STARTING combos automation.", new Date());
    let allInputs = getAllInputs();
    let currentlyAllowedValues = getAllCurrentlyAllowedValues(allInputs);
    let timer = setInterval(() => {
      shared.getData((updatedData) => {
        data = updatedData;
        if (!data.continueAutomation) {
          clearInterval(timer);
          stopAutomation();
        }
      });
    }, 1000);
    await recursivelyTryCombos(allInputs, currentlyAllowedValues);
    log("COMBOS: list of allInputs", allInputs);
    stopAutomation();
  }

  async function recursivelyTryCombos(inputs, values, index = 0) {
    await sleep();
    if (data.continueAutomation) {
      const input = inputs[index];
      let allowedVals = values[index];
      allowedVals = getUniqueValuesForRepeatSubmit(input, allowedVals, index);

      const isInputCurrentlyVisible = isVisible(input);
      if (!isInputCurrentlyVisible) {
        await recurse();
      } else {
        for (
          let v = 0;
          v < allowedVals.length && data.continueAutomation;
          v++
        ) {
          const value = allowedVals[v];
          const isInputCurrentlyVisible = isVisible(input);
          if (isInputCurrentlyVisible) {
            input[dotValueForType(input.type)] = value;
            await recurse();
          }
        }
      }

      async function recurse() {
        const canRecurse = index + 1 < inputs.length && data.continueAutomation;
        if (canRecurse) {
          await recursivelyTryCombos(inputs, values, index + 1);
        } else if (/* ready for submit input && */ data.continueAutomation) {
          if (!isVisible($(data.submit_selector))) {
            log(
              `COMBOS: ❌ Submit input isn't visible: ${data.submit_selector}`,
              $(data.submit_selector),
              inputs.map((element) => element[dotValueForType(element.type)])
            );
          } else if ($(data.submit_selector).disabled) {
            log(
              `COMBOS: ❌ Submit input is disabled: ${data.submit_selector}`,
              $(data.submit_selector),
              inputs.map((element) => element[dotValueForType(element.type)])
            );
          } else {
            log(
              `COMBOS: ✅ Can hit submit: ${data.submit_selector}`,
              inputs.map((element) => element[dotValueForType(element.type)])
            );
            if (data.submit_combos) {
              $(data.submit_selector).click();
            }
          }
        }
      }
    }
  }

  function getAllInputs() {
    const possibleFormInputs = `input:not([type="submit"]), select, textarea, button`;
    const submitInputElements = $$(
      data.submit_selector || defaultSubmitSelector
    );
    return [...$$(possibleFormInputs)].filter((element) => {
      const isNotSubmitInput = [...submitInputElements].every(
        (submitElement) => submitElement !== element
      );
      return /*isVisible(element) &&*/ isNotSubmitInput;
    });
  }

  function isVisible(element) {
    if (!element) return false;
    const computedStyles = getComputedStyle(element);
    return (
      computedStyles.visibility !== "hidden" &&
      computedStyles.display !== "none"
    );
  }

  function getAllCurrentlyAllowedValues(allInputs) {
    const currentlyAllowedValues = [];
    allInputs.forEach((element) => {
      const forSureAllowed = getAllAllowedValues(element);
      const fallbackValues =
        !forSureAllowed || !forSureAllowed.length
          ? getFallbackValues(element)
          : [];
      currentlyAllowedValues.push([...forSureAllowed, ...fallbackValues]);
    });
    return currentlyAllowedValues;
  }

  function getAllAllowedValues(formInputElement) {
    let allowedValues = [];
    // TODO: input could pull suggestions from a datalist
    if (formInputElement.tagName === "SELECT") {
      allowedValues = [...$("select").querySelectorAll("option")].map(
        (x) => x.value
      );
    }
    return allowedValues;
  }

  function dotValueForType(type) {
    switch (type) {
      case "checkbox":
      case "radio":
        return "checked";
      case "date":
        return "valueAsDate";
      case "submit":
        return "";
      default:
        return "value";
    }
  }

  function getFallbackValues(formInputElement) {
    if (
      formInputElement.tagName !== "INPUT" &&
      formInputElement.tagName !== "TEXTAREA"
    ) {
      return ["", "test"];
    }
    const now = new Date();
    const year = now.getFullYear();
    switch (formInputElement.type) {
      case "checkbox":
        return [false, true];
      case "color":
        return ["", "#ff0000"];
      case "date":
        return ["", now];
      case "datetime-local":
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return ["", now.toISOString().slice(0, 16)];
      case "email":
        return ["", "test@test.com"];
      case "file":
        return ["", "C:\\fakepath\\test.txt"];
      case "month":
        const month = String(now.getMonth()).padStart(2, "0");
        return ["", `${year}-${month}`];
      case "number":
        return ["", 1];
      case "password":
        return ["", "password"];
      case "radio":
        return [false, true];
      case "range":
        return [1];
      case "search":
        return ["", "test"];
      case "submit":
        return [""];
      case "tel":
        return ["", "2345678901"];
      case "text":
        return ["", "test"];
      case "time":
        return ["", now.toISOString().substring(11, 16)];
      case "url":
        return ["", "https://example.com"];
      case "week":
        const days = Math.floor((now - year) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((now.getDay() + 1 + days) / 7);
        return ["", `${year}-W${week}`];
      default:
        return ["", "test"];
    }
  }

  /** must return an array */
  function getUniqueValuesForRepeatSubmit(InputElement, defaultValues, index) {
    switch (InputElement.type) {
      case "checkbox":
      case "color":
      case "date":
      case "datetime-local":
        return defaultValues;
      case "email":
        return [`test${index}@test.com`];
      case "file":
      case "month":
      case "number":
      case "password":
      case "radio":
      case "range":
      case "search":
      case "submit":
      case "tel":
        return defaultValues;
      case "text":
        return [`test${index}`];
      case "time":
      case "url":
      case "week":
        return defaultValues;
      default:
        return defaultValues;
    }
  }
})();
