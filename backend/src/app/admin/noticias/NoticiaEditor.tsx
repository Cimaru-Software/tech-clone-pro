"use client";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";

interface Props {
  content: string;
  onChange: (html: string) => void;
}

/* ─── Resizable Image Node ─── */
function ResizableImageView({ node, updateAttributes }: { node: { attrs: { src: string; width: string; align: string } }; updateAttributes: (a: Record<string, unknown>) => void; selected: boolean }) {
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const width = node.attrs.width || "100%";
  const align = node.attrs.align || "center";

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = imgRef.current?.offsetWidth || 300;
    setDragging(true);

    function onMove(ev: MouseEvent) {
      const newW = Math.max(80, startW.current + (ev.clientX - startX.current));
      updateAttributes({ width: `${newW}px` });
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const justifyMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end" };

  return (
    <NodeViewWrapper>
      <div style={{ display: "flex", justifyContent: justifyMap[align] || "center", margin: "0.75rem 0", userSelect: dragging ? "none" : "auto" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <img ref={imgRef} src={node.attrs.src} alt="" style={{ width, maxWidth: "100%", display: "block", borderRadius: "8px", cursor: "default" }} />
          <div
            onMouseDown={onMouseDown}
            style={{ position: "absolute", right: -6, bottom: -6, width: 14, height: 14, background: "#0B2C5F", borderRadius: "50%", cursor: "se-resize", border: "2px solid white", zIndex: 10 }}
          />
          <div style={{ position: "absolute", top: -32, left: 0, display: "flex", gap: 4, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "2px 6px" }}>
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} type="button" onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: a }); }}
                style={{ background: align === a ? "#D71920" : "transparent", border: "none", color: "white", cursor: "pointer", borderRadius: 4, padding: "2px 6px", fontSize: "0.7rem", fontWeight: 700 }}>
                {a === "left" ? "◀" : a === "center" ? "▬" : "▶"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: "100%" },
      align: { default: "center" },
    };
  },
  parseHTML() { return [{ tag: "img[src]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView as unknown as Parameters<typeof ReactNodeViewRenderer>[0]);
  },
});

/* ─── Image Row Node (flex row of resizable images) ─── */
interface RowImage { src: string; width: number }

