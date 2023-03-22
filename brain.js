let var1 = 1;
let var2 = '2';

chrome.storage.local.get('var1', function getData(data) {
  let testButton = document.getElementById('test-button');
  testButton.innerHTML = data.var1;
});

chrome.storage.local.get('var2', function getData(data) {
  let testButton2 = document.getElementById('test-button-2');
  testButton2.innerHTML = data.var2;
  for (let x = 0; x < 3; x++) {
    let button = document.createElement("button");
    button.innerHTML = x;
    button.id = x;
    button.addEventListener("click", function useSettings() {
      var2 += 1;
      chrome.storage.local.set({'var2': var2});
      document.getElementById('output').innerHTML = var2;
    });
    var addButtonsHere = document.getElementById("add-buttons-here");
    addButtonsHere.appendChild(button);
  }
});

chrome.storage.local.set(
  {
    'var1': var1,
    'var2' : var2
  }
);