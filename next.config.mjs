/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse (via pdfjs-dist) dynamically resolves its worker script from
  // disk at runtime. Bundling it with Turbopack/webpack breaks that lookup
  // ("Cannot find module .../pdf.worker.mjs"), so keep it external and let
  // Node require it normally.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
