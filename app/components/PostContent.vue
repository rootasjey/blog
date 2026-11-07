<template>
  <PostEditor
    v-if="editable"
    :content="content"
    :ai-enabled="aiEnabled"
    :ai-loading="aiLoading"
    :on-ai-command="onAiCommand"
    :on-configure-models="onConfigureModels"
    @update:content="forwardContent"
    @editor-ready="forwardEditor"
  />
  <PostViewer v-else :content="content" />
</template>

<script setup lang="ts">
import PostEditor from './editor/PostEditor.vue'
import PostViewer from './editor/PostViewer.vue'
import type { AICommand } from '~/composables/useAIWriter'

interface Props {
  content: string | object
  editable?: boolean
  aiEnabled?: boolean
  aiLoading?: boolean
  onAiCommand?: (action: AICommand) => void
  onConfigureModels?: () => void
}

withDefaults(defineProps<Props>(), {
  editable: false,
  aiEnabled: false,
  aiLoading: false,
  onAiCommand: undefined,
  onConfigureModels: undefined,
})
const emit = defineEmits<{ 'update:content': [json: object]; 'editor-ready': [editor: any] }>()

function forwardContent(json: object) { emit('update:content', json) }
function forwardEditor(ed: any) { emit('editor-ready', ed) }
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-post-content .post-content { color: var(--site-color-text); font-family: var(--site-font-body); font-size: 16px; line-height: 1.7; }
.site-shell .site-post-content .post-content > .ProseMirror { max-width: none; color: var(--site-color-text); font-family: var(--site-font-body); font-size: 16px; line-height: 1.7; }
.site-shell .site-post-content .post-content .ProseMirror p { margin-block: 0 24px; color: var(--site-color-text); font-family: var(--site-font-body); font-size: 16px; line-height: 1.7; }
.site-shell .site-post-content .post-content .ProseMirror li { color: var(--site-color-text); font-family: var(--site-font-body); font-size: 16px; font-weight: 400; line-height: 1.7; }
.site-shell .site-post-content .post-content .ProseMirror h1 { margin-block: 48px 20px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 28px; font-weight: 550; letter-spacing: 0; line-height: 1.3; }
.site-shell .site-post-content .post-content .ProseMirror h2 { margin-block: 40px 18px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 20px; font-weight: 550; letter-spacing: 0; line-height: 1.4; }
.site-shell .site-post-content .post-content .ProseMirror h3 { margin-block: 32px 16px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 18px; font-weight: 550; letter-spacing: 0; line-height: 1.45; }
.site-shell .site-post-content .post-content .ProseMirror h4 { margin-block: 28px 14px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 16px; font-weight: 600; letter-spacing: 0; line-height: 1.5; }
.site-shell .site-post-content .post-content .ProseMirror ul,
.site-shell .site-post-content .post-content .ProseMirror ol { margin-block: 0 24px; padding-inline-start: 24px; }
.site-shell .site-post-content .post-content .ProseMirror blockquote { margin-block: 32px; border-color: var(--site-color-accent); background: transparent; color: var(--site-color-muted); font-family: var(--site-font-body); font-size: 18px; line-height: 1.6; }
.site-shell .site-post-content .post-content h1,
.site-shell .site-post-content .post-content h2,
.site-shell .site-post-content .post-content h3 { color: var(--site-color-heading); font-family: var(--site-font-body); font-weight: 550; letter-spacing: 0; }
.site-shell .site-post-content .post-content p { margin-block: 0 24px; font-size: 16px; line-height: 1.7; }
.site-shell .site-post-content .post-content a {
  color: var(--site-color-accent);
  text-decoration-line: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.2em;
  transition: color 160ms ease;
}
.site-shell .site-post-content .post-content a:hover { color: var(--site-color-heading); }
.site-shell .site-post-content .post-content blockquote { border-color: var(--site-color-accent); background: transparent; color: var(--site-color-muted); }
.site-shell .site-post-content .post-content img { border-radius: var(--site-radius-inline-media); }
.post-content figure.image-figure--full-bleed { width: 100vw; max-width: none; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); padding-inline: 16px; box-sizing: border-box; }
.post-content figure.image-figure--full-bleed img { width: 100%; max-width: none; margin: 0; border-radius: 0; }
}
</style>
