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
  currentFilename = filename;
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

// --- Google Calendar direct import ---
let currentFilename = null;
let tokenClient = null;

const clientIdMeta = document.querySelector('meta[name="google-client-id"]');
const GOOGLE_CLIENT_ID = clientIdMeta ? clientIdMeta.content : "";

function setGcalStatus(text) {
  const status = document.querySelector("#gcal-status");
  status.textContent = text;
  status.classList.remove("hidden");
}

function initTokenClient() {
  if (tokenClient || typeof google === "undefined" || !GOOGLE_CLIENT_ID) return;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/calendar.events",
    callback: "", // set dynamically before requesting a token
  });
}

async function insertEventsToGoogleCalendar(accessToken, events) {
  let successCount = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    let attempt = 0;
    let inserted = false;
    while (!inserted && attempt < 4) {
      try {
        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });
        if (res.status === 429 || res.status === 403) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
          continue;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error && body.error.message ? body.error.message : `Failed to create event ${i + 1}`);
        }
        inserted = true;
        successCount++;
      } catch (err) {
        attempt++;
        if (attempt >= 4) throw err;
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
    setGcalStatus(`Adding events to Google Calendar... (${i + 1}/${events.length})`);
  }
  return successCount;
}

async function handleGoogleCalendarImport() {
  hideError();
  if (!currentFilename) {
    return;
  }
  if (!GOOGLE_CLIENT_ID) {
    showError({ response: { data: { error: "Google Calendar integration is not configured." } } });
    return;
  }
  if (typeof google === "undefined") {
    showError({ response: { data: { error: "Google Identity Services failed to load." } } });
    return;
  }
  initTokenClient();

  setGcalStatus("Requesting Google Calendar permission...");

  tokenClient.callback = async (tokenResponse) => {
    if (tokenResponse.error) {
      showError({ response: { data: { error: "Google Calendar permission was denied." } } });
      return;
    }
    try {
      setGcalStatus("Fetching timetable events...");
      const { data } = await axios.get(`/api/events/${currentFilename}`);
      const events = data.events || [];
      if (events.length === 0) {
        showError({ response: { data: { error: "No events found to import." } } });
        return;
      }
      setGcalStatus(`Adding events to Google Calendar... (0/${events.length})`);
      const count = await insertEventsToGoogleCalendar(tokenResponse.access_token, events);
      setGcalStatus(`Successfully added ${count} event(s) to your Google Calendar.`);
    } catch (err) {
      showError({ response: { data: { error: err.message || "Failed to import events into Google Calendar." } } });
    }
  };

  tokenClient.requestAccessToken({ prompt: "consent" });
}

const googleCalendarButton = document.querySelector("#google-calendar-button");
googleCalendarButton.addEventListener("click", handleGoogleCalendarImport);
