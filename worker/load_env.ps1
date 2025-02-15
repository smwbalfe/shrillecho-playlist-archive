Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $Matches[1].Trim()
        $value = $Matches[2].Trim()
        if ($name -and $value) {
            Set-Item -Path "env:$name" -Value $value
        }
    }
}