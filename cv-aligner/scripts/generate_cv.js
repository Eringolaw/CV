/**
 * Noviam CV Generator
 * Generates a branded CV document in Noviam style
 *
 * Usage: node generate_cv.js <output_path> <json_data_path>
 *
 * JSON data structure:
 * {
 *   "name": "Candidate Name",
 *   "professionalSummary": "Summary text...",
 *   "coreCompetencies": ["Skill 1", "Skill 2", ...],
 *   "professionalExperience": [
 *     {
 *       "role": "Job Title",
 *       "company": "Company Name",
 *       "location": "City, State",
 *       "dates": "Start – End",
 *       "achievements": ["Achievement 1", "Achievement 2", ...]
 *     }
 *   ],
 *   "education": [
 *     {
 *       "degree": "Degree Name",
 *       "institution": "University Name",
 *       "location": "City, State",
 *       "date": "Graduation Date",
 *       "details": "GPA, honors, coursework (optional)"
 *     }
 *   ],
 *   "certifications": [
 *     {
 *       "name": "Certification Name",
 *       "details": "Grade/Date (optional)"
 *     }
 *   ],
 *   "leadership": [
 *     {
 *       "role": "Position",
 *       "organization": "Organization Name",
 *       "dates": "Start – End",
 *       "achievements": ["Achievement 1", ...]
 *     }
 *   ],
 *   "technicalSkills": {
 *     "technical": "Bloomberg Terminal, Excel (Advanced), ...",
 *     "languages": "English (Native), Spanish (Intermediate), ..."
 *   }
 * }
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
  TabStopPosition,
  TabStopType,
  Header,
  Footer,
  PageNumber,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Noviam Brand Colors
const COLORS = {
  noviamBlue: "004796",
  noviamMidBlue: "006BFF",
  noviamLightBlue: "00c3f5",
  darkGrey: "626366",
  black: "000000",
  white: "FFFFFF",
};

// Get script directory for assets
const SCRIPT_DIR = __dirname;
const LOGO_PATH = path.join(SCRIPT_DIR, "..", "assets", "noviam_logo.png");

function createSectionHeading(text) {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    keepNext: true,
    keepLines: true,
    border: {
      bottom: {
        color: COLORS.noviamMidBlue,
        space: 1,
        size: 12,
        style: BorderStyle.SINGLE,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        font: "Montserrat",
        size: 22,
        color: COLORS.noviamBlue,
      }),
    ],
  });
}

function createJobHeader(role, company, location, dates) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    keepNext: true,
    keepLines: true,
    children: [
      new TextRun({
        text: role,
        bold: true,
        font: "Montserrat",
        size: 20,
        color: COLORS.noviamMidBlue,
      }),
      new TextRun({
        text: " | ",
        font: "Montserrat",
        size: 20,
        color: COLORS.noviamMidBlue,
      }),
      new TextRun({
        text: `${company}, ${location}`,
        font: "Montserrat",
        size: 20,
        color: COLORS.noviamMidBlue,
      }),
      new TextRun({
        text: " | ",
        font: "Montserrat",
        size: 20,
        color: COLORS.noviamMidBlue,
      }),
      new TextRun({
        text: dates,
        italics: true,
        font: "Montserrat",
        size: 20,
        color: COLORS.noviamMidBlue,
      }),
    ],
  });
}

function createBulletPoint(text, reference, keepWithNext = false) {
  return new Paragraph({
    numbering: { reference: reference, level: 0 },
    spacing: { before: 40, after: 40 },
    keepNext: keepWithNext,
    keepLines: true,
    children: [
      new TextRun({
        text: text,
        font: "Montserrat",
        size: 20,
        color: COLORS.black,
      }),
    ],
  });
}

function generateCV(data, outputPath) {
  const children = [];

  // Logo
  if (fs.existsSync(LOGO_PATH)) {
    const logoImage = fs.readFileSync(LOGO_PATH);
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 300 },
        children: [
          new ImageRun({
            type: "png",
            data: logoImage,
            transformation: { width: 180, height: 45 },
            altText: {
              title: "Noviam Logo",
              description: "Noviam company logo",
              name: "noviam-logo",
            },
          }),
        ],
      })
    );
  }

  // Candidate Name
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: data.name,
          bold: true,
          font: "Montserrat",
          size: 40,
          color: COLORS.darkGrey,
        }),
      ],
    })
  );

  // Professional Summary
  if (data.professionalSummary) {
    children.push(createSectionHeading("Professional Summary"));
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 120 },
        keepLines: true,
        children: [
          new TextRun({
            text: data.professionalSummary,
            font: "Montserrat",
            size: 20,
            color: COLORS.black,
          }),
        ],
      })
    );
  }

  // Core Competencies
  if (data.coreCompetencies && data.coreCompetencies.length > 0) {
    children.push(createSectionHeading("Core Competencies"));
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 120 },
        keepLines: true,
        children: [
          new TextRun({
            text: data.coreCompetencies.join("  •  "),
            font: "Montserrat",
            size: 20,
            color: COLORS.black,
          }),
        ],
      })
    );
  }

  // Professional Experience
  if (data.professionalExperience && data.professionalExperience.length > 0) {
    children.push(createSectionHeading("Professional Experience"));
    data.professionalExperience.forEach((job) => {
      children.push(
        createJobHeader(job.role, job.company, job.location, job.dates)
      );
      if (job.achievements && job.achievements.length > 0) {
        job.achievements.forEach((achievement, index) => {
          // Keep all bullets except the last one together with next
          const isLastBullet = index === job.achievements.length - 1;
          children.push(createBulletPoint(achievement, "experience-bullets", !isLastBullet));
        });
      }
    });
  }

  // Education & Certification
  const hasEducation = data.education && data.education.length > 0;
  const hasCertifications =
    data.certifications && data.certifications.length > 0;

  if (hasEducation || hasCertifications) {
    children.push(createSectionHeading("Education & Certification"));

    if (hasEducation) {
      data.education.forEach((edu) => {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            keepNext: true,
            keepLines: true,
            children: [
              new TextRun({
                text: edu.degree,
                bold: true,
                font: "Montserrat",
                size: 20,
                color: COLORS.noviamMidBlue,
              }),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 40 },
            keepNext: edu.details ? true : false,
            keepLines: true,
            children: [
              new TextRun({
                text: `${edu.institution}, ${edu.location} | ${edu.date}`,
                font: "Montserrat",
                size: 20,
                color: COLORS.darkGrey,
              }),
            ],
          })
        );
        if (edu.details) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 80 },
              keepLines: true,
              children: [
                new TextRun({
                  text: edu.details,
                  font: "Montserrat",
                  size: 20,
                  color: COLORS.black,
                }),
              ],
            })
          );
        }
      });
    }

    if (hasCertifications) {
      data.certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 80 },
            keepLines: true,
            children: [
              new TextRun({
                text: cert.name,
                bold: true,
                font: "Montserrat",
                size: 20,
                color: COLORS.darkGrey,
              }),
              cert.details
                ? new TextRun({
                    text: ` | ${cert.details}`,
                    font: "Montserrat",
                    size: 20,
                    color: COLORS.darkGrey,
                  })
                : null,
            ].filter(Boolean),
          })
        );
      });
    }
  }

  // Leadership
  if (data.leadership && data.leadership.length > 0) {
    children.push(createSectionHeading("Leadership"));
    data.leadership.forEach((lead) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          keepNext: true,
          keepLines: true,
          children: [
            new TextRun({
              text: lead.role,
              bold: true,
              font: "Montserrat",
              size: 20,
              color: COLORS.noviamMidBlue,
            }),
            new TextRun({
              text: ` | ${lead.organization} | ${lead.dates}`,
              font: "Montserrat",
              size: 20,
              color: COLORS.noviamMidBlue,
            }),
          ],
        })
      );
      if (lead.achievements && lead.achievements.length > 0) {
        lead.achievements.forEach((achievement, index) => {
          const isLastBullet = index === lead.achievements.length - 1;
          children.push(createBulletPoint(achievement, "leadership-bullets", !isLastBullet));
        });
      }
    });
  }

  // Technical Skills & Languages
  if (data.technicalSkills) {
    children.push(createSectionHeading("Technical Skills & Languages"));
    if (data.technicalSkills.technical) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          keepNext: data.technicalSkills.languages ? true : false,
          keepLines: true,
          children: [
            new TextRun({
              text: "Technical: ",
              bold: true,
              font: "Montserrat",
              size: 20,
              color: COLORS.darkGrey,
            }),
            new TextRun({
              text: data.technicalSkills.technical,
              font: "Montserrat",
              size: 20,
              color: COLORS.black,
            }),
          ],
        })
      );
    }
    if (data.technicalSkills.languages) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 80 },
          keepLines: true,
          children: [
            new TextRun({
              text: "Languages: ",
              bold: true,
              font: "Montserrat",
              size: 20,
              color: COLORS.darkGrey,
            }),
            new TextRun({
              text: data.technicalSkills.languages,
              font: "Montserrat",
              size: 20,
              color: COLORS.black,
            }),
          ],
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Montserrat",
            size: 20,
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "experience-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
        {
          reference: "leadership-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: {
              width: 12240,
              height: 15840,
            },
            margin: {
              top: 1080,
              right: 1080,
              bottom: 1080,
              left: 1080,
              header: 720,
              footer: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 360 },
                tabStops: [
                  {
                    type: TabStopType.RIGHT,
                    position: 10080,
                  },
                ],
                children: [
                  new TextRun({
                    text: "Noviam Analyst: ",
                    bold: true,
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    text: data.name,
                    bold: true,
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    text: "\t",
                  }),
                  new TextRun({
                    text: "Private and Confidential",
                    bold: true,
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                ],
              }),
            ],
          }),
          first: new Header({
            children: [],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [
                  {
                    type: TabStopType.RIGHT,
                    position: 10080,
                  },
                ],
                children: [
                  new TextRun({
                    text: "© 2026, Noviam Inc. All Rights Reserved.",
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    text: "\t",
                  }),
                  new TextRun({
                    text: "Page ",
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    text: " of ",
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                ],
              }),
            ],
          }),
          first: new Footer({
            children: [
              new Paragraph({
                tabStops: [
                  {
                    type: TabStopType.RIGHT,
                    position: 10080,
                  },
                ],
                children: [
                  new TextRun({
                    text: "© 2026, Noviam Inc. All Rights Reserved.",
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    text: "\t",
                  }),
                  new TextRun({
                    text: "Page ",
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    text: " of ",
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Montserrat",
                    size: 18,
                    color: COLORS.darkGrey,
                  }),
                ],
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  return Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`CV generated: ${outputPath}`);
  });
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node generate_cv.js <output_path> <json_data_path>");
    process.exit(1);
  }

  const outputPath = args[0];
  const jsonPath = args[1];

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  generateCV(data, outputPath).catch((err) => {
    console.error("Error generating CV:", err);
    process.exit(1);
  });
}

module.exports = { generateCV };
