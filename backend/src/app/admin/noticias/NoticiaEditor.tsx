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
          {/* Resize handle */}
          <div
            onMouseDown={onMouseDown}
            style={{ position: "absolute", right: -6, bottom: -6, width: 14, height: 14, background: "#0B2C5F", borderRadius: "50%", cursor: "se-resize", border: "2px solid white", zIndex: 10 }}
          />
          {/* Align buttons */}
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

  function applyFontSize(size: string) {
    if (!editor) return;
    const num = parseInt(size);
    if (!num) return;
    // Wrap selection in a span with font-size
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
    <Btn key="img" onClick={() => imgInputRef.current?.click()} title="Insertar imagen">🖼️ Imagen</Btn>,
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
