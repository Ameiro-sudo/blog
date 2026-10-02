// 注销过渡 shim（2026-08-22 Nuxt 迁移补）：旧版站点 Service Worker 的自注销入口。
// 老访客浏览器里已装的 SW 检测到本文件后：立即接管 -> 自注销 -> 清空全部缓存 ->
// 刷新已打开页面。此后站点再无 SW，本文件保留一段时间后可择期移除。
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        try {
          await client.navigate(client.url);
        } catch (_) {
          // navigate 对部分不可导航客户端会抛错，忽略即可（下次访问自然走无 SW 路径）
        }
      }
    })()
  );
});
