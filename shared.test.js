import { getHostnameFromUrl, isAllowedHostname } from "./shared.js";

let fails = 0;
test(getHostnameFromUrl("surge.sh"), "surge.sh");
test(getHostnameFromUrl("some.test.site"), "some.test.site");
test(getHostnameFromUrl("surge.sh") === "asdf", false);
test(getHostnameFromUrl("some.test.site/some/path"), "some.test.site");
test(getHostnameFromUrl("http://some.test.site"), "some.test.site");
test(getHostnameFromUrl("https://some.test.site"), "some.test.site");
test(isAllowedHostname(["surge.sh"], ["surge.sh"]), true);
test(
  isAllowedHostname(
    [getHostnameFromUrl("https://hchiam-example-prompts.surge.sh/")],
    ["surge.sh"]
  ),
  true
);
test(isAllowedHostname(["surge.sh"], []), false);
test(isAllowedHostname(["surge.sh"], ["test", "a", "b"]), false);
test(isAllowedHostname(["surge.sh"], ["test", "a", "b", "surge.sh"]), true);
test(isAllowedHostname(["surge.sh"], ["*"]), true);
test(isAllowedHostname(["surge.sh"], ["test", "a", "b", "*"]), true);
if (fails > 0) {
  console.log(`FAILED: ${fails} x ❌`);
} else {
  console.log("ALL PASSED! ✅");
}

function test(actual, expected) {
  const passed = actual === expected;
  console.log(passed ? "✅ passed" : "❌ FAILED");
  if (!passed) {
    fails++;
    console.log("    Actual:", actual);
    console.log("    Expected:", expected);
    console.log();
  }
}

// // jest doesn't seem to work with imports right now
// describe("test", () => {
//   it("works", () => {
//     expect(getHostnameFromUrl("surge.sh")).toBe("surge.sh");
//   });
// });
