<template>
  <div class="post-content relative">
    <EditorContent v-if="editor" :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, BackgroundColor } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import NodeRange from '@tiptap/extension-node-range'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Separator from './Separator'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TaskItemNodeView from './TaskItemNodeView.vue'
import CodeBlockNodeView from './CodeBlockNodeView.vue'
import { CustomImage } from './CustomImage'
import ImageGallery from './ImageGallery'
import { Video } from './Video'
import { Audio } from './Audio'
import { Conway } from './Conway'
import { HorizontalCard } from './HorizontalCard'
import { AutoLinkPreview } from './AutoLinkPreview'
import { watch } from 'vue'
import { useLowlight } from '~/composables/useCodeHighlight'

interface Props {
  content: string | object
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

// Read-only editor for displaying already saved article content
const editor = useEditor({
  content: props.content,
  editable: false,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: false, // Disable default codeBlock to use CodeBlockLowlight
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(CodeBlockNodeView)
      },
    }).configure({ lowlight: useLowlight() }),
    CustomImage,
    ImageGallery,
    Video,
    Audio,
    Conway,
    HorizontalCard,
    AutoLinkPreview,
    TextStyle,
    BackgroundColor,
    Color,
    Highlight.configure({ multicolor: true }),
    NodeRange,
    Table,
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.extend({ addNodeView() { return VueNodeViewRenderer(TaskItemNodeView) } }),
    Separator,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'paragraph' && node.attrs?.placeholder) return node.attrs.placeholder
        if (node.type.name === 'paragraph') return 'Loading content…'
        return ''
      },
      includeChildren: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-lg max-w-none focus:outline-none',
    },
  },
})

// Sync when parent updates content externally
watch(() => props.content, (newContent) => {
  if (!editor.value || !newContent) return
  if (typeof newContent !== 'string') {
    editor.value.commands.setContent(newContent)
    return
  }
  if (editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent)
  }
})
</script>

