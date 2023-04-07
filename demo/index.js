const $ = document.querySelector.bind(document);
const select = $("select");
select.addEventListener("change", () => {
  console.log("hi");
  if (select.value === "show hidden") {
    $("#parent_visibility_hidden").parentElement.style.visibility = "";
  } else {
    $("#parent_visibility_hidden").parentElement.style.visibility = "hidden";
  }
});
