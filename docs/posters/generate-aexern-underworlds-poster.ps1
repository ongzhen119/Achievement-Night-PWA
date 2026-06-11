param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "aexern-underworlds-saturday-poster.png")
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$width = 1080
$height = 1920
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function C {
  param([string]$Hex, [int]$Alpha = 255)
  $hexValue = $Hex.TrimStart("#")
  $r = [Convert]::ToInt32($hexValue.Substring(0, 2), 16)
  $gValue = [Convert]::ToInt32($hexValue.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hexValue.Substring(4, 2), 16)
  [System.Drawing.Color]::FromArgb($Alpha, $r, $gValue, $b)
}

function Brush {
  param([string]$Hex, [int]$Alpha = 255)
  New-Object System.Drawing.SolidBrush (C $Hex $Alpha)
}

function PenC {
  param([string]$Hex, [float]$Size = 1, [int]$Alpha = 255)
  New-Object System.Drawing.Pen (C $Hex $Alpha), $Size
}

function FontP {
  param(
    [string]$Family,
    [float]$Size,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  New-Object -TypeName System.Drawing.Font -ArgumentList @(
    $Family,
    $Size,
    $Style,
    [System.Drawing.GraphicsUnit]::Pixel
  )
}

function RoundedPath {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $R * 2
  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $path
}

function FillRound {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R, [System.Drawing.Brush]$Brush)
  $path = RoundedPath $X $Y $W $H $R
  $script:g.FillPath($Brush, $path)
  $path.Dispose()
}

function StrokeRound {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R, [System.Drawing.Pen]$Pen)
  $path = RoundedPath $X $Y $W $H $R
  $script:g.DrawPath($Pen, $path)
  $path.Dispose()
}

function Text {
  param(
    [string]$Value,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [System.Drawing.StringAlignment]$Align = [System.Drawing.StringAlignment]::Near,
    [System.Drawing.StringAlignment]$LineAlign = [System.Drawing.StringAlignment]::Near
  )
  $rect = New-Object System.Drawing.RectangleF $X, $Y, $W, $H
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = $Align
  $format.LineAlignment = $LineAlign
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $format.FormatFlags = 0
  $script:g.DrawString($Value, $Font, $Brush, $rect, $format)
  $format.Dispose()
}

function TextHeight {
  param([string]$Value, [System.Drawing.Font]$Font, [float]$W)
  $format = New-Object System.Drawing.StringFormat
  $layout = New-Object System.Drawing.SizeF $W, 2000
  $size = $script:g.MeasureString($Value, $Font, $layout, $format)
  $format.Dispose()
  $size.Height
}

function Progress {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$Percent)
  FillRound $X $Y $W $H ($H / 2) (Brush "#0c0a09" 210)
  StrokeRound $X $Y $W $H ($H / 2) (PenC "#d8a747" 1 60)
  $barW = [Math]::Max(8, $W * $Percent)
  $rect = New-Object System.Drawing.RectangleF $X, $Y, $barW, $H
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (C "#7f986f"), (C "#e56a2e"), 0
  FillRound $X $Y $barW $H ($H / 2) $grad
  $grad.Dispose()
}

function Card {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R = 20)
  $rect = New-Object System.Drawing.RectangleF $X, $Y, $W, $H
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (C "#2b241f" 246), (C "#1c1815" 250), 135
  FillRound $X $Y $W $H $R $grad
  $grad.Dispose()
  StrokeRound $X $Y $W $H $R (PenC "#d8a747" 1.6 58)
}

function Draw-DiceIcon {
  param([float]$X, [float]$Y, [float]$S)
  FillRound $X $Y $S $S 9 (Brush "#d8a747" 235)
  StrokeRound $X $Y $S $S 9 (PenC "#fff1c9" 1 170)
  $dot = Brush "#25180d"
  foreach ($p in @(
      @(($X + $S * .28), ($Y + $S * .28)),
      @(($X + $S * .72), ($Y + $S * .28)),
      @(($X + $S * .50), ($Y + $S * .50)),
      @(($X + $S * .28), ($Y + $S * .72)),
      @(($X + $S * .72), ($Y + $S * .72))
    )) {
    $script:g.FillEllipse($dot, [float]($p[0] - 3.8), [float]($p[1] - 3.8), 7.6, 7.6)
  }
}

