/**
 * CV Aligner Frontend JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('alignForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');

  const jdFileInput = document.getElementById('jobDescriptionFile');
  const jdFileName = document.getElementById('jdFileName');
  const jdTextarea = document.getElementById('jobDescriptionText');

  const cvFileInput = document.getElementById('cvFile');
  const cvFileName = document.getElementById('cvFileName');

  const resultSection = document.getElementById('resultSection');
  const successResult = document.getElementById('successResult');
  const errorResult = document.getElementById('errorResult');
  const candidateNameEl = document.getElementById('candidateName');
  const downloadLink = document.getElementById('downloadLink');
  const errorMessage = document.getElementById('errorMessage');

  // File input handlers
  jdFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      jdFileName.textContent = e.target.files[0].name;
      jdFileName.classList.add('selected');
      // Clear textarea when file is selected
      jdTextarea.value = '';
    } else {
      jdFileName.textContent = 'No file selected';
      jdFileName.classList.remove('selected');
    }
  });

  cvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      cvFileName.textContent = e.target.files[0].name;
      cvFileName.classList.add('selected');
    } else {
      cvFileName.textContent = 'No file selected';
      cvFileName.classList.remove('selected');
    }
  });

  // Clear file when textarea is used
  jdTextarea.addEventListener('input', () => {
    if (jdTextarea.value.trim() !== '') {
      jdFileInput.value = '';
      jdFileName.textContent = 'No file selected';
      jdFileName.classList.remove('selected');
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate inputs
    const hasJdFile = jdFileInput.files.length > 0;
    const hasJdText = jdTextarea.value.trim() !== '';
    const hasCvFile = cvFileInput.files.length > 0;

    if (!hasJdFile && !hasJdText) {
      showError('Please provide a job description (upload a file or paste text)');
      return;
    }

    if (!hasCvFile) {
      showError('Please upload a CV file');
      return;
    }

    // Show loading state
    setLoading(true);
    hideResults();

    try {
      const formData = new FormData();

      if (hasJdFile) {
        formData.append('jobDescription', jdFileInput.files[0]);
      } else {
        formData.append('jobDescriptionText', jdTextarea.value);
      }

      formData.append('cv', cvFileInput.files[0]);

      const response = await fetch('/api/align', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(data.candidateName, data.downloadUrl, data.filename);
      } else {
        showError(data.message || 'An error occurred during alignment');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoading.style.display = isLoading ? 'inline-flex' : 'none';
  }

  function hideResults() {
    resultSection.style.display = 'none';
    successResult.style.display = 'none';
    errorResult.style.display = 'none';
  }

  function showSuccess(name, downloadUrl, filename) {
    resultSection.style.display = 'block';
    successResult.style.display = 'block';
    errorResult.style.display = 'none';

    candidateNameEl.textContent = name;
    downloadLink.href = downloadUrl;
    downloadLink.download = filename;

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(message) {
    resultSection.style.display = 'block';
    successResult.style.display = 'none';
    errorResult.style.display = 'block';

    errorMessage.textContent = message;

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Reset form function (called from HTML)
  window.resetForm = function() {
    form.reset();
    jdFileName.textContent = 'No file selected';
    jdFileName.classList.remove('selected');
    cvFileName.textContent = 'No file selected';
    cvFileName.classList.remove('selected');
    hideResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});
