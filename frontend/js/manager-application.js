const form = document.getElementById("applicationForm");
const fullLegalName = document.getElementById("fullLegalName");
const governmentIdNumber = document.getElementById("governmentIdNumber");
const referenceText = document.getElementById("referenceText");
const idImage = document.getElementById("idImage");
const formSuccess = document.getElementById("formSuccess");

const errors = {
  fullLegalName: document.getElementById("fullLegalNameError"),
  governmentIdNumber: document.getElementById("governmentIdNumberError"),
  referenceText: document.getElementById("referenceTextError"),
  idImage: document.getElementById("idImageError"),
};

const previewWrapper = document.getElementById("imagePreviewWrapper");
const previewImage = document.getElementById("imagePreview");

const setError = (field, message) => {
  errors[field].textContent = message;
  const input = document.getElementById(field);
  if (input) {
    input.classList.toggle("invalid", Boolean(message));
  }
};

const clearErrors = () => {
  setError("fullLegalName", "");
  setError("governmentIdNumber", "");
  setError("referenceText", "");
  setError("idImage", "");
};

const validateForm = () => {
  clearErrors();
  let isValid = true;

  if (!fullLegalName.value.trim()) {
    setError("fullLegalName", "Full legal name is required.");
    isValid = false;
  }

  if (!governmentIdNumber.value.trim()) {
    setError("governmentIdNumber", "Government ID number is required.");
    isValid = false;
  }

  if (!referenceText.value.trim()) {
    setError("referenceText", "Reference notes are required.");
    isValid = false;
  }

  const file = idImage.files[0];
  if (!file) {
    setError("idImage", "Please upload your government ID image.");
    isValid = false;
  } else if (!file.type.startsWith("image/")) {
    setError("idImage", "File must be an image.");
    isValid = false;
  }

  return isValid;
};

const showPreview = (file) => {
  if (!file || !file.type.startsWith("image/")) {
    previewWrapper.hidden = true;
    previewImage.removeAttribute("src");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewWrapper.hidden = false;
  };
  reader.readAsDataURL(file);
};

idImage.addEventListener("change", () => {
  formSuccess.textContent = "";
  const file = idImage.files[0];
  if (file && file.type.startsWith("image/")) {
    setError("idImage", "");
  }
  showPreview(file);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formSuccess.textContent = "";

  if (!validateForm()) {
    return;
  }

  const file = idImage.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const application = {
      id: `app_${Date.now()}`,
      userId: "demoUser_1",
      fullLegalName: fullLegalName.value.trim(),
      governmentIdNumber: governmentIdNumber.value.trim(),
      referenceText: referenceText.value.trim(),
      idImageDataUrl: reader.result,
      status: "pending",
      submittedAt: new Date().toISOString(),
      adminNotes: "",
    };

    localStorage.setItem("sm_application", JSON.stringify(application));
    formSuccess.textContent = "Application submitted. Redirecting...";

    setTimeout(() => {
      window.location.href = "/";
    }, 1200);
  };

  reader.readAsDataURL(file);
});
