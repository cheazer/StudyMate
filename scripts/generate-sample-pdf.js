/* eslint-disable @typescript-eslint/no-require-imports */
// Hand-writes a minimal, valid multi-page PDF (no dependencies) containing
// realistic lecture-notes content, for manually testing the course-material
// upload -> Gemma-analysis pipeline end to end.
//
// Run: node scripts/generate-sample-pdf.js
const fs = require("fs");
const path = require("path");

const LECTURES = [
  {
    title: "Lecture 1: Vector Spaces and Subspaces",
    paragraphs: [
      "A vector space is a set V, together with two operations (vector addition and " +
        "scalar multiplication), satisfying eight axioms: closure under addition, " +
        "associativity of addition, commutativity of addition, existence of a zero " +
        "vector, existence of additive inverses, closure under scalar multiplication, " +
        "distributivity of scalar multiplication over vector addition, and " +
        "distributivity of scalar multiplication over field addition.",
      "Common examples include R^n (n-tuples of real numbers), the space of " +
        "polynomials of degree at most n, and spaces of continuous functions on an " +
        "interval. A subspace is a subset of a vector space that is itself a vector " +
        "space under the inherited operations; to check whether a subset W of V is a " +
        "subspace, it suffices to verify that W contains the zero vector and is closed " +
        "under both addition and scalar multiplication.",
    ],
  },
  {
    title: "Lecture 2: Linear Independence, Basis, and Dimension",
    paragraphs: [
      "A set of vectors {v1, ..., vk} is linearly independent if the only solution to " +
        "c1*v1 + c2*v2 + ... + ck*vk = 0 is c1 = c2 = ... = ck = 0. If a nontrivial " +
        "combination equals zero, the set is linearly dependent, meaning at least one " +
        "vector can be written as a combination of the others.",
      "A basis for a vector space V is a linearly independent set that spans V — " +
        "every vector in V can be written uniquely as a linear combination of basis " +
        "vectors. All bases of a given finite-dimensional vector space have the same " +
        "number of elements, called the dimension of V, written dim(V).",
    ],
  },
  {
    title: "Lecture 3: Matrices and Linear Transformations",
    paragraphs: [
      "A linear transformation T: V -> W between vector spaces preserves vector " +
        "addition and scalar multiplication: T(u + v) = T(u) + T(v) and T(c*v) = " +
        "c*T(v). Every linear transformation between finite-dimensional vector spaces " +
        "can be represented by a matrix once bases for V and W are fixed.",
      "Composing two linear transformations corresponds exactly to multiplying their " +
        "matrix representations. The rank of a matrix is the dimension of its column " +
        "space (equivalently, the dimension of the image of the transformation), and " +
        "the rank-nullity theorem relates rank, nullity, and the dimension of the " +
        "domain: dim(domain) = rank(T) + nullity(T).",
    ],
  },
  {
    title: "Lecture 4: Eigenvalues, Eigenvectors, and Diagonalization",
    paragraphs: [
      "For a square matrix A, a nonzero vector v is an eigenvector of A if Av = " +
        "lambda*v for some scalar lambda, called the corresponding eigenvalue. " +
        "Eigenvalues are found as the roots of the characteristic polynomial, " +
        "det(A - lambda*I) = 0, and the eigenvectors for a given eigenvalue span its " +
        "eigenspace.",
      "A matrix A is diagonalizable if it can be written as A = P*D*P^-1, where D is " +
        "diagonal and P's columns are linearly independent eigenvectors of A. " +
        "Diagonalization is possible exactly when the algebraic and geometric " +
        "multiplicities of every eigenvalue match, and it dramatically simplifies " +
        "computing powers of A (A^k = P*D^k*P^-1), which underlies methods like " +
        "Principal Component Analysis and the power iteration method.",
    ],
  },
];

// --- Word-wrap into lines that fit comfortably on a Letter-size page ---
function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// --- Lay out all lecture content into pages of plain text lines ---
const MAX_CHARS_PER_LINE = 92;
const LINES_PER_PAGE = 48;

const allLines = [];
for (const lecture of LECTURES) {
  allLines.push({ text: lecture.title, heading: true });
  allLines.push({ text: "", heading: false });
  for (const para of lecture.paragraphs) {
    for (const line of wrapText(para, MAX_CHARS_PER_LINE)) {
      allLines.push({ text: line, heading: false });
    }
    allLines.push({ text: "", heading: false });
  }
}

const pages = [];
for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
  pages.push(allLines.slice(i, i + LINES_PER_PAGE));
}

// --- Build one PDF content stream per page ---
function buildContentStream(lines) {
  let stream = "BT\n/F1 11 Tf\n12 TL\n50 740 Td\n";
  for (const line of lines) {
    const size = line.heading ? 13 : 11;
    stream += `/F1 ${size} Tf\n(${escapePdfText(line.text)}) Tj\nT*\n`;
  }
  stream += "ET\n";
  return stream;
}

// --- Assemble the PDF byte-by-byte, tracking object offsets for the xref table ---
const HEADER = "%PDF-1.4\n";
const objects = [];

const catalogObjNum = 1;
const pagesObjNum = 2;
const fontObjNum = 3;
const firstPageObjNum = 4;
const firstContentObjNum = firstPageObjNum + pages.length;

const pageObjNums = pages.map((_, i) => firstPageObjNum + i);
const contentObjNums = pages.map((_, i) => firstContentObjNum + i);

objects[catalogObjNum] = `<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>`;
objects[pagesObjNum] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`;
objects[fontObjNum] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

pages.forEach((_, i) => {
  const pageNum = pageObjNums[i];
  const contentNum = contentObjNums[i];
  objects[pageNum] =
    `<< /Type /Page /Parent ${pagesObjNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> ` +
    `/MediaBox [0 0 612 792] /Contents ${contentNum} 0 R >>`;
});

pages.forEach((lines, i) => {
  const contentNum = contentObjNums[i];
  const stream = buildContentStream(lines);
  objects[contentNum] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}endstream`;
});

const totalObjects = objects.length; // sparse array; length = highest index + 1

let body = HEADER;
const offsets = new Array(totalObjects).fill(0);
for (let num = 1; num < totalObjects; num += 1) {
  if (objects[num] === undefined) continue;
  offsets[num] = Buffer.byteLength(body, "latin1");
  body += `${num} 0 obj\n${objects[num]}\nendobj\n`;
}

const xrefOffset = Buffer.byteLength(body, "latin1");
let xref = `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
for (let num = 1; num < totalObjects; num += 1) {
  const offset = offsets[num] ?? 0;
  xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
}

const trailer =
  `trailer\n<< /Size ${totalObjects} /Root ${catalogObjNum} 0 R >>\n` +
  `startxref\n${xrefOffset}\n%%EOF`;

const pdf = body + xref + trailer;

const outDir = path.join(__dirname, "sample-course-material");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "linear-algebra-lecture.pdf");
fs.writeFileSync(outPath, Buffer.from(pdf, "latin1"));

console.log(`Wrote ${outPath} (${pages.length} pages, ${allLines.length} lines)`);
