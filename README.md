# 亚当范画知识提取器

Next.js 前端通过同源 `/api/analyze` Route Handler 调用视觉模型。浏览器只把图片发给本地代理，API Key 仅从服务端环境变量读取，不会打包进前端。

## 本地运行

先复制环境变量模板并填写供应商 Key：

```bash
Copy-Item .env.example .env.local
```

选择火山引擎方舟时，设置 `AI_PROVIDER=ark`、`ARK_API_KEY` 和控制台中已启用视觉能力的推理接入点 `ARK_MODEL=ep-...`。选择智谱时设置 `AI_PROVIDER=zhipu` 和 `ZHIPU_API_KEY`；模型默认使用 `glm-4v`。Key 只写在 `.env.local`，绝不要放入 `NEXT_PUBLIC_*` 变量。

```bash
pnpm install
pnpm dev
```

打开终端输出的本地地址。环境变量变更后请重启开发服务器。生产构建与启动：

```bash
pnpm build
pnpm start
```

## 请求流程

- JPG、PNG 和内置 SVG 示例会在浏览器中缩放并转为 JPEG Base64，再 POST 到 `/api/analyze`。
- Route Handler 校验图片、读取服务端 Key、调用方舟或智谱 OpenAI 兼容的多模态 Chat Completions 接口，并验证模型 JSON 后返回 `{ ok: true, data }` 或 `{ ok: false, msg }`。
- “重新生成”会对当前图片重新请求所选模型。没有配置 Key、网络错误、额度错误、超时和非法模型响应都会显示在页面上。
- 页面不保存上传图片；点击生成后图片会转发给 `.env.local` 中选择的模型供应商。请按供应商的数据处理政策使用。
- `.env.local` 已由 `.gitignore` 排除；不要把真实 Key 提交到代码仓库。

## 测试完整链路

配置好 `.env.local` 并重启 `pnpm dev` 后，在页面点“使用示例图片”，再点“开始识别并生成”。示例 SVG 会先在浏览器本地转换为 JPEG；页面向本地 `/api/analyze` 发送 Base64，Route Handler 再调用你选择的视觉模型。成功后可编辑标题/正文，复制标签、全文，或点击“重新生成”再次调用模型。

未配置 Key 时，接口应返回 HTTP 503，页面显示 `.env.local` 配置提示；这用于确认代理与错误提示已连通。真实模型响应需要你自己的有效 API Key、模型权限及（方舟场景下）推理接入点。

## 多项目并行开发规范

本项目固定使用 `localhost:3001`。请通过 `pnpm dev` 或 `pnpm start` 启动；`scripts/run-next-local.ps1` 会显式传入端口 3001，并仅为本项目启动进程设置 `NO_PROXY` / `no_proxy`，使本机回环地址不经过 HTTP 代理。不要用 `taskkill /F /IM node.exe`，也不要按进程名批量结束 Node.js，因为其他项目可能正在运行。

遇到 `EADDRINUSE` 时，先在项目根目录运行以下命令。它只列出 3001 监听端口的进程；只有进程命令行明确包含当前项目目录时才会停止该进程。若显示“未找到命令行包含本项目路径的进程”，脚本会中止，不会碰其他项目；请检查输出并为实际占用该端口的其他项目另选端口。

```powershell
$projectRoot = (Resolve-Path .).Path.TrimEnd('\')
$listeners = @(Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -eq 0) {
  '3001 端口当前空闲。'
} else {
  $owners = foreach ($ownerId in ($listeners.OwningProcess | Sort-Object -Unique)) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerId"
    [pscustomobject]@{
      ProcessId = [int]$ownerId
      Name = $process.Name
      ExecutablePath = $process.ExecutablePath
      CommandLine = $process.CommandLine
      IsThisProject = ($process.CommandLine -and $process.CommandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0)
    }
  }
  $owners | Format-List
  $targetIds = @($owners | Where-Object IsThisProject | Select-Object -ExpandProperty ProcessId -Unique)
  if ($targetIds.Count -eq 0) {
    throw '未找到命令行包含本项目路径的进程；未停止任何进程。请核对上方信息，避免影响其他项目。'
  }
  foreach ($ownerId in $targetIds) { Stop-Process -Id $ownerId -Force }
  Start-Sleep -Milliseconds 800
  $remaining = @(Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)
  if ($remaining.Count -gt 0) {
    $remaining | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table -AutoSize
    throw '3001 仍被占用；请按上方 PID 重新核对进程，不要结束其他进程。'
  }
  '已释放本项目占用的 3001 端口。'
}
```

`ERR_CONNECTION_REFUSED` 或 `EADDRINUSE` 的标准三步救援动作：

1. 在项目根目录用上面的命令检查 3001；仅在 `IsThisProject : True` 时停止本项目监听进程，并确认命令最后显示端口已释放。
2. 在当前 PowerShell 会话清除代理环境变量，并给本机地址设置绕过代理（只影响当前终端，不改 Windows 全局代理，也不影响其他终端或项目）：

   ```powershell
   'HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy' |
     ForEach-Object { Remove-Item "Env:\$_" -ErrorAction SilentlyContinue }
   $env:NO_PROXY = 'localhost,127.0.0.1,::1'
   $env:no_proxy = $env:NO_PROXY
   ```

   本项目启动脚本也会把这些回环地址加入本项目进程的 `NO_PROXY`。如果浏览器配置了强制全局代理，请在浏览器/代理客户端的绕过列表加入 `localhost`、`127.0.0.1` 和 `::1`；终端环境变量不能覆盖浏览器自己的代理设置。检查终端变量是否设置时只输出状态，避免把代理 URL 或其中的凭据打印到终端：

   ```powershell
   'HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy' |
     ForEach-Object { [pscustomobject]@{ Name = $_; IsSet = -not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_, 'Process')) } }
   ```

3. 运行 `pnpm dev`，确认终端出现 `Local: http://localhost:3001`，然后访问该地址。若仍失败，保留该项目终端里的 Next.js 错误信息继续排查；不要结束其他端口上的 Node.js 进程。
