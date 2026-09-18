const titleElement = document.querySelector("div.text-title-large");
const descriptionElement = document.querySelector(
  '[data-track-load="description_content"]'
);

if (titleElement && descriptionElement) {
  const problemData = {
    title: titleElement.innerText,
    description: descriptionElement.innerText,
  };

  chrome.storage.local.set(
    { codesense_problem: problemData },
    () => {
      console.log("Problem saved:", problemData);
    }
  );
}