function ImageRowView({ node, updateAttributes }: {
  node: { attrs: { images: RowImage[]; gap: number } };
  updateAttributes: (a: Record<string, unknown>) => void;
}) {
  const images: RowImage[] = node.attrs.images || [];
  const gap: number = node.attrs.gap ?? 8;

  const dragState = useRef<{ idx: number; startX: number; startW: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onResizeDown(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    const imgEl = containerRef.current?.querySelectorAll("img")[idx] as HTMLImageElement | undefined;
    dragState.current = { idx, startX: e.clientX, startW: imgEl?.offsetWidth || 200 };

    function onMove(ev: MouseEvent) {
      if (!dragState.current) return;
      const { idx, startX, startW } = dragState.current;
      const newW = Math.max(60, startW + (ev.clientX - startX));
      const next = images.map((img, i) => i === idx ? { ...img, width: newW } : img);
      updateAttributes({ images: next });
    }
    function onUp() {
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function removeImage(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    updateAttributes({ images: next });
  }

  async function addImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/noticias/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      updateAttributes({ images: [...images, { src: data.url, width: 200 }] });
    }
  }

  return (
    <NodeViewWrapper>
      <div style={{ border: "2px dashed #0B2C5F33", borderRadius: 10, padding: "8px", margin: "0.75rem 0", background: "#f8faff" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>Fila de imágenes</span>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
            style={{ marginLeft: "auto", padding: "2px 10px", borderRadius: 5, border: "1.5px solid #D71920", background: "#D71920", color: "white", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}>
            + Añadir imagen
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ""; }} />
        </div>
        <div ref={containerRef} style={{ display: "flex", flexWrap: "wrap", gap, alignItems: "flex-start" }}>
          {images.length === 0 ? (
            <span style={{ color: "#9ca3af", fontSize: "0.82rem", padding: "12px 0" }}>Sin imágenes — usa "+ Añadir imagen"</span>
          ) : images.map((img, i) => (
            <div key={i} style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
              <img src={img.src} alt="" style={{ width: img.width, maxWidth: "100%", display: "block", borderRadius: 8 }} />
              <div onMouseDown={(e) => onResizeDown(e, i)}
                style={{ position: "absolute", right: -5, bottom: -5, width: 13, height: 13, background: "#0B2C5F", borderRadius: "50%", cursor: "se-resize", border: "2px solid white", zIndex: 10 }} />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); removeImage(i); }}
                style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%", background: "rgba(215,25,32,0.85)", border: "none", color: "white", cursor: "pointer", fontSize: "0.8rem", fontWeight: 900, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

const ImageRow = Node.create({
  name: "imageRow",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      images: { default: [] },
      gap: { default: 8 },
    };
  },
  parseHTML() {
    return [{
      tag: "div[data-image-row]",
      getAttrs: (el) => {
        const node = el as HTMLElement;
        const imgs = Array.from(node.querySelectorAll("img"));
        const images: RowImage[] = imgs.map((img) => ({
          src: img.getAttribute("src") || "",
          width: parseInt(img.style.width) || 200,
        }));
        const gapMatch = /gap:\s*(\d+)px/.exec(node.style.gap || node.getAttribute("style") || "");
        return { images, gap: gapMatch ? parseInt(gapMatch[1]) : 8 };
      },
    }];
  },
  renderHTML({ node }) {
    const images: RowImage[] = node.attrs.images || [];
    const gap: number = node.attrs.gap ?? 8;
    const children = images.map((img: RowImage) =>
      ["img", { src: img.src, alt: "", style: `width:${img.width}px;max-width:100%;border-radius:8px;display:inline-block;vertical-align:top;` }]
    );
    return [
      "div",
      mergeAttributes({ "data-image-row": "true", style: `display:flex;flex-wrap:wrap;gap:${gap}px;` }),
      ...children,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageRowView as unknown as Parameters<typeof ReactNodeViewRenderer>[0]);
  },
});

/* ─── Image Grid Node ─── */
interface GridImage { src: string; alt?: string }

function ImageGridView({ node, updateAttributes }: {
  node: { attrs: { images: GridImage[]; cols: number } };
  updateAttributes: (a: Record<string, unknown>) => void;
}) {
  const images: GridImage[] = node.attrs.images || [];
  const cols: number = node.attrs.cols || 2;

  function removeImage(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    updateAttributes({ images: next });
  }

  function setCols(c: number) {
    updateAttributes({ cols: c });
  }

  async function addImageFromFile(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/noticias/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      updateAttributes({ images: [...images, { src: data.url, alt: "" }] });
    }
  }

  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <NodeViewWrapper>
      <div style={{ border: "2px dashed #0B2C5F22", borderRadius: 10, padding: "10px", margin: "0.75rem 0", background: "#f8faff" }}>
        {/* Grid controls */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>Galería — columnas:</span>
          {[2, 3, 4].map((c) => (
            <button key={c} type="button" onMouseDown={(e) => { e.preventDefault(); setCols(c); }}
              style={{ padding: "2px 10px", borderRadius: 5, border: `1.5px solid ${cols === c ? "#0B2C5F" : "#d1d5db"}`, background: cols === c ? "#0B2C5F" : "white", color: cols === c ? "white" : "#374151", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
              {c}
            </button>
          ))}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
            style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 5, border: "1.5px solid #D71920", background: "#D71920", color: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
            + Añadir imagen
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageFromFile(f); e.target.value = ""; }} />
        </div>

        {/* Grid */}
        {images.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0", fontSize: "0.85rem" }}>
            Sin imágenes — usa "+ Añadir imagen" para comenzar
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "4/3" }}>
                <img src={img.src} alt={img.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button type="button" onMouseDown={(e) => { e.preventDefault(); removeImage(i); }}
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(215,25,32,0.85)", border: "none", color: "white", cursor: "pointer", fontSize: "0.8rem", fontWeight: 900, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const ImageGrid = Node.create({
  name: "imageGrid",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      images: { default: [] },
      cols: { default: 2 },
    };
  },
  parseHTML() {
    return [{
      tag: "div[data-image-grid]",
      getAttrs: (el) => {
        const node = el as HTMLElement;
        const imgs = Array.from(node.querySelectorAll("img"));
        const images: GridImage[] = imgs.map((img) => ({
          src: img.getAttribute("src") || "",
          alt: img.getAttribute("alt") || "",
        }));
        const colsAttr = node.getAttribute("data-cols");
        return { images, cols: colsAttr ? parseInt(colsAttr) : 2 };
      },
    }];
  },
  renderHTML({ node }) {
    const images: GridImage[] = node.attrs.images || [];
    const cols: number = node.attrs.cols || 2;
    const children = images.map((img: GridImage) =>
      ["div", { style: "position:relative;border-radius:8px;overflow:hidden;aspect-ratio:4/3;" },
        ["img", { src: img.src, alt: img.alt || "", style: "width:100%;height:100%;object-fit:cover;display:block;" }]
      ]
    );
    return [
      "div",
      mergeAttributes({ "data-image-grid": "true", "data-cols": String(cols), style: `display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;` }),
      ...children,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageGridView as unknown as Parameters<typeof ReactNodeViewRenderer>[0]);
  },
});