function Draw-BookIcon {
  param([float]$X, [float]$Y, [float]$S)
  FillRound $X $Y $S $S 9 (Brush "#7f986f" 220)
  $pen = PenC "#fff1c9" 3 230
  $script:g.DrawLine($pen, $X + $S * .32, $Y + $S * .22, $X + $S * .32, $Y + $S * .78)
  $script:g.DrawRectangle($pen, $X + $S * .20, $Y + $S * .22, $S * .60, $S * .56)
  $script:g.DrawLine($pen, $X + $S * .43, $Y + $S * .34, $X + $S * .70, $Y + $S * .34)
  $script:g.DrawLine($pen, $X + $S * .43, $Y + $S * .49, $X + $S * .70, $Y + $S * .49)
}

function Draw-TrophyIcon {
  param([float]$X, [float]$Y, [float]$S)
  FillRound $X $Y $S $S 9 (Brush "#e56a2e" 210)
  $pen = PenC "#ffe0a2" 3 240
  $brush = Brush "#ffe0a2" 235
  $script:g.FillPie(
    $brush,
    [float]($X + $S * .30),
    [float]($Y + $S * .25),
    [float]($S * .40),
    [float]($S * .30),
    0,
    180
  )
  $script:g.DrawArc($pen, $X + $S * .18, $Y + $S * .28, $S * .28, $S * .28, 90, 120)
  $script:g.DrawArc($pen, $X + $S * .54, $Y + $S * .28, $S * .28, $S * .28, -30, 120)
  $script:g.DrawLine($pen, $X + $S * .50, $Y + $S * .53, $X + $S * .50, $Y + $S * .70)
  $script:g.DrawLine($pen, $X + $S * .36, $Y + $S * .72, $X + $S * .64, $Y + $S * .72)
}

