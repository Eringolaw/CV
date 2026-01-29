/**
 * CV Aligner Frontend JavaScript
 * Handles form submission, API calls, and client-side DOCX generation
 */

// Store the aligned CV data for download
let alignedCVData = null;

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
  const downloadBtn = document.getElementById('downloadBtn');
  const errorMessage = document.getElementById('errorMessage');

  // File input handlers
  jdFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      jdFileName.textContent = e.target.files[0].name;
      jdFileName.classList.add('selected');
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

  jdTextarea.addEventListener('input', () => {
    if (jdTextarea.value.trim() !== '') {
      jdFileInput.value = '';
      jdFileName.textContent = 'No file selected';
      jdFileName.classList.remove('selected');
    }
  });

  // Download button handler
  downloadBtn.addEventListener('click', () => {
    if (alignedCVData) {
      generateAndDownloadDocx(alignedCVData);
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

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
        alignedCVData = data.alignedCV;
        showSuccess(data.candidateName);
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

  function showSuccess(name) {
    resultSection.style.display = 'block';
    successResult.style.display = 'block';
    errorResult.style.display = 'none';
    candidateNameEl.textContent = name;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(message) {
    resultSection.style.display = 'block';
    successResult.style.display = 'none';
    errorResult.style.display = 'block';
    errorMessage.textContent = message;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.resetForm = function() {
    form.reset();
    alignedCVData = null;
    jdFileName.textContent = 'No file selected';
    jdFileName.classList.remove('selected');
    cvFileName.textContent = 'No file selected';
    cvFileName.classList.remove('selected');
    hideResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

/**
 * Generate and download a DOCX file from the aligned CV data
 */
async function generateAndDownloadDocx(cvData) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = docx;

  // Colors
  const NOVIAM_BLUE = '004796';
  const MID_BLUE = '006BFF';
  const DARK_GREY = '626366';

  // Helper functions
  function createSectionHeading(text) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          font: 'Calibri',
          size: 22,
          color: NOVIAM_BLUE
        })
      ],
      spacing: { before: 300, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE }
      }
    });
  }

  function createJobHeader(role, company, location, dates) {
    return new Paragraph({
      children: [
        new TextRun({ text: role, bold: true, font: 'Calibri', size: 20, color: MID_BLUE }),
        new TextRun({ text: ' | ', font: 'Calibri', size: 20, color: MID_BLUE }),
        new TextRun({ text: `${company}, ${location}`, font: 'Calibri', size: 20, color: MID_BLUE }),
        new TextRun({ text: ' | ', font: 'Calibri', size: 20, color: MID_BLUE }),
        new TextRun({ text: dates, italics: true, font: 'Calibri', size: 20, color: MID_BLUE })
      ],
      spacing: { before: 200, after: 60 }
    });
  }

  function createBullet(text) {
    return new Paragraph({
      children: [
        new TextRun({ text: '• ' + text, font: 'Calibri', size: 20 })
      ],
      spacing: { before: 40, after: 40 },
      indent: { left: 720 }
    });
  }

  // Build document children
  const children = [];

  // Name
  children.push(new Paragraph({
    children: [
      new TextRun({
        text: cvData.name,
        bold: true,
        font: 'Calibri',
        size: 40,
        color: DARK_GREY
      })
    ],
    spacing: { before: 200, after: 300 }
  }));

  // Professional Summary
  children.push(createSectionHeading('Professional Summary'));
  children.push(new Paragraph({
    children: [new TextRun({ text: cvData.professionalSummary, font: 'Calibri', size: 20 })],
    spacing: { before: 80, after: 120 }
  }));

  // Core Competencies
  if (cvData.coreCompetencies?.length) {
    children.push(createSectionHeading('Core Competencies'));
    children.push(new Paragraph({
      children: [new TextRun({ text: cvData.coreCompetencies.join(' • '), font: 'Calibri', size: 20 })],
      spacing: { before: 80, after: 120 }
    }));
  }

  // Professional Experience
  if (cvData.professionalExperience?.length) {
    children.push(createSectionHeading('Professional Experience'));
    for (const job of cvData.professionalExperience) {
      children.push(createJobHeader(job.role, job.company, job.location, job.dates));
      for (const achievement of job.achievements || []) {
        children.push(createBullet(achievement));
      }
    }
  }

  // Education
  if (cvData.education?.length) {
    children.push(createSectionHeading('Education & Certification'));
    for (const edu of cvData.education) {
      children.push(new Paragraph({
        children: [new TextRun({ text: edu.degree, bold: true, font: 'Calibri', size: 20, color: MID_BLUE })],
        spacing: { before: 120, after: 40 }
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${edu.institution}, ${edu.location} | ${edu.date}`, font: 'Calibri', size: 20, color: DARK_GREY })],
        spacing: { before: 0, after: 40 }
      }));
      if (edu.details) {
        children.push(new Paragraph({
          children: [new TextRun({ text: edu.details, font: 'Calibri', size: 20 })],
          spacing: { before: 0, after: 80 }
        }));
      }
    }
  }

  // Certifications
  if (cvData.certifications?.length) {
    for (const cert of cvData.certifications) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: cert.name, bold: true, font: 'Calibri', size: 20, color: DARK_GREY }),
          cert.details ? new TextRun({ text: ' | ' + cert.details, font: 'Calibri', size: 20, color: DARK_GREY }) : null
        ].filter(Boolean),
        spacing: { before: 120, after: 80 }
      }));
    }
  }

  // Leadership
  if (cvData.leadership?.length) {
    children.push(createSectionHeading('Leadership'));
    for (const lead of cvData.leadership) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: lead.role, bold: true, font: 'Calibri', size: 20, color: MID_BLUE }),
          new TextRun({ text: ` | ${lead.organization} | ${lead.dates}`, font: 'Calibri', size: 20, color: MID_BLUE })
        ],
        spacing: { before: 120, after: 60 }
      }));
      for (const achievement of lead.achievements || []) {
        children.push(createBullet(achievement));
      }
    }
  }

  // Technical Skills
  if (cvData.technicalSkills) {
    children.push(createSectionHeading('Technical Skills & Languages'));
    if (cvData.technicalSkills.technical) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Technical: ', bold: true, font: 'Calibri', size: 20, color: DARK_GREY }),
          new TextRun({ text: cvData.technicalSkills.technical, font: 'Calibri', size: 20 })
        ],
        spacing: { before: 80, after: 40 }
      }));
    }
    if (cvData.technicalSkills.languages) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Languages: ', bold: true, font: 'Calibri', size: 20, color: DARK_GREY }),
          new TextRun({ text: cvData.technicalSkills.languages, font: 'Calibri', size: 20 })
        ],
        spacing: { before: 40, after: 80 }
      }));
    }
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      children: children
    }]
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cvData.name.replace(/[^a-zA-Z0-9]/g, '_')}_CV_Aligned.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
