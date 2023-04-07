const $ = document.querySelector.bind(document);
const select = $("select");
select.addEventListener("change", () => {
  if (select.value === "show hidden") {
    $("#parent_visibility_hidden").parentElement.style.visibility = "";
  } else {
    $("#parent_visibility_hidden").parentElement.style.visibility = "hidden";
  }
});
