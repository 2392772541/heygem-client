$url = 'https://github.com/duixcom/Duix-Avatar/releases/download/v1.0.6/Duix.Avatar-1.0.6-setup.exe'
$dest = 'D:\HeyGem-install\Duix.Avatar-1.0.6-setup.exe'

if (Test-Path $dest) {
  Remove-Item $dest -Force
}

$head = Invoke-WebRequest -Uri $url -Method Head -MaximumRedirection 5
$length = [int64]$head.Headers['Content-Length']
$chunkSize = 8MB

$fs = [System.IO.File]::Open(
  $dest,
  [System.IO.FileMode]::Create,
  [System.IO.FileAccess]::Write,
  [System.IO.FileShare]::Read
)

try {
  for ($start = 0; $start -lt $length; $start += $chunkSize) {
    $end = [Math]::Min($start + $chunkSize - 1, $length - 1)
    $success = $false

    for ($attempt = 1; $attempt -le 5 -and -not $success; $attempt++) {
      try {
        $req = [System.Net.HttpWebRequest]::Create($url)
        $req.Method = 'GET'
        $req.AddRange($start, $end)
        $req.Timeout = 300000

        $resp = $req.GetResponse()
        $stream = $resp.GetResponseStream()
        $buffer = New-Object byte[] 65536

        while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
          $fs.Write($buffer, 0, $read)
        }

        $stream.Close()
        $resp.Close()
        $success = $true
        Write-Output "Downloaded bytes $start-$end"
      } catch {
        if ($attempt -eq 5) {
          throw
        }

        Start-Sleep -Seconds 2
      }
    }
  }
} finally {
  $fs.Close()
}

Get-Item $dest | Select-Object FullName, Length