/* ─── Toolbar button helpers ─── */
const S = {
  base: (active = false): React.CSSProperties => ({
    padding: "5px 8px", borderRadius: 6, border: `1px solid ${active ? "#0B2C5F" : "#d1d5db"}`,
    background: active ? "#0B2C5F" : "white", color: active ? "white" : "#374151",
    cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" as const,
    display: "flex", alignItems: "center", gap: 3,
  }),
  sep: { width: 1, background: "#e5e7eb", alignSelf: "stretch", margin: "0 3px" } as React.CSSProperties,
};

function Btn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return <button type="button" style={S.base(active)} onClick={onClick} title={title}>{children}</button>;
}

/* ─── Editor ─── */
export default function NoticiaEditor({ content, onChange }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [fontSizeVal, setFontSizeVal] = useState("16");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: "code-block" } } }),
      Underline,
      Highlight.configure({ multicolor: true }),
      LinkExt.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage,
      ImageGrid,
      ImageRow,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "ne-content",
        style: "min-height:420px;padding:1.25rem 1.5rem;outline:none;font-size:1rem;line-height:1.75;",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content, false as unknown as import("@tiptap/core").SetContentOptions);
  }, [content, editor]);

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/noticias/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url && editor) {
      editor.chain().focus().insertContent({
        type: "resizableImage",
        attrs: { src: `${data.url}`, width: "100%", align: "center" },
      }).run();
    }
  }

  function insertImageGrid() {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: "imageGrid",
      attrs: { images: [], cols: 2 },
    }).run();
  }

  function insertImageRow() {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: "imageRow",
      attrs: { images: [], gap: 8 },
    }).run();
  }

  function applyFontSize(size: string) {
    if (!editor) return;
    const num = parseInt(size);
    if (!num) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    editor.chain().focus().insertContent(`<span style="font-size:${num}px">${editor.state.doc.textBetween(from, to)}</span>`).run();
  }

  function applyColor(color: string) {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    editor.chain().focus().insertContent(`<span style="color:${color}">${editor.state.doc.textBetween(from, to)}</span>`).run();
  }

  if (!editor) return null;

  const groups: React.ReactNode[] = [
    /* Historial */
    <Btn key="undo" onClick={() => editor.chain().focus().undo().run()} title="Deshacer">↩</Btn>,
    <Btn key="redo" onClick={() => editor.chain().focus().redo().run()} title="Rehacer">↪</Btn>,
    "sep",

    /* Headings */
    <Btn key="h1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Btn>,
    <Btn key="h2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>,
    <Btn key="h3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>,
    "sep",

    /* Formato */
    <Btn key="bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><strong>N</strong></Btn>,
    <Btn key="italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><em>K</em></Btn>,
    <Btn key="underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado"><u>S</u></Btn>,
    <Btn key="strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><s>T</s></Btn>,
    <Btn key="highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Resaltar">🖍</Btn>,
    "sep",

    /* Color */
    <label key="color" title="Color de texto" style={{ ...S.base(), cursor: "pointer", gap: 4 }}>
      <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>A</span>
      <input ref={colorInputRef} type="color" defaultValue="#000000" style={{ width: 20, height: 20, border: "none", padding: 0, cursor: "pointer", borderRadius: 3 }}
        onChange={(e) => applyColor(e.target.value)} />
    </label>,

    /* Tamaño fuente */
    <select key="size" value={fontSizeVal} onChange={(e) => { setFontSizeVal(e.target.value); applyFontSize(e.target.value); }}
      style={{ ...S.base(), padding: "4px 6px", cursor: "pointer" }}>
      {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((s) => <option key={s} value={s}>{s}px</option>)}
    </select>,
    "sep",

    /* Alineación — íconos tipo Word */
    <Btn key="al" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinear izquierda">
      <svg width="14" height="14" viewBox="0 0 14 14"><line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="14" x2="8" y2="14" stroke="currentColor" strokeWidth="2"/></svg>
    </Btn>,
    <Btn key="ac" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centrar">
      <svg width="14" height="14" viewBox="0 0 14 14"><line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2"/><line x1="2" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="2"/></svg>
    </Btn>,
    <Btn key="ar" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinear derecha">
      <svg width="14" height="14" viewBox="0 0 14 14"><line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2"/><line x1="4" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2"/></svg>
    </Btn>,
    <Btn key="aj" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justificar">
      <svg width="14" height="14" viewBox="0 0 14 14"><line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2"/></svg>
    </Btn>,
    "sep",

    /* Listas */
    <Btn key="ul" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista viñetas">
      <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="1.5" cy="2" r="1.5" fill="currentColor"/><line x1="4" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2"/><circle cx="1.5" cy="7" r="1.5" fill="currentColor"/><line x1="4" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="2"/><circle cx="1.5" cy="12" r="1.5" fill="currentColor"/><line x1="4" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
    </Btn>,
    <Btn key="ol" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
      <svg width="14" height="14" viewBox="0 0 14 14"><text x="0" y="4" fontSize="5" fill="currentColor">1.</text><line x1="5" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2"/><text x="0" y="9" fontSize="5" fill="currentColor">2.</text><line x1="5" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="2"/><text x="0" y="14" fontSize="5" fill="currentColor">3.</text><line x1="5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
    </Btn>,
    "sep",

    /* Extras */
    <Btn key="quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">"  "</Btn>,
    <Btn key="code" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de código">{"</>"}</Btn>,
    <Btn key="link" active={editor.isActive("link")} onClick={() => {
      if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
      const url = window.prompt("URL del enlace:");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }} title="Enlace">🔗</Btn>,
    <Btn key="img" onClick={() => imgInputRef.current?.click()} title="Insertar imagen sola">🖼️ Imagen</Btn>,
    <Btn key="row" onClick={insertImageRow} title="Insertar fila de imágenes lado a lado">↔ Fila</Btn>,
    <Btn key="grid" onClick={insertImageGrid} title="Insertar galería en grid">⊞ Galería</Btn>,
    "sep",
    <Btn key="hr" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">― HR</Btn>,
  ];

  return (
    <div style={{ border: "1.5px solid #d1d5db", borderRadius: 10, overflow: "hidden", background: "white" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px", borderBottom: "1.5px solid #e5e7eb", background: "#f9fafb", alignItems: "center" }}>
        {groups.map((g, i) =>
          g === "sep" ? <div key={`s${i}`} style={S.sep} /> : g
        )}
      </div>

      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />

      <EditorContent editor={editor} />

      <style>{`
        .ne-content h1{font-size:2rem;font-weight:800;margin:1.2rem 0 .6rem;color:#0B2C5F}
        .ne-content h2{font-size:1.5rem;font-weight:700;margin:1rem 0 .5rem;color:#0B2C5F}
        .ne-content h3{font-size:1.2rem;font-weight:700;margin:.8rem 0 .4rem;color:#0B2C5F}
        .ne-content p{margin:.5rem 0}
        .ne-content ul{list-style:disc;padding-left:1.5rem;margin:.5rem 0}
        .ne-content ol{list-style:decimal;padding-left:1.5rem;margin:.5rem 0}
        .ne-content blockquote{border-left:4px solid #D71920;padding-left:1rem;margin:1rem 0;color:#6b7280;font-style:italic}
        .ne-content pre{background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;font-size:.85rem;margin:.75rem 0;overflow-x:auto}
        .ne-content code{background:#f1f5f9;padding:.15rem .4rem;border-radius:4px;font-size:.85em}
        .ne-content hr{border:none;border-top:2px solid #e5e7eb;margin:1.5rem 0}
        .ne-content a{color:#D71920;text-decoration:underline}
        .ne-content mark{background:#fef08a;padding:.1rem .2rem;border-radius:3px}
        .ProseMirror-focused{outline:none}
      `}</style>
    </div>
  );
}
