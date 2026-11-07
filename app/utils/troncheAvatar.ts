export function troncheAvatarUrl(name: string, size = 64) {
  const subject = name.trim() || 'Guest'
  return `https://tronche.cc/api/avatar/${encodeURIComponent(subject)}?variant=marble&size=${size}`
}