function AchievementRow {
  param(
    [float]$X,
    [float]$Y,
    [float]$W,
    [string]$Label,
    [bool]$Done
  )
  $h = 50
  if ($Done) {
    FillRound $X $Y $W $h 12 (Brush "#4a341f" 235)
    StrokeRound $X $Y $W $h 12 (PenC "#d8a747" 1.4 155)
  } else {
    FillRound $X $Y $W $h 12 (Brush "#0f0d0c" 175)
    StrokeRound $X $Y $W $h 12 (PenC "#d4bd8c" 1.1 42)
  }
  $iconBrush = if ($Done) { Brush "#d8a747" } else { Brush "#b5a99a" 190 }
  $pen = if ($Done) { PenC "#d8a747" 2.5 235 } else { PenC "#b5a99a" 2.2 145 }
  $script:g.DrawEllipse($pen, $X + 16, $Y + 15, 20, 20)
  if ($Done) {
    $script:g.DrawLine($pen, $X + 21, $Y + 25, $X + 26, $Y + 31)
    $script:g.DrawLine($pen, $X + 26, $Y + 31, $X + 36, $Y + 19)
  }
  Text $Label (FontP "Noto Sans SC" 18 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($X + 50) ($Y + 11) ($W - 64) 30
}

function RankRow {
  param(
    [float]$X,
    [float]$Y,
    [float]$W,
    [string]$Rank,
    [string]$Name,
    [string]$Warband,
    [string]$Score,
    [float]$Percent
  )
  FillRound $X $Y $W 74 13 (Brush "#0f0d0c" 170)
  StrokeRound $X $Y $W 74 13 (PenC "#d4bd8c" 1.1 45)
  FillRound ($X + 14) ($Y + 14) 46 46 10 (Brush "#d8a747" 240)
  Text $Rank (FontP "Noto Sans SC" 18 ([System.Drawing.FontStyle]::Bold)) (Brush "#24180c") ($X + 14) ($Y + 25) 46 24 ([System.Drawing.StringAlignment]::Center)
  Text $Name (FontP "Noto Sans SC" 20 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($X + 74) ($Y + 11) ($W - 174) 26
  Text $Warband (FontP "Noto Sans SC" 14) (Brush "#b5a99a") ($X + 74) ($Y + 38) ($W - 174) 22
  Text $Score (FontP "Noto Sans SC" 19 ([System.Drawing.FontStyle]::Bold)) (Brush "#ffe0a2") ($X + $W - 96) ($Y + 17) 78 26 ([System.Drawing.StringAlignment]::Far)
  Progress ($X + 74) ($Y + 61) ($W - 96) 6 $Percent
}

function Draw-JoinPhone {
  param([float]$X, [float]$Y, [float]$W, [float]$H)
  FillRound $X $Y $W $H 34 (Brush "#0b0908")
  StrokeRound $X $Y $W $H 34 (PenC "#d8a747" 2 75)
  FillRound ($X + 14) ($Y + 14) ($W - 28) ($H - 28) 24 (Brush "#171411")
  $sx = $X + 31
  $sy = $Y + 32
  $sw = $W - 62
  Text "Achievement" (FontP "Noto Serif SC" 23 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") $sx $sy $sw 32
  Text "Weekly tabletop event" (FontP "Noto Sans SC" 13 ([System.Drawing.FontStyle]::Bold)) (Brush "#d8a747") $sx ($sy + 38) $sw 22
  Card $sx ($sy + 69) $sw 126 18
  Text "AeXern Achievement" (FontP "Noto Sans SC" 19 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($sx + 16) ($sy + 86) ($sw - 32) 50
  Text "Saturday · 2:00pm - 6:00pm" (FontP "Noto Sans SC" 13) (Brush "#f3dfb8") ($sx + 16) ($sy + 141) ($sw - 32) 22
  Text "Claim achievements while you play." (FontP "Noto Sans SC" 12) (Brush "#b5a99a") ($sx + 16) ($sy + 165) ($sw - 32) 20

  $fy = $sy + 222
  foreach ($label in @("Join code", "Player name", "Warband")) {
    Text $label (FontP "Noto Sans SC" 13 ([System.Drawing.FontStyle]::Bold)) (Brush "#f3dfb8") $sx $fy $sw 18
    FillRound $sx ($fy + 22) $sw 39 10 (Brush "#100d0b" 210)
    StrokeRound $sx ($fy + 22) $sw 39 10 (PenC "#d4bd8c" 1 70)
    $fy += 67
  }
  FillRound $sx ($fy + 6) $sw 48 13 (Brush "#d8a747" 245)
  Text "Enter the Arena" (FontP "Noto Sans SC" 17 ([System.Drawing.FontStyle]::Bold)) (Brush "#23180d") $sx ($fy + 20) $sw 24 ([System.Drawing.StringAlignment]::Center)
  FillRound $sx ($fy + 68) $sw 42 12 (Brush "#692622" 92)
  Text "Honour system · Casual tracker" (FontP "Noto Sans SC" 12 ([System.Drawing.FontStyle]::Bold)) (Brush "#ffe0a2") ($sx + 10) ($fy + 80) ($sw - 20) 18
}

function Draw-ChecklistUI {
  param([float]$X, [float]$Y, [float]$W, [float]$H)
  Card $X $Y $W $H 22
  Text "APP UI · ACHIEVEMENTS" (FontP "Noto Sans SC" 14 ([System.Drawing.FontStyle]::Bold)) (Brush "#d8a747") ($X + 24) ($Y + 22) ($W - 48) 23
  Text "Achievement Checklist" (FontP "Noto Serif SC" 29 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($X + 24) ($Y + 53) ($W - 48) 45
  FillRound ($X + 24) ($Y + 110) ($W - 48) 88 14 (Brush "#100d0b" 120)
  Text "Raven Pilot" (FontP "Noto Sans SC" 22 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($X + 42) ($Y + 126) 190 26
  Text "Steelheart's Guard" (FontP "Noto Sans SC" 15) (Brush "#b5a99a") ($X + 42) ($Y + 155) 190 24
  Text "7/16" (FontP "Noto Sans SC" 25 ([System.Drawing.FontStyle]::Bold)) (Brush "#ffe0a2") ($X + $W - 135) ($Y + 126) 88 30 ([System.Drawing.StringAlignment]::Far)
  Text "Rising Challenger" (FontP "Noto Sans SC" 14) (Brush "#d6c1a0") ($X + $W - 178) ($Y + 158) 132 22 ([System.Drawing.StringAlignment]::Far)
  Progress ($X + 42) ($Y + 183) ($W - 84) 8 .44
  Text "First Steps · 3/4 claimed" (FontP "Noto Sans SC" 17 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff1c9") ($X + 24) ($Y + 220) ($W - 48) 28
  AchievementRow ($X + 24) ($Y + 257) ($W - 48) "Complete your first game" $true
  AchievementRow ($X + 24) ($Y + 316) ($W - 48) "Make a successful move" $true
  AchievementRow ($X + 24) ($Y + 375) ($W - 48) "Gain your first glory" $false
}

function Draw-RankingUI {
  param([float]$X, [float]$Y, [float]$W, [float]$H)
  Card $X $Y $W $H 22
  Text "APP UI · LIVE RANKING" (FontP "Noto Sans SC" 14 ([System.Drawing.FontStyle]::Bold)) (Brush "#d8a747") ($X + 24) ($Y + 22) ($W - 48) 23
  Text "Achievement Ranking" (FontP "Noto Serif SC" 27 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($X + 24) ($Y + 52) ($W - 48) 74
  RankRow ($X + 24) ($Y + 132) ($W - 48) "#1" "Wei" "Mollog's Mob" "13 pts" .81
  RankRow ($X + 24) ($Y + 216) ($W - 48) "#2" "Mei" "Stormcoven" "10 pts" .63
  RankRow ($X + 24) ($Y + 300) ($W - 48) "#3" "Alex" "Sepulchral Guard" "7 pts" .44
  Text "Honour System · Play for the story" (FontP "Noto Sans SC" 13) (Brush "#d6c1a0") ($X + 24) ($Y + $H - 36) ($W - 48) 24 ([System.Drawing.StringAlignment]::Center)
}

function Draw-Bullet {
  param(
    [float]$X,
    [float]$Y,
    [string]$Kind,
    [string]$Title,
    [string]$Sub,
    [float]$TextWidth = 770
  )
  if ($Kind -eq "dice") {
    Draw-DiceIcon $X $Y 54
  } elseif ($Kind -eq "book") {
    Draw-BookIcon $X $Y 54
  } else {
    Draw-TrophyIcon $X $Y 54
  }
  Text $Title (FontP "Noto Sans SC" 20 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") ($X + 76) ($Y - 3) $TextWidth 56
  Text $Sub (FontP "Noto Sans SC" 18) (Brush "#d6c1a0") ($X + 76) ($Y + 54) $TextWidth 46
}

try {
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 0, 0, $width, $height), (C "#171411"), (C "#2a1715"), 35
  $g.FillRectangle($bg, 0, 0, $width, $height)
  $bg.Dispose()

  $gridPen = PenC "#ffffff" 1 9
  for ($x = 0; $x -lt $width; $x += 38) {
    $g.DrawLine($gridPen, $x, 0, $x, $height)
  }
  for ($y = 0; $y -lt $height; $y += 38) {
    $g.DrawLine($gridPen, 0, $y, $width, $y)
  }

  $halo = New-Object System.Drawing.Drawing2D.GraphicsPath
  $halo.AddEllipse(-180, 110, 760, 760)
  $pathBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $halo
  $pathBrush.CenterColor = C "#e56a2e" 72
  $pathBrush.SurroundColors = [System.Drawing.Color[]]@(C "#171411" 0)
  $g.FillPath($pathBrush, $halo)
  $pathBrush.Dispose()
  $halo.Dispose()

  $rng = New-Object System.Random 42
  for ($i = 0; $i -lt 115; $i++) {
    $px = $rng.Next(24, $width - 24)
    $py = $rng.Next(70, $height - 70)
    $s = $rng.Next(2, 7)
    $alpha = $rng.Next(28, 115)
    $g.FillEllipse((Brush "#e56a2e" $alpha), $px, $py, $s, $s)
  }

  StrokeRound 46 46 988 1828 28 (PenC "#d8a747" 2 80)
  StrokeRound 64 64 952 1792 18 (PenC "#d8a747" 1 35)

  Text "CASUAL TABLETOP EVENT · BEGINNER FRIENDLY" (FontP "Noto Sans SC" 20 ([System.Drawing.FontStyle]::Bold)) (Brush "#d8a747") 78 74 900 30
  Text "Warhammer Underworlds @ AeXern" (FontP "Noto Serif SC" 43 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") 76 126 928 70
  Text "This Saturday!" (FontP "Noto Serif SC" 50 ([System.Drawing.FontStyle]::Bold)) (Brush "#ffe0a2") 76 205 928 66
  Text "星期六 AeXern 战锤 Underworlds！" (FontP "Noto Serif SC" 33 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff1c9") 76 286 928 48

  FillRound 76 358 928 98 18 (Brush "#100d0b" 155)
  StrokeRound 76 358 928 98 18 (PenC "#e56a2e" 1.5 110)
  Text "Saturday · 2:00pm - 6:00pm" (FontP "Noto Sans SC" 28 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") 108 383 520 38
  Text "星期六，下午 2:00 - 6:00" (FontP "Noto Sans SC" 26 ([System.Drawing.FontStyle]::Bold)) (Brush "#d6c1a0") 636 384 326 38 ([System.Drawing.StringAlignment]::Far)

  Text "We'll be playing this Saturday from 2:00pm - 6:00pm." (FontP "Noto Sans SC" 22) (Brush "#d6c1a0") 78 486 548 62
  Text "时间：星期六，下午 2:00 - 6:00" (FontP "Noto Sans SC" 23 ([System.Drawing.FontStyle]::Bold)) (Brush "#f3dfb8") 78 550 548 42

  Draw-JoinPhone 662 486 314 584

  Card 76 632 548 470 22
  Text "This session is beginner-friendly, so you can:" (FontP "Noto Sans SC" 23 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") 108 666 488 62
  Text "新手也欢迎，可以过来：" (FontP "Noto Sans SC" 25 ([System.Drawing.FontStyle]::Bold)) (Brush "#ffe0a2") 108 728 488 42

  Draw-Bullet 108 790 "dice" "Play casual games" "休闲对战" 390
  Draw-Bullet 108 896 "book" "Learn the game or try a short demo" "学习规则或试玩教学" 390
  Draw-Bullet 108 1002 "trophy" "Use the Achievement App: complete fun challenges while playing" "使用 Achievement App，一边玩一边完成成就挑战" 390

  FillRound 76 1124 928 146 18 (Brush "#692622" 95)
  StrokeRound 76 1124 928 146 18 (PenC "#e56a2e" 1.4 100)
  Text "No need to be competitive — just come, roll dice, learn, and collect achievements." (FontP "Noto Sans SC" 23 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") 112 1148 856 62
  Text "不用有压力，不需要很强才来。过来玩、学习、丢骰子、解锁成就就可以了！" (FontP "Noto Sans SC" 23) (Brush "#f3dfb8") 112 1212 856 42

  Draw-ChecklistUI 76 1294 444 420
  Draw-RankingUI 560 1294 444 420

  FillRound 76 1738 928 104 18 (Brush "#100d0b" 160)
  StrokeRound 76 1738 928 104 18 (PenC "#d8a747" 1.5 78)
  Text "AeXern" (FontP "Noto Serif SC" 42 ([System.Drawing.FontStyle]::Bold)) (Brush "#ffe0a2") 116 1759 230 50
  Text "Saturday, 2:00pm - 6:00pm" (FontP "Noto Sans SC" 29 ([System.Drawing.FontStyle]::Bold)) (Brush "#fff6e6") 360 1761 590 40 ([System.Drawing.StringAlignment]::Far)
  Text "星期六，下午 2:00 - 6:00" (FontP "Noto Sans SC" 25) (Brush "#d6c1a0") 360 1799 590 34 ([System.Drawing.StringAlignment]::Far)

  Text "Achievement App · scan the event link, tick achievements, view the live ranking" (FontP "Noto Sans SC" 18 ([System.Drawing.FontStyle]::Bold)) (Brush "#b5a99a") 84 1850 912 26 ([System.Drawing.StringAlignment]::Center)

  $outputDir = Split-Path -Parent $OutputPath
  if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  }
  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output $OutputPath
} finally {
  $g.Dispose()
  $bitmap.Dispose()
}
