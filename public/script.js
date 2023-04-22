const form = document.querySelector("form");
console.log("script loaded");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  hideError();
  hideButton();
  const formData = new FormData(form);
  axios
    .post("/api/upload", formData, { headers: { Accept: "application/json" } })
    .then((res) => {
      if (res.data.filename) {
        //console.log(res.data.filename);
        showButton(res.data.filename);
      }
    })
    .catch((err) => {
      //console.log(err);
      showError(err);
    });
});

function showButton(filename) {
  const downloadButton = document.querySelector(".button");
  const buttondiv = document.querySelector("#buttondiv");
  buttondiv.classList.remove("hidden");
  buttondiv.classList.add("flex");
  downloadButton.href = `/download/${filename}`;
}

function hideButton() {
  const buttondiv = document.querySelector("#buttondiv");
  buttondiv.classList.remove("flex");
  buttondiv.classList.add("hidden");
}

const uploadbox = document.querySelector("#file-upload");
uploadbox.onchange = () => {
  if (uploadbox.files.length > 0) {
    const fileName = document.querySelector("#filename");
    fileName.textContent = "Uploaded file: " + uploadbox.files[0].name;
    const fileLabel = document.querySelector("#f-label");
    fileLabel.classList.remove("bg-cyan-100", "hover:bg-cyan-50", "border-cyan-400");
    fileLabel.classList.add("bg-emerald-100", "hover:bg-emerald-50", "border-emerald-400");
    let innerhtml = `<span class="font-semibold">File Uploaded</span>`;
    const prompt = document.querySelector("#upload-prompt");
    prompt.innerHTML = innerhtml;
  }
};

function hideError() {
  const errordiv = document.querySelector("#error");
  errordiv.classList.remove("flex");
  errordiv.classList.add("hidden");
}

function showError(error) {
  //console.log(error);
  const errordiv = document.querySelector("#error");
  const errortext = document.querySelector("#errortext");
  errortext.innerHTML = error.response.data.error;
  errordiv.classList.remove("hidden");
  errordiv.classList.add("flex");
}