<style>
@layer components {

/* Tiptap styles for this component. */
.post-content { @apply text-foreground; }
.post-content .ProseMirror { @apply focus:outline-none border-none ring-none shadow-none; }
.post-content .ProseMirror.ProseMirror-noderangeselection.ProseMirror-hideselection { @apply bg-[#000] p-2 transition-all; }
.post-content .ProseMirror.ProseMirror-noderangeselection.ProseMirror-hideselection { @apply color-white transition-all; }
.post-content .ProseMirror.ProseMirror-noderangeselection.ProseMirror-hideselection p { @apply color-white transition-all; }
.dark .post-content .ProseMirror.ProseMirror-noderangeselection.ProseMirror-hideselection { @apply bg-[#F5E5E1]; }
.dark .post-content .ProseMirror.ProseMirror-noderangeselection.ProseMirror-hideselection { @apply color-black transition-all; }
.dark .post-content .ProseMirror.ProseMirror-noderangeselection.ProseMirror-hideselection p { @apply color-black transition-all; }
.post-content .ProseMirror [data-placeholder].is-editor-empty,
.post-content .ProseMirror [data-placeholder].is-empty { position: relative; }
.post-content .ProseMirror p[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror p[data-placeholder].is-empty::after,
.post-content .ProseMirror h1[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h1[data-placeholder].is-empty::after,
.post-content .ProseMirror h2[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h2[data-placeholder].is-empty::after,
.post-content .ProseMirror h3[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h3[data-placeholder].is-empty::after,
.post-content .ProseMirror h4[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h4[data-placeholder].is-empty::after,
.post-content .ProseMirror li[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror li[data-placeholder].is-empty::after,
.post-content .ProseMirror blockquote[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror blockquote[data-placeholder].is-empty::after {
  content: attr(data-placeholder);
  color: #adb5bd;
  position: absolute;
  left: 0.125rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.9;
  white-space: pre-wrap;
  z-index: 0;
}
.post-content .ProseMirror h1 { margin-block: 36px 18px; color: var(--site-color-heading); font-family: var(--site-font-heading); font-size: 32px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.25; }
.post-content .ProseMirror h2 { margin-block: 32px 16px; color: var(--site-color-heading); font-family: var(--site-font-heading); font-size: 24px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.3; }
.post-content .ProseMirror h3 { margin-block: 28px 14px; color: var(--site-color-heading); font-family: var(--site-font-heading); font-size: 20px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.4; }
.post-content .ProseMirror h4 { margin-block: 24px 12px; color: var(--site-color-heading); font-family: var(--site-font-heading); font-size: 18px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.45; }
.post-content .ProseMirror p { margin: 0 0 24px; color: var(--site-color-text); font-family: var(--site-font-body); font-size: 16px; font-weight: 400; line-height: 1.75; }
.post-content .ProseMirror ul[data-type="taskList"] p { @apply mb-0; line-height: 1rem; }
.post-content .ProseMirror strong { @apply font-800 text-foreground; }
.post-content .ProseMirror em { @apply italic; }
.post-content .ProseMirror blockquote {
  margin-block: 28px;
  padding: 18px 22px;
  border: 0;
  border-radius: var(--site-radius-card);
  background: var(--site-color-hover-background);
  color: var(--site-color-text);
  font-family: var(--site-font-body);
  font-size: 17px;
  font-style: italic;
  line-height: 1.65;
}
.post-content .ProseMirror blockquote p { margin-bottom: 0; }
.post-content .ProseMirror ul:not([data-type="taskList"]), .post-content .ProseMirror ol { @apply my-6 pl-6; }
.post-content .ProseMirror ul { @apply list-disc; }
.post-content .ProseMirror ol { @apply list-decimal; }
.post-content .ProseMirror li { @apply text-base md:text-lg leading-relaxed text-foreground/90 font-body font-400; }
.post-content .ProseMirror ul:not([data-type="taskList"]) > li + li,
.post-content .ProseMirror ol > li + li { margin-top: 12px; }
.post-content .ProseMirror ul:not([data-type="taskList"]) li > p,
.post-content .ProseMirror ol li > p { margin-block: 0; }
.post-content .ProseMirror ul:not([data-type="taskList"]) li > ul,
.post-content .ProseMirror ul:not([data-type="taskList"]) li > ol,
.post-content .ProseMirror ol li > ul,
.post-content .ProseMirror ol li > ol { margin-block: 12px 0; }
.post-content .ProseMirror code { @apply bg-muted px-2 py-1 rounded text-sm font-mono; color: var(--site-color-accent); }
.post-content .ProseMirror pre { @apply bg-muted rounded-lg overflow-x-auto my-6; }
.post-content .ProseMirror pre code { @apply bg-transparent p-0 text-foreground; }
.post-content .ProseMirror img { @apply w-full h-auto rounded-xl my-8 shadow-lg cursor-pointer; }
.post-content .ProseMirror td,
.post-content .ProseMirror th {
  @apply font-text;
}
.post-content img.ProseMirror-selectednode {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 2px;
  border-radius: 6px;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
  transition: outline-offset 0.2s ease, box-shadow 0.2s ease;
}
.ProseMirror figure.image-figure--full-bleed {
  width: 100vw;
  max-width: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding-inline: 1rem;
  box-sizing: border-box;
}
.ProseMirror figure.image-figure--full-bleed img {
  width: 100%;
  max-width: none;
  margin: 0;
  border-radius: 0;
}
.post-content .ProseMirror hr { @apply my-12 border-t-none border-b border-border h-[16px] bg-transparent transition-colors duration-800 ease-in-out; }
.post-content .ProseMirror hr:hover { border-color: var(--site-color-accent); }
.post-content .ProseMirror hr.separator { @apply; }
.post-content .ProseMirror hr.separator--dashed { @apply border-border/60 border-b-dashed opacity-80; }
.post-content .ProseMirror ul[data-type="taskList"] { @apply list-none ml-0 p-0; }
.post-content .ProseMirror ul[data-type="taskList"] li { @apply flex items-start gap-2; }
.post-content .ProseMirror ul[data-type="taskList"] li > label { @apply flex-shrink-0 mt-1 select-none mr-2; }
.post-content .ProseMirror ul[data-type="taskList"] li > div { @apply flex-auto; }
.post-content .ProseMirror table { @apply w-full my-8 border-collapse; }
.post-content .ProseMirror th { @apply bg-muted font-semibold text-left p-3 border border-border font-text; }
.post-content .ProseMirror td { @apply p-3 border border-border font-text; }
.post-content .horizontal-card__toolbar { @apply flex items-center gap-2 mb-2; }
.post-content .horizontal-card__toolbar button { @apply px-2 py-1 rounded border border-border bg-background text-sm; }
.post-content .horizontal-card__toolbar button.is-active {
  border-color: var(--site-color-accent);
  background: color-mix(in srgb, var(--site-color-accent) 12%, var(--site-color-background));
  color: var(--site-color-accent);
}
/* Code syntax highlighting theme */
/* Shared Tiptap Editor Styles extracted from legacy PostContent.vue */
/* Placeholder handling */
/* Typography */
/* Use Manrope for body content in both editor and viewer */
/* Highlight selected image node */
/* Figure/caption (node view) styling */
/* Full-bleed images (editor/read-only ProseMirror context) */
/* Task list */
/* Table */
/* Drag handle */
/* Horizontal card node */
/* Auto link preview styles */
/* .horizontal-card__textarea removed in favor of rich content editing */
/* Menus */
.post-content pre {
  position: relative;
  padding: 2.5rem 1rem 1rem 1rem; /* Extra top padding for buttons */
  border-radius: 0.5rem;
  overflow-x: auto;
  background: var(--code-bg, #1e1e1e);
  border: 1px solid var(--code-border, #333);
  font-family: 'Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  tab-size: 2;
}
.post-content pre code {
  display: block;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--code-text, #d4d4d4);
}
.post-content {
  --code-bg: #f8f8f8;
  --code-border: #e5e5e5;
  --code-text: #333;

  /* Syntax tokens - light theme */
  --code-comment: #6a737d;
  --code-keyword: #d73a49;
  --code-string: #032f62;
  --code-number: #005cc5;
  --code-function: #6f42c1;
  --code-class: #22863a;
  --code-variable: #e36209;
  --code-operator: #d73a49;
  --code-punctuation: #24292e;
  --code-tag: #22863a;
  --code-attr: #6f42c1;
  --code-builtin: #005cc5;
}
.dark .post-content {
  --code-bg: #1e1e1e;
  --code-border: #333;
  --code-text: #d4d4d4;

  /* Syntax tokens - dark theme */
  --code-comment: #6a9955;
  --code-keyword: #c586c0;
  --code-string: #ce9178;
  --code-number: #b5cea8;
  --code-function: #dcdcaa;
  --code-class: #4ec9b0;
  --code-variable: #9cdcfe;
  --code-operator: #d4d4d4;
  --code-punctuation: #d4d4d4;
  --code-tag: #569cd6;
  --code-attr: #9cdcfe;
  --code-builtin: #4ec9b0;
}
.hljs-comment,
.hljs-quote {
  color: var(--code-comment);
  font-style: italic;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-subst {
  color: var(--code-keyword);
  font-weight: 600;
}
.hljs-string,
.hljs-doctag,
.hljs-regexp {
  color: var(--code-string);
}
.hljs-number,
.hljs-literal,
.hljs-meta .hljs-string {
  color: var(--code-number);
}
.hljs-title,
.hljs-section,
.hljs-name,
.hljs-selector-id,
.hljs-selector-class {
  color: var(--code-function);
  font-weight: 600;
}
.hljs-type,
.hljs-class .hljs-title {
  color: var(--code-class);
}
.hljs-variable,
.hljs-template-variable,
.hljs-attr {
  color: var(--code-variable);
}
.hljs-params {
  color: var(--code-attr);
}
.hljs-built_in,
.hljs-builtin-name {
  color: var(--code-builtin);
}
.hljs-tag,
.hljs-meta-keyword {
  color: var(--code-tag);
}
.hljs-attribute {
  color: var(--code-attr);
}
.hljs-operator,
.hljs-symbol,
.hljs-bullet,
.hljs-link {
  color: var(--code-operator);
}
.hljs-punctuation {
  color: var(--code-punctuation);
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: 700;
}
.hljs-deletion {
  background: rgba(255, 0, 0, 0.1);
}
.hljs-addition {
  background: rgba(0, 255, 0, 0.1);
}
.post-content pre[data-language]::before {
  content: attr(data-language);
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--code-comment);
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  border-radius: 0.25rem;
  opacity: 0.6;
}
.tiptap pre {
  background: var(--code-bg);
  color: var(--code-text);
  font-family: 'Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--code-border);
}
.tiptap pre code {
  background: none;
  color: inherit;
  font-size: 0.875rem;
  padding: 0;
}
.post-content pre::-webkit-scrollbar,
.tiptap pre::-webkit-scrollbar {
  height: 8px;
}
.post-content pre::-webkit-scrollbar-track,
.tiptap pre::-webkit-scrollbar-track {
  background: var(--code-bg);
}
.post-content pre::-webkit-scrollbar-thumb,
.tiptap pre::-webkit-scrollbar-thumb {
  background: var(--code-border);
  border-radius: 4px;
}
.post-content pre::-webkit-scrollbar-thumb:hover,
.tiptap pre::-webkit-scrollbar-thumb:hover {
  background: var(--code-comment);
}
/* Code syntax highlighting theme - minimal & accessible */
/* Base code block styles */
/* Light theme variables */
/* Dark theme variables */
/* Highlight.js/lowlight token classes */
/* Code block with language label */
/* Editor-specific overrides */
/* Scrollbar for code blocks */
}
</style>
