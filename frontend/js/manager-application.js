const form = document.getElementById("applicationForm");
const fullLegalName = document.getElementById("fullLegalName");
const governmentIdNumber = document.getElementById("governmentIdNumber");
const referenceText = document.getElementById("referenceText");
const employmentProof = document.getElementById("employmentProof");
const governmentIdImage = document.getElementById("governmentIdImage");
const additionalDocuments = document.getElementById("additionalDocuments");
const formSuccess = document.getElementById("formSuccess");
const token = window.localStorage.getItem("token");

if (!window.managerAuth?.requireLogin() || !token) {
  if (formSuccess) {
    formSuccess.textContent = "Please log in to submit an application.";
  }
}

const errors = {
  fullLegalName: document.getElementById("fullLegalNameError"),
  governmentIdNumber: document.getElementById("governmentIdNumberError"),
  referenceText: document.getElementById("referenceTextError"),
  employmentProof: document.getElementById("employmentProofError"),
  governmentIdImage: document.getElementById("governmentIdImageError"),
  additionalDocuments: document.getElementById("additionalDocumentsError"),
};

const previewWrapper = document.getElementById("imagePreviewWrapper");
const previewImage = document.getElementById("imagePreview");
const isAllowedDoc = (file) =>
  file &&
  (file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

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
  setError("employmentProof", "");
  setError("governmentIdImage", "");
  setError("additionalDocuments", "");
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

  const proofFile = employmentProof.files[0];
  if (!proofFile) {
    setError("employmentProof", "Please upload proof of employment.");
    isValid = false;
  } else if (!isAllowedDoc(proofFile)) {
    setError("employmentProof", "File must be an image, PDF, or Word document.");
    isValid = false;
  }

  const idFile = governmentIdImage.files[0];
  if (!idFile) {
    setError("governmentIdImage", "Please upload your government ID image.");
    isValid = false;
  } else if (!idFile.type.startsWith("image/")) {
    setError("governmentIdImage", "File must be an image.");
    isValid = false;
  }

  const extraFiles = Array.from(additionalDocuments.files || []);
  const hasInvalid = extraFiles.some((file) => !isAllowedDoc(file));
  if (hasInvalid) {
    setError("additionalDocuments", "Additional documents must be images, PDFs, or Word files.");
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

employmentProof.addEventListener("change", () => {
  formSuccess.textContent = "";
  const file = employmentProof.files[0];
  if (file && isAllowedDoc(file)) {
    setError("employmentProof", "");
  }
});

governmentIdImage.addEventListener("change", () => {
  formSuccess.textContent = "";
  const file = governmentIdImage.files[0];
  if (file && file.type.startsWith("image/")) {
    setError("governmentIdImage", "");
  }
  showPreview(file);
});

additionalDocuments.addEventListener("change", () => {
  formSuccess.textContent = "";
  const extraFiles = Array.from(additionalDocuments.files || []);
  const hasInvalid = extraFiles.some((file) => !isAllowedDoc(file));
  setError("additionalDocuments", hasInvalid ? "Additional documents must be images, PDFs, or Word files." : "");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formSuccess.textContent = "";

  if (!validateForm()) {
    return;
  }

  const idFile = governmentIdImage.files[0];
  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const env = window.__ENV || {};
      const baseUrl = (env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

      const formData = new FormData();
      formData.append("fullName", fullLegalName.value.trim());
      formData.append("governmentIdNumber", governmentIdNumber.value.trim());
      formData.append("references", referenceText.value.trim());
      formData.append("employmentProof", employmentProof.files[0]);
      formData.append("governmentIdImage", governmentIdImage.files[0]);

      const extraFiles = Array.from(additionalDocuments.files || []);
      extraFiles.forEach((file) => formData.append("additionalDocuments", file));

      const response = await fetch(`${baseUrl}/sm-applications`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = (data && data.message) || response.statusText || "Submission failed.";
        throw new Error(message);
      }

      formSuccess.textContent = "Application submitted. Redirecting...";

      setTimeout(() => {
        window.location.href = "/manager-application-status";
      }, 1200);
    } catch (error) {
      formSuccess.textContent = error.message || "Submission failed.";
    }
  };

  reader.readAsDataURL(idFile);
});
