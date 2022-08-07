const form = document.querySelector("form");
console.log("script loaded");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  axios
    .post("/api/upload", formData)
    .then((res) => {
      if (res.data.filename) {
        console.log(res.data.filename);
        showButton(res.data.filename);
      } else {
        throw new Error("Error Generating Calendar file");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

function showButton(filename) {
  const downloadButton = document.querySelector(".button");
  downloadButton.classList.remove("hidden");
  downloadButton.href = `/download/${filename}`;
}
