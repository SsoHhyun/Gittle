const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = require('electron-is-dev');


let child_process = require("child_process");
const { check } = require("yargs");
const { response } = require("express");

let runCommand = (command) => {
  return child_process.execSync(command).toString();
};

let currentRepo;
let gitDir;

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, "../public/apple.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.webContents
    .executeJavaScript('localStorage.getItem("currentRepo");', true)
    .then((result) => {
      currentRepo = result;
      gitDir = `--git-dir=${result}\\.git`;
    });

    if (isDev) {
      win.loadURL("http://localhost:3000");
    } else {
      win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
      }));
    }
  
  // win.loadURL("http://localhost:3000");
  // currentRepo = localStorage.getItem("currentRepo");
  // console.log(currentRepo)
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("click", (event, arg) => {
  dialog
    .showOpenDialog({ properties: ["openDirectory"] })
    .then((result) => {
      console.log(result.filePaths[0]);

      event.returnValue = result.filePaths[0];
    })
    .catch((err) => {
      console.log("에러발생", err);
    });
});

ipcMain.on("setting-currentRepo", (event, arg) => {
  console.log(arg);
  currentRepo = arg;
});

ipcMain.on("update-my-repo", (event, arg) => {
  console.log("변화시작");
  const Store = require("electron-store");
  const store = new Store();

  let arr = store.get("gittle-myRepo");
  store.delete("gittle-myRepo");

  if (arr === undefined) {
    arr = [];
  }

  arr.unshift(arg);

  if (arr.length === 4) {
    arr.pop();
  }

  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
  }
  store.set("gittle-myRepo", arr);
});

ipcMain.on("call-my-repo", (event, arg) => {
  const Store = require("electron-store");
  const store = new Store();

  let arr = localStorage.getItem("currentRepo");

  if (arr === undefined) {
    arr = [];
  }

  console.log("arr : " + arr);

  let result = [];

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== null) {
      result.push(arr[i]);
    }

    console.log(arr[i]);
  }

  if (result.length !== arr.length) {
    localStorage.setItem(result);
  }

  console.log(result.length);
  console.log(result);
  console.log("돌아갑니다");
  event.returnValue = result;
});

ipcMain.on("localBranchList", (event, route) => {
  // console.log("로컬 브랜치 리스트");

  const codes = [];
  let localBranchList = runCommand(`git --git-dir=${route}\\.git branch -l`);
  console.log("localBranchList : ", localBranchList);
  codes.push(localBranchList);
  event.returnValue = codes;
});

ipcMain.on("remoteBranchList", (event, route) => {
  // console.log("리모트 브랜치 리스트");

  const codes = [];

  let remoteBranchList;
  try {
    remoteBranchList = runCommand(`git --git-dir=${route}\\.git branch -r`);
  } catch (e) {
    remoteBranchList = [];
  }
  // console.log("remoteBranchList : ", remoteBranchList);

  codes.push(remoteBranchList);
  event.returnValue = codes;
});

ipcMain.on("change branch", (event, route, selectedBranch) => {
  console.log("브랜치 이동");
  console.log("selectedBranch : ", selectedBranch);

  const codes = [];
  let branch;
  try {
    branch = runCommand(
      // `cd "${route}" && git init && git checkout ${selectedBranch}`
      `git --git-dir=${route}\\.git checkout ${selectedBranch} `
    );
    codes.push(branch);
    event.returnValue = codes;
  } catch (error) {
    // branch = runCommand(
    //   `git --git-dir=${route}\\.git stash && git checkout ${selectedBranch} && git stash pop `
    // );
    console.error(error);
    branch = "";
    event.returnValue = "error";
  }
  console.log("change branch : ", branch);
});

// ipcMain.on("gitBranch", (event, newBranch, baseBranch) => {
ipcMain.on("create branch", (event, route, newBranch) => {
  console.log("브랜치 생성");

  const codes = [];
  // let branch = runCommand(`git checkout -b ${newBranch} ${baseBranch}`);
  let branch = runCommand(
    `git --git-dir=${route}\\.git checkout -b ${newBranch} && git --git-dir=${route}\\.git push origin ${newBranch}`
  );
  console.log("add branch : ", branch);
  codes.push(branch);
  event.returnValue = codes;
});

ipcMain.on("deleteLocalBranch", (event, route, delBranch) => {
  console.log("로컬 브랜치 삭제");
  const codes = [];
  let deletebranch;
  try {
    deletebranch = runCommand(
      `git --git-dir=${route}\\.git branch -D ${delBranch}`
    );
    codes.push(deletebranch);

    event.returnValue = codes;
  } catch (error) {
    console.error(error);
    deletebranch = "";
    event.returnValue = "error";
  }
  console.log("delete branch : ", deletebranch);
});

