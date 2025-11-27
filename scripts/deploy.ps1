param(
    [Parameter(Position = 0)]
    [string]$Message,

    [switch]$SkipChecks,
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Label,
        [ScriptBlock]$Action
    )

    Write-Host "`n==> $Label" -ForegroundColor Cyan
    & $Action
}

function Ensure-Command {
    param(
        [string]$CommandName,
        [string]$InstallHint
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Comando '$CommandName' não encontrado. $InstallHint"
    }
}

function Get-AutoCommitMessage {
    $statusLines = git status --short
    if (-not $statusLines) {
        return 'chore: atualizar workspace'
    }

    $filePaths = @()
    foreach ($line in $statusLines) {
        $trimmed = $line.Trim()
        if (-not $trimmed) { continue }
        if ($trimmed -match '^[A-Z\?]{1,2}\s+(?<path>.+)$') {
            $path = $Matches['path']
            if ($path -match '->\s*(.+)$') {
                $path = $Matches[1]
            }
            $filePaths += $path.Trim()
        }
    }

    if (-not $filePaths.Count) {
        return 'chore: atualizar workspace'
    }

    $uniquePaths = @($filePaths | Select-Object -Unique)
    if ($uniquePaths.Count -eq 1) {
        $target = $uniquePaths[0].Replace('\\', '/').Trim()
        if (-not $target) { $target = 'workspace' }
        return "chore: atualizar $target"
    }

    $areas = @($uniquePaths | ForEach-Object {
        $clean = $_.Replace('\\', '/').Trim()
        if ($clean -match '^src/components/([^/]+)') {
            "componentes/$($Matches[1])"
        } elseif ($clean -match '^src/([^/]+)') {
            "src/$($Matches[1])"
        } elseif ($clean -match '^supabase/([^/]+)') {
            "supabase/$($Matches[1])"
        } else {
            ($clean.Split('/')[0])
        }
    } | Where-Object { $_ } | Select-Object -Unique)

    if ($null -eq $areas) {
        $areas = @()
    } elseif ($areas -is [string]) {
        $areas = @($areas)
    }

    if ($areas.Count -eq 1) {
        return "chore: atualizar $($areas[0])"
    }

    return "chore: atualizar $($areas.Count) áreas"
}

Ensure-Command -CommandName "git" -InstallHint "Instale o Git e tente novamente."
Ensure-Command -CommandName "npm" -InstallHint "Instale o Node.js/NPM e tente novamente."
Ensure-Command -CommandName "vercel" -InstallHint "Instale o Vercel CLI (npm i -g vercel) e execute 'vercel login'."

Invoke-Step "Verificando estado do repositório" {
    $status = git status -sb
    Write-Host $status
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Get-AutoCommitMessage
    Write-Host "Mensagem de commit automática: $Message" -ForegroundColor Green
}

if (-not $SkipChecks) {
    Invoke-Step "Executando lint" { npm run lint }
    Invoke-Step "Executando build" { npm run build }
} else {
    Write-Host "Lint/Build ignorados (--SkipChecks)." -ForegroundColor Yellow
}

Invoke-Step "Adicionando arquivos" {
    git add -A
}

$hasChanges = git diff --cached --quiet; $exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Host "Nenhuma alteração para commitar." -ForegroundColor Yellow
} else {
    Invoke-Step "Criando commit" {
        git commit -m $Message
    }

    Invoke-Step "Enviando para origin" {
        git push
    }
}

if (-not $SkipDeploy) {
    Invoke-Step "Publicando no Vercel" {
        vercel deploy --prod
    }
} else {
    Write-Host "Deploy no Vercel ignorado (--SkipDeploy)." -ForegroundColor Yellow
}

Write-Host "`nProcesso concluído." -ForegroundColor Green
