param(
  [ValidateSet("dev", "start")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

# Preserve any existing bypass entries and always bypass proxies for local app URLs.
$existingBypass = @($env:NO_PROXY, $env:no_proxy) |
  Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
  ForEach-Object { $_ -split "," }
$localBypass = @($existingBypass + @("localhost", "127.0.0.1", "::1")) |
  ForEach-Object { $_.Trim() } |
  Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
  Select-Object -Unique
$env:NO_PROXY = $localBypass -join ","
$env:no_proxy = $env:NO_PROXY

# Resolve localhost to IPv4 first so both localhost and 127.0.0.1 work while
# Next still logs the friendly localhost URL. Preserve an explicit user setting.
if ($env:NODE_OPTIONS -notmatch '(^|\s)--dns-result-order(?:=|\s)') {
  if ([string]::IsNullOrWhiteSpace($env:NODE_OPTIONS)) {
    $env:NODE_OPTIONS = "--dns-result-order=ipv4first"
  } else {
    $env:NODE_OPTIONS = "$($env:NODE_OPTIONS) --dns-result-order=ipv4first"
  }
}

pnpm exec next $Mode --hostname localhost --port 3001
exit $LASTEXITCODE
