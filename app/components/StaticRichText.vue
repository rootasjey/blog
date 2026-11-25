<script lang="ts">
import { defineComponent, h, type PropType, type VNodeChild } from 'vue'
import { isSafeStaticRichTextHref, normalizeStaticRichText, type StaticRichTextMark, type StaticRichTextNode, type StaticRichTextValue } from '~~/shared/types/static-rich-text'

function renderNode(node: StaticRichTextNode, key: number | string): VNodeChild {
  if (node.type === 'text') {
    let child: VNodeChild = node.text || ''
    for (const mark of node.marks || []) child = renderMark(child, mark)
    return h('span', { key }, [child])
  }
  if (node.type === 'hardBreak') return h('br', { key })

  const tag = node.type === 'bulletList' ? 'ul'
    : node.type === 'orderedList' ? 'ol'
      : node.type === 'listItem' ? 'li' : 'p'
  return h(tag, { key }, (node.content || []).map((child, index) => renderNode(child, index)))
}

function renderMark(child: VNodeChild, mark: StaticRichTextMark): VNodeChild {
  if (mark.type === 'link') return isSafeStaticRichTextHref(mark.attrs?.href)
    ? h('a', { href: mark.attrs.href, rel: /^https?:/i.test(mark.attrs.href) ? 'noopener noreferrer' : undefined }, [child])
    : child
  const tag = mark.type === 'bold' ? 'strong' : mark.type === 'italic' ? 'em' : 's'
  return h(tag, [child])
}

export default defineComponent({
  name: 'StaticRichText',
  props: { content: { type: [String, Object] as PropType<StaticRichTextValue>, required: true } },
  setup(props) {
    return () => {
      const doc = normalizeStaticRichText(props.content)
      return h('div', { class: 'static-rich-text' }, (doc.content || []).map((node, index) => renderNode(node, index)))
    }
  },
})
</script>
