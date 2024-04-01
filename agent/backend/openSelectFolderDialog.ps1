Add-Type -AssemblyName System.Windows.Forms
$x = New-Object -ComObject Shell.Application
$x.minimizeall()
$browser = New-Object System.Windows.Forms.FolderBrowserDialog
$browser.RootFolder = "MyComputer"
$null = $browser.ShowDialog()
$path = $browser.SelectedPath
$x.UndoMinimizeALL()
Write-Host "$path"