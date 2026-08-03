param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\client\public\social")
)

Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logoPath = Join-Path $projectRoot "client\public\brand\eksaha-social-card.png"
$outputPath = [IO.Path]::GetFullPath($OutputDirectory)
$expectedParent = [IO.Path]::GetFullPath((Join-Path $projectRoot "client\public"))

if (-not $outputPath.StartsWith($expectedParent + [IO.Path]::DirectorySeparatorChar)) {
  throw "The social-card output must stay inside client/public."
}

[IO.Directory]::CreateDirectory($outputPath) | Out-Null

$cards = @(
  @{ File = "home.png"; Eyebrow = "ONE DIGITAL TEAM"; Title = "SEO, Web, Ads & IT Support"; Accent = "#12B8AE" },
  @{ File = "services-seo.png"; Eyebrow = "SEO SERVICES"; Title = "Search visibility that compounds"; Accent = "#12B8AE" },
  @{ File = "services-web.png"; Eyebrow = "WEB SERVICES"; Title = "Fast websites built to convert"; Accent = "#3B82F6" },
  @{ File = "services-ads.png"; Eyebrow = "DIGITAL ADVERTISING"; Title = "Paid campaigns with clear returns"; Accent = "#8B5CF6" },
  @{ File = "services-it-support.png"; Eyebrow = "MANAGED IT SUPPORT"; Title = "Practical support that keeps teams moving"; Accent = "#F59E0B" },
  @{ File = "pricing.png"; Eyebrow = "FLEXIBLE PRICING"; Title = "Senior digital expertise, one subscription"; Accent = "#12B8AE" },
  @{ File = "about.png"; Eyebrow = "ABOUT EKSAHA"; Title = "A senior digital team on demand"; Accent = "#3B82F6" },
  @{ File = "insights.png"; Eyebrow = "EKSAHA INSIGHTS"; Title = "Practical guides for digital growth"; Accent = "#8B5CF6" },
  @{ File = "contact.png"; Eyebrow = "LET'S TALK"; Title = "Move your next digital priority forward"; Accent = "#F59E0B" },
  @{ File = "insight-technical-seo-checklist.png"; Eyebrow = "SEO INSIGHT"; Title = "The technical SEO checklist we use before every launch"; Accent = "#12B8AE" },
  @{ File = "insight-subscription-digital-team.png"; Eyebrow = "STRATEGY INSIGHT"; Title = "When a subscription digital team makes sense"; Accent = "#3B82F6" },
  @{ File = "insight-saas-landing-page.png"; Eyebrow = "WEB INSIGHT"; Title = "Seven signals your landing page is leaking demand"; Accent = "#8B5CF6" }
)

$logo = [Drawing.Image]::FromFile($logoPath)
$background = [Drawing.ColorTranslator]::FromHtml("#F6FAF9")
$navy = [Drawing.ColorTranslator]::FromHtml("#082550")
$muted = [Drawing.ColorTranslator]::FromHtml("#49637D")

try {
  foreach ($card in $cards) {
    $bitmap = New-Object Drawing.Bitmap 1200, 630
    $bitmap.SetResolution(96, 96)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)

    try {
      $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
      $graphics.Clear($background)

      $accent = [Drawing.ColorTranslator]::FromHtml($card.Accent)
      $accentBrush = New-Object Drawing.SolidBrush $accent
      $navyBrush = New-Object Drawing.SolidBrush $navy
      $mutedBrush = New-Object Drawing.SolidBrush $muted
      $eyebrowFont = New-Object Drawing.Font "Arial", 18, ([Drawing.FontStyle]::Bold)
      $titleFont = New-Object Drawing.Font "Arial", 43, ([Drawing.FontStyle]::Bold)
      $footerFont = New-Object Drawing.Font "Arial", 17, ([Drawing.FontStyle]::Regular)

      try {
        $graphics.FillRectangle($accentBrush, 0, 0, 18, 630)
        $graphics.FillEllipse($accentBrush, 1040, -115, 310, 310)
        $graphics.FillEllipse($navyBrush, 1090, 505, 180, 180)

        $logoWidth = 310
        $logoHeight = [int]($logo.Height * ($logoWidth / $logo.Width))
        $graphics.DrawImage($logo, 72, 58, $logoWidth, $logoHeight)

        $graphics.DrawString($card.Eyebrow, $eyebrowFont, $accentBrush, 76, 210)
        $titleBox = New-Object Drawing.RectangleF 72, 257, 970, 210
        $graphics.DrawString($card.Title, $titleFont, $navyBrush, $titleBox)
        $graphics.DrawString("eksaha.com", $footerFont, $mutedBrush, 76, 548)

        $destination = Join-Path $outputPath $card.File
        $bitmap.Save($destination, [Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $accentBrush.Dispose()
        $navyBrush.Dispose()
        $mutedBrush.Dispose()
        $eyebrowFont.Dispose()
        $titleFont.Dispose()
        $footerFont.Dispose()
      }
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
} finally {
  $logo.Dispose()
}

Write-Output "Generated $($cards.Count) social cards in $outputPath"
