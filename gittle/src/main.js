const { app, BrowserWindow } = require('electron') 
const path = require('path') 
function createWindow () { 
  const win = new BrowserWindow({ 
    width: 1300, 
    height: 850, 
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation : false
    } 
  }) 
  win.loadURL("http://localhost:3000")
} 
app.whenReady().then(() => { 
  createWindow() 
}) 
app.on('window-all-closed', function () { 
  if (process.platform !== 'darwin') app.quit() 
})