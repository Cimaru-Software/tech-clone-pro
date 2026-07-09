/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@tiptap/react",
    "@tiptap/pm",
    "@tiptap/starter-kit",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "@tiptap/extension-text-align",
    "@tiptap/extension-underline",
    "@tiptap/extension-color",
    "@tiptap/extension-text-style",
    "@tiptap/extension-highlight",
    "@tiptap/core",
    "@tiptap/extension-bold",
    "@tiptap/extension-italic",
    "@tiptap/extension-strike",
    "@tiptap/extension-code",
    "@tiptap/extension-paragraph",
    "@tiptap/extension-heading",
    "@tiptap/extension-blockquote",
    "@tiptap/extension-bullet-list",
    "@tiptap/extension-ordered-list",
    "@tiptap/extension-list-item",
    "@tiptap/extension-code-block",
    "@tiptap/extension-hard-break",
    "@tiptap/extension-horizontal-rule",
    "@tiptap/extension-history",
    "@tiptap/extension-document",
    "@tiptap/extension-text",
    "@tiptap/extension-gapcursor",
    "@tiptap/extension-dropcursor",
  ],
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001", "localhost:5173"],
    },
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.NODE_ENV === "production" ? "https://www.lacasadelcomputador.ec" : "http://localhost:5173" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
