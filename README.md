# DQM2 SP 中文怪兽手册

手机与电脑均可使用的静态网页：903 种怪物、配合查询、抗性、入手条件、攻略，以及覆盖 9 个世界分类、47 个地点的交互地图。

直接打开 index.html 即可使用。图像和数据已内嵌，首次加载约 11 MB。收藏与库存只保存在当前浏览器中。

## 修改与构建

安装 Node.js 后运行：

    node build.mjs

src/ 为界面源码；data.json 是包含怪物图片的固定资料快照。修改源码后重新构建 index.html。无需 npm 依赖、API 密钥或后端。

## 网站发布

Beta 测试网站：腾讯 https://www.dqm2sp-guide.cloud-ip.cc/ ，Cloudflare https://dqm2sp-guide.pages.dev/ ，GitHub https://dqm2sp-guide.github.io/ 。

三个入口都使用本仓库 main 分支。腾讯和 Cloudflare 自动运行 node build.mjs；GitHub Pages 从根目录发布已生成的 index.html。因此更新 data.json 或 src 后必须先构建并同时提交 index.html，三个入口才能一致。部署成功后生效，并非推送后立即同步。ClouDNS 仅负责腾讯入口的域名解析，不存放网站内容。

## 数据范围

中文名已进行分批校对，旧名和参考别名可以搜索；中文参考译名、编辑暂译和 SP 汉化实机定本不是同一概念，当前尚未对齐指定汉化定本。每条名称依据保留在 data.json 的 translationSources 中，统计见 meta.translationAudit。地图为非等比例方位示意，全部已收录地点可交互；玛尔塔、寄生木和特殊钥匙采用区域导航图。未绘制洞内各楼层，随机钥匙不具有统一固定地图。仅有世界级记录的怪物不会标成精确刷怪点。资料依据链接保留在应用中，数据尚未逐项经过游戏实机验证。

参考资料：GameWith、Game8、soshage.com 等，具体链接见数据记录。角色图像与游戏内容权利属于各自权利人，本仓库不授予这些内容的再许可。

本目录由 DQM2SP/tools/prepare-github.mjs 生成，不包含账号凭据、个人存档、Sites 部署配置或历史抓取文件。