ipcMain.on("deleteRemoteBranch", (event, route, delBranch) => {
  console.log("리모트 브랜치 삭제");
  const codes = [];
  let branch;
  try {
    branch = runCommand(
      `git --git-dir=${route}\\.git push origin -d ${delBranch}`
    );
    codes.push(branch);

    event.returnValue = codes;
  } catch (error) {
    console.error(error);
    branch = "";
    event.returnValue = "error";
  }
  console.log("delete branch : ", branch);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// ipcMain.on("gitStatus", (event, curRepo) => {
//   currentRepo = curRepo;
//   console.log("currentRepo : ", currentRepo);
//   gitDir = `--git-dir=${currentRepo}\\.git`;

//   const option = currentRepo !== null || currentRepo !== undefined ? `${gitDir} --work-tree=${currentRepo}` : ''
//   const data = runCommand(`cd ${currentRepo} && git status -u -s`);
//   event.returnValue = data;
// });

ipcMain.on("gitStatus", (event, curRepo) => {
  currentRepo = curRepo;
  console.log("currentRepo : ", currentRepo);
  gitDir = `--git-dir=${currentRepo}\\.git`;

  const a = curRepo === null ? "./" : curRepo;
  const option =
    currentRepo !== null || currentRepo !== undefined
      ? `${gitDir} --work-tree=${currentRepo}`
      : "";

  const data = runCommand(`cd ${a} && git status -u -s`);

  // const data = runCommand(`git status -u -s`);
  event.returnValue = data;
});

ipcMain.on("WriteCommitRules", (event, payload) => {
  if (!fs.existsSync(`${currentRepo}/commitRules.json`)) {
    console.log("does not exist");
    fs.appendFileSync(
      `${currentRepo}/commitRules.json`,
      "[" + JSON.stringify(payload) + "]"
    );
    const commitRules = JSON.parse(
      fs.readFileSync(`${currentRepo}/commitRules.json`).toString()
    );
    event.returnValue = commitRules;
  } else {
    const commitRules = JSON.parse(
      fs.readFileSync(`${currentRepo}/commitRules.json`).toString()
    );
    commitRules.push(payload);
    fs.writeFileSync(
      `${currentRepo}/commitRules.json`,
      JSON.stringify(commitRules)
    );
    event.returnValue = commitRules;
  }
});

ipcMain.on("ReadCommitRules", (event, currentRepo) => {
  let commitRules = "[]";
  if (!fs.existsSync(`${currentRepo}/commitRules.json`)) {
    commitRules = "[]";
  } else {
    commitRules = fs.readFileSync(`${currentRepo}/commitRules.json`).toString();
  }
  event.returnValue = commitRules;
});

ipcMain.on("git-Clone", (event, payload) => {
  console.log("도착했습니다");
  console.log("저장소 루트 : " + payload.cloneRoot);
  console.log("폴더 루트 : " + payload.repoRoot);
  let stringArr = payload.cloneRoot.split("/");
  for (let i = 0; i < stringArr.length; i++) {
    console.log(i, "번째 : ", stringArr[i]);
  }

  let temp = stringArr[stringArr.length - 1];
  let folderName = temp.substr(0, temp.length - 4);
  console.log("folderName : ", folderName);
  runCommand(`cd "${payload.repoRoot}" && git clone ${payload.cloneRoot}`);
  runCommand(`cd "${payload.repoRoot}" && git config --global core.quotepath false `);
  console.log("돌아갑니다");
  event.returnValue = folderName;
});

ipcMain.on("git-Init", (event, payload) => {
  console.log("repoName : " + payload.repoName);
  console.log("repoRoot : " + payload.repoRoot);
  runCommand(
    `cd "${payload.repoRoot}" && mkdir ${payload.repoName}  && cd ${payload.repoName}  && git init`
  );
  runCommand(`cd "${payload.repoRoot}" && git config --global core.quotepath false `);
  event.returnValue = payload.repoName + "\\" + payload.repoRoot;
});

ipcMain.on("check-git-folder", (event, root) => {
  // const arr=runCommand(`cd ${root} && ls`).split('\n')

  try {
    runCommand(`cd ${root}\\.git`);
    event.returnValue = "true";
  } catch (e) {
    event.returnValue = "false";
  }

  // let flag = false
  // for(let i=0;i<arr.length;i++){
  //   if(arr[i]==='.git'){
  //     flag=true;
  //     break;
  //   }
  // }

  // event.returnValue = flag
});

ipcMain.on("gitDiff", (event, arg) => {
  console.log("코드 전후 비교해볼래");
  console.log(arg);
  const codes = [];
  arg.map((file) => {
    // const name = file.split("/");
    // const fileName = name[name.length - 1];
    let diff = runCommand(`git -C ${currentRepo} diff ${file}`);
    console.log("git diff : ", diff);
    codes.push(diff);
  });

  event.returnValue = codes;
  // const Store=require('electron-store')
  // const store = new Store()

  // let arr = store.get('gittle-myRepo')

  // if(arr===undefined){
  //   arr=[]
  // }
  // console.log(arr)
  // console.log('돌아갑니다')
  // event.sender.send('return-2',arr)
});
ipcMain.on("gitAdd", (event, files) => {
  let data = runCommand(`cd ${currentRepo} && git add ${files}`);
  console.log(data);
});

ipcMain.on("gitReset", (event, files) => {
  let data = runCommand(`git -C ${currentRepo} reset ${files}`);
  console.log(data);
});

ipcMain.on("git-Branch", (event, payload) => {
  try {
    let data = runCommand(`cd "${payload}" && git branch -r`);
    let result = data.split("\n");
    let arr = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i].length !== 0) {
        let tempArr = result[i].split("/");
        let temp = "";
        for (let j = 1; j < tempArr.length; j++) {
          temp += tempArr[j];
          if (j !== tempArr.length - 1) {
            temp += "/";
          }
        }

        arr.push(temp);
      }
    }
    event.returnValue = arr;
  } catch (e) {
    event.returnValue = [];
  }
});

