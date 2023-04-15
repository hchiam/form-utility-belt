const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const select = $("select");
const submit = $('input[type="submit"]');

select?.addEventListener("change", () => {
  const parent_visibility_hidden = $("#parent_visibility_hidden");
  if (!parent_visibility_hidden) return;
  if (select.value === "show hidden") {
    parent_visibility_hidden.parentElement.style.visibility = "";
  } else {
    parent_visibility_hidden.parentElement.style.visibility = "hidden";
  }
});

submit?.addEventListener("click", (e) => {
  const isRequired = [...$$('.isRequired:not([type="submit"])')];
  const visible = isRequired.filter((e) => isVisible(e));
  const filled = isRequired.filter((e) => {
    if (e?.type && e.type === "radio" && e.name) {
      return [...$$(`[name="${e.name}"]`)].some((x) => x.checked);
    } else {
      return e.value || e.checked || e.valueAsDate;
    }
  });
  if (visible.length !== filled.length) {
    e.preventDefault();
    alert("not all visible required are filled/valid.");
  }
});

$(".zipcode").addEventListener("change", function () {
  if (isNaN(this.value) || this.value.length !== 5) {
    submit.disabled = true;
  }
});
$("#zipcode").addEventListener("change", function () {
  if (isNaN(this.value) || this.value.length !== 5) {
    submit.disabled = true;
  }
});
$(".postalcode").addEventListener("change", function () {
  if (!/^\w\d\w ?\d\w\d$/i.test(this.value)) {
    submit.disabled = true;
  }
});
$("#postalcode").addEventListener("change", function () {
  if (!/^\w\d\w ?\d\w\d$/i.test(this.value)) {
    submit.disabled = true;
  }
});
$(".pobox").addEventListener("change", function () {
  if (isNaN(this.value) || this.value.length !== 5) {
    submit.disabled = true;
  }
});
$("#pobox").addEventListener("change", function () {
  if (isNaN(this.value) || this.value.length !== 5) {
    submit.disabled = true;
  }
});
$(".telephone").addEventListener("change", function () {
  if (!/^[\d -\.\)\(]+$/.test(this.value)) {
    submit.disabled = true;
  }
});
$("#telephone").addEventListener("change", function () {
  if (!/^[\d +-x\.\)\(]+$/.test(this.value)) {
    submit.disabled = true;
  }
});

function isVisible(element) {
  if (!element) return false;
  const computedStyles = getComputedStyle(element);
  return (
    computedStyles.visibility !== "hidden" &&
    computedStyles.display !== "none" &&
    !isAnyAncestorDisplayNone(element)
  );
}

function isAnyAncestorDisplayNone(element) {
  const hasParent = element?.parentElement;
  if (!hasParent) return false;

  const computedStyles = getComputedStyle(element.parentElement);
  return (
    computedStyles.display === "none" ||
    isAnyAncestorDisplayNone(element.parentElement)
  );
}