ipcMain.on("gitBranch", (event, route) => {
  // console.log("현재 작업 중인 브랜치를 보여줘");
  //console.log(route);
  let branch = runCommand(
    `git --git-dir=${route}\\.git branch --show-current `
  );
  //console.log("브랜치이이이", branch);
  event.returnValue = branch;
});

ipcMain.on("gitCommit", (event, commitMessage) => {
  let data = runCommand(`git -C ${currentRepo} commit -m "${commitMessage}"`);
  //console.log(data);
  event.returnValue = data;
});

ipcMain.on("lastCommitDescription", (event, command) => {
  let data;
  try {
    data = runCommand(command);
    data = data.substring(1, data.length - 1);
    data = data.includes(" : ") ? data.split(" : ")[1] : data;
  } catch (error) {
    console.error(error);
    data = "";
  }
  event.returnValue = data;
});

ipcMain.on("gitPull", (event, route, targetBranch) => {
  console.log("gitPull");

  let pull;
  try {
    pull = runCommand(
      // `git --git-dir=${route}\\.git pull origin ${targetBranch}`
      `cd ${route} && git pull origin ${targetBranch}`
    );
    console.log("pull", pull);
    event.returnValue = pull;
  } catch (error) {
    console.error("error", error);
    pull = "";
    event.returnValue = "error";
  }
});

ipcMain.on("git-Push", (event, payload) => {
  console.log("repo입니다 : ", payload.repoRoot);
  console.log("브랜치입니다 : ", payload.branch);

  try {
    runCommand(`cd "${payload.repoRoot}" && git push origin ${payload.branch}`);
    event.returnValue = "return";
  } catch (exception) {
    console.log("오류가 발생했습니다.");
    console.log(exception);
    event.returnValue = "error";
  }

  console.log("완료되었습니다");
});

ipcMain.on("call-committed-files", (event, root) => {
  let commitIdList;
  try {
    commitIdList = runCommand(
      `cd ${root} && git log --branches --not --remotes`
    );
    if (commitIdList.trim() === "") {
      event.returnValue = [];
    } else {
      let temp1 = commitIdList.split("\n")[0];
      let tempArr = temp1.split(" ");

      let commitId = tempArr[1];
      //실행
      const returnArr = runCommand(
        `cd "${root}" && git show --pretty="" --name-only ${commitId}`
      );
      event.returnValue = returnArr;
    }
  } catch (e) {
    event.returnValue = "no";
  }
});




ipcMain.on("openTerminal", (event, currentRepo) => {
  console.log("asdf");
  child_process.exec(
    `cd ${currentRepo} && start "" "%PROGRAMFILES%\\Git\\bin\\sh.exe" --login`
  );
});

ipcMain.on("gitStash", (event, route) => {
  console.log("gitStash");
  console.log("cur", route);
  const stash = runCommand(`git --git-dir=${route}\\.git stash`);
  console.log("gitStash", stash);
  event.returnValue = stash;
});
ipcMain.on("gitGraph", (event) => {
  const gitGraph = runCommand(
    "git log --branches --decorate --graph --oneline"
  );
  event.returnValue = gitGraph;
});